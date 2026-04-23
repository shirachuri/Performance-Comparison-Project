using FormulaProject.Api.Models;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace FormulaProject.Api.Data
{
    public class PerformanceRepository : IPerformanceRepository
    {
        private readonly string _connectionString;

        // Injecting IConfiguration to avoid hardcoding the connection string
        public PerformanceRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<IEnumerable<PerformanceResult>> GetPerformanceStatsAsync()
        {
            var results = new List<PerformanceResult>();

            using (var conn = new SqlConnection(_connectionString))
            {
                // Query to pivot the data: calculate average run time per method for each formula
                string query = @"
                    SELECT 
                        targil_id AS Name,
                        CAST(AVG(CASE WHEN method = 'SQL' THEN run_time END) AS DECIMAL(10,3)) AS SQL,
                        CAST(AVG(CASE WHEN method = 'NodeJS' THEN run_time END) AS DECIMAL(10,3)) AS NodeJS,
                        CAST(AVG(CASE WHEN method = 'CSharp' THEN run_time END) AS DECIMAL(10,3)) AS CSharp
                    FROM t_log
                    GROUP BY targil_id
                    ORDER BY CAST(targil_id AS INT)";

                using (var cmd = new SqlCommand(query, conn))
                {
                    await conn.OpenAsync();
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            // Map SQL results to the PerformanceResult model
                            results.Add(new PerformanceResult
                            {
                                Name = reader["Name"].ToString(),
                                // Handle potential null values from the DB
                                SQL = reader["SQL"] != DBNull.Value ? Convert.ToDecimal(reader["SQL"]) : null,
                                NodeJS = reader["NodeJS"] != DBNull.Value ? Convert.ToDecimal(reader["NodeJS"]) : null,
                                CSharp = reader["CSharp"] != DBNull.Value ? Convert.ToDecimal(reader["CSharp"]) : null
                            });
                        }
                    }
                }
            }
            return results;
        }
    }
}