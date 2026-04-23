using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Text.RegularExpressions;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using DynamicExpresso;

namespace FormulaSolverCSharp
{
    class Program
    {
        static string connString;

        static async Task Main(string[] args)
        {
            try
            {
                // Setup configuration to read connection string from appsettings.json
                var config = new ConfigurationBuilder()
                    .SetBasePath(AppDomain.CurrentDomain.BaseDirectory)
                    .AddJsonFile("appsettings.json")
                    .Build();

                connString = config.GetConnectionString("DefaultConnection");

                using var connection = new SqlConnection(connString);
                await connection.OpenAsync();
                Console.WriteLine("Connected to SQL Server. Method: C# Compiled BulkCopy.");

                // Cleanup previous results for this method
                var cleanupCmd = new SqlCommand("DELETE FROM t_results WHERE method = 'CSharp'; DELETE FROM t_log WHERE method = 'CSharp';", connection);
                await cleanupCmd.ExecuteNonQueryAsync();

                // Initialize the math-capable interpreter
                var interpreter = SetupInterpreter();

                // Fetch formulas from the database
                var formulas = await GetFormulasFromDb(connection);

                foreach (var f in formulas)
                {
                    Console.WriteLine($"--- Starting Formula {f.Id} ---");
                    Stopwatch sw = Stopwatch.StartNew();

                    // 1. Prepare and Compile formulas into highly efficient Delegates
                    // Compiling once per formula (instead of per row) drastically improves performance
                    var mainFunc = interpreter.ParseAsDelegate<Func<double, double, double, double, double>>(PrepareFormula(f.Targil), "a", "b", "c", "d");

                    Func<double, double, double, double, bool> conditionFunc = null;
                    if (!string.IsNullOrEmpty(f.Tnai))
                        conditionFunc = interpreter.ParseAsDelegate<Func<double, double, double, double, bool>>(PrepareFormula(f.Tnai), "a", "b", "c", "d");

                    Func<double, double, double, double, double> falseFunc = null;
                    if (!string.IsNullOrEmpty(f.TargilFalse))
                        falseFunc = interpreter.ParseAsDelegate<Func<double, double, double, double, double>>(PrepareFormula(f.TargilFalse), "a", "b", "c", "d");

                    // 2. Process data stream using a forward-only SqlDataReader for low memory footprint
                    using var dataCmd = new SqlCommand("SELECT data_id, a, b, c, d FROM t_data", connection);
                    using var dataReader = await dataCmd.ExecuteReaderAsync();

                    DataTable batchTable = CreateResultsDataTable();
                    const int BATCH_SIZE = 100000;

                    while (await dataReader.ReadAsync())
                    {
                        int dataId = (int)dataReader["data_id"];
                        double a = Convert.ToDouble(dataReader["a"]);
                        double b = Convert.ToDouble(dataReader["b"]);
                        double c = Convert.ToDouble(dataReader["c"]);
                        double d = Convert.ToDouble(dataReader["d"]);

                        try
                        {
                            double finalResult;
                            // Execute the compiled logic based on the condition
                            if (conditionFunc != null)
                            {
                                finalResult = conditionFunc(a, b, c, d) ? mainFunc(a, b, c, d) : falseFunc(a, b, c, d);
                            }
                            else
                            {
                                finalResult = mainFunc(a, b, c, d);
                            }

                            // Handle mathematical edge cases
                            object dbVal = (double.IsInfinity(finalResult) || double.IsNaN(finalResult)) ? DBNull.Value : (object)finalResult;
                            batchTable.Rows.Add(dataId, f.Id, "CSharp", dbVal);
                        }
                        catch { batchTable.Rows.Add(dataId, f.Id, "CSharp", DBNull.Value); }

                        // 3. Batch insert using SqlBulkCopy to maintain high throughput
                        if (batchTable.Rows.Count >= BATCH_SIZE)
                        {
                            await SaveBatch(batchTable);
                            batchTable.Rows.Clear();
                        }
                    }

                    // Save any remaining records in the last batch
                    if (batchTable.Rows.Count > 0) await SaveBatch(batchTable);

                    sw.Stop();
                    await LogPerformance(connection, f.Id, sw.Elapsed.TotalSeconds);
                    Console.WriteLine($"Formula {f.Id} completed in {sw.Elapsed.TotalSeconds:F2} seconds.");
                }
            }
            catch (Exception ex) { Console.WriteLine("Critical Error: " + ex.Message); }
        }

        // --- Helper Methods ---

        // Configures the DynamicExpresso interpreter with required math functions
        private static Interpreter SetupInterpreter()
        {
            var interpreter = new Interpreter();

            // Mapping SQL-style function names to .NET Math library
            interpreter.Reference(typeof(Math));
            interpreter.SetFunction("sqrt", (Func<double, double>)Math.Sqrt);
            interpreter.SetFunction("abs", (Func<double, double>)Math.Abs);
            interpreter.SetFunction("log", (Func<double, double>)Math.Log);
            interpreter.SetFunction("log10", (Func<double, double>)Math.Log10);
            interpreter.SetFunction("exp", (Func<double, double>)Math.Exp);
            interpreter.SetFunction("power", (Func<double, double, double>)Math.Pow);
            interpreter.SetFunction("round", (Func<double, int, double>)((val, digits) => Math.Round(val, digits)));

            return interpreter;
        }

        // Converts SQL syntax symbols to C# compatible operators
        private static string PrepareFormula(string formula)
        {
            if (string.IsNullOrEmpty(formula)) return formula;

            string processed = formula.ToLower();
            processed = processed.Replace(" and ", " && ")
                                 .Replace(" or ", " || ")
                                 .Replace("not", " ! ")
                                 .Replace("<>", "!=");

            // Replace single '=' with '==' for logic comparisons, ignoring existing operators
            processed = Regex.Replace(processed, @"(?<![<>!])=(?!=)", "==");
            processed = processed.Replace("is null", " == null");

            return processed;
        }

        private static async Task<List<dynamic>> GetFormulasFromDb(SqlConnection conn)
        {
            var list = new List<dynamic>();
            using var cmd = new SqlCommand("SELECT targil_id, tnai, targil, targil_false FROM t_targil", conn);
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new
                {
                    Id = (int)reader["targil_id"],
                    Tnai = reader["tnai"]?.ToString(),
                    Targil = reader["targil"].ToString(),
                    TargilFalse = reader["targil_false"]?.ToString()
                });
            }
            return list;
        }

        private static DataTable CreateResultsDataTable()
        {
            DataTable table = new DataTable();
            table.Columns.Add("data_id", typeof(int));
            table.Columns.Add("targil_id", typeof(int));
            table.Columns.Add("method", typeof(string));
            table.Columns.Add("result", typeof(double));
            return table;
        }

        // Performs a fast bulk insert into the database
        private static async Task SaveBatch(DataTable table)
        {
            using var bulkCopy = new SqlBulkCopy(connString);
            bulkCopy.DestinationTableName = "t_results";
            bulkCopy.ColumnMappings.Add("data_id", "data_id");
            bulkCopy.ColumnMappings.Add("targil_id", "targil_id");
            bulkCopy.ColumnMappings.Add("method", "method");
            bulkCopy.ColumnMappings.Add("result", "result");
            await bulkCopy.WriteToServerAsync(table);
        }

        private static async Task LogPerformance(SqlConnection conn, int id, double seconds)
        {
            using var cmd = new SqlCommand("INSERT INTO t_log (targil_id, method, run_time) VALUES (@id, 'CSharp', @time)", conn);
            cmd.Parameters.AddWithValue("@id", id);
            cmd.Parameters.AddWithValue("@time", seconds);
            await cmd.ExecuteNonQueryAsync();
        }
    }
}