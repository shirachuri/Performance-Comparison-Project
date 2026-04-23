const sql = require('mssql');
const config = require('./dbConfig');
const { prepareExpression } = require('./parser');

async function runNodeMethod() {
    let pool;
    try {
        // Establish connection to the SQL Server
        pool = await sql.connect(config);
        console.log("Connected. Running with Batch-Processing to prevent crashes...");

        // 1. Cleanup: Remove previous NodeJS results and logs before starting the new run
        await pool.request().query("DELETE FROM t_results WHERE method = 'NodeJS'");
        await pool.request().query("DELETE FROM t_log WHERE method = 'NodeJS'"); 

        // Fetch the list of formulas/tasks to process
        const targils = await pool.request().query("SELECT * FROM t_targil");

        // Iterate through each formula (Targil)
        for (let f of targils.recordset) {
            const targilStartTime = Date.now(); // Start timing the entire process for this formula
            console.log(`--- Starting Targil ${f.targil_id} ---`);

            const request = new sql.Request(pool);
            request.stream = true; // Use streaming to handle large datasets without overwhelming RAM
            request.query("SELECT data_id, a, b, c, d FROM t_data");

            let currentBatch = [];
            const BATCH_SIZE = 100000; // Define batch size (100k rows) for stable DB inserts

            await new Promise((resolve, reject) => {
                // Event listener for each row retrieved from the database
                request.on('row', async row => {
                    try {
                        let res;
                        // Check if there is a condition (tnai) to evaluate
                        if (f.tnai && f.tnai.trim() !== "") {
                            const condition = prepareExpression(f.tnai, row);
                            // Evaluate condition and choose the corresponding formula
                            res = eval(condition) 
                                ? eval(prepareExpression(f.targil, row)) 
                                : eval(prepareExpression(f.targil_false, row));
                        } else {
                            // No condition: Evaluate the main formula directly
                            res = eval(prepareExpression(f.targil, row));
                        }

                        // Sanitize result: Convert Infinity or NaN to null for SQL compatibility
                        const cleanRes = (res === Infinity || isNaN(res)) ? null : res;

                        // Add the processed result to the current batch
                        currentBatch.push({
                            data_id: row.data_id,
                            targil_id: f.targil_id,
                            method: 'NodeJS',
                            result: cleanRes
                        });

                        // When batch reaches the limit, save it to the database
                        if (currentBatch.length >= BATCH_SIZE) {
                            request.pause(); // Pause streaming to allow the Bulk Insert to complete
                            await saveBatch(pool, currentBatch);
                            currentBatch = []; // Clear the batch array
                            request.resume(); // Resume streaming for next rows
                        }
                    } catch (e) {
                        // Individual calculation errors are caught here to prevent the whole app from crashing
                    }
                });

                request.on('error', err => reject(err));

                // Finalize: Save any remaining rows in the last batch after stream ends
                request.on('done', async () => {
                    if (currentBatch.length > 0) {
                        await saveBatch(pool, currentBatch);
                    }
                    resolve();
                });
            });

            // Calculate total duration for this Targil and log it to t_log
            const duration = (Date.now() - targilStartTime) / 1000;
            await pool.request().query(`
                INSERT INTO t_log (targil_id, method, run_time)
                VALUES (${f.targil_id}, 'NodeJS', ${duration})
            `);

            console.log(`Targil ${f.targil_id} fully completed and logged: ${duration}s`);
        }

    } catch (err) {
        console.error("Critical Error:", err.message);
    } finally {
        // Ensure the connection pool is closed even if an error occurs
        if (pool) await pool.close();
    }
}

/**
 * Helper function to perform a Bulk Insert of a data batch
 * @param {sql.ConnectionPool} pool 
 * @param {Array} dataArray 
 */
async function saveBatch(pool, dataArray) {
    const table = new sql.Table('t_results');
    table.columns.add('data_id', sql.Int, { nullable: false });
    table.columns.add('targil_id', sql.Int, { nullable: false });
    table.columns.add('method', sql.VarChar(50), { nullable: false });
    table.columns.add('result', sql.Float, { nullable: true });

    // Map the array items into the SQL table rows
    dataArray.forEach(item => {
        table.rows.add(item.data_id, item.targil_id, item.method, item.result);
    });

    const bulkRequest = new sql.Request(pool);
    bulkRequest.timeout = 300000; // Set a 5-minute timeout for the bulk operation
    await bulkRequest.bulk(table);
    console.log(`  > Saved batch of ${dataArray.length} rows...`);
}

// Execute the main process
runNodeMethod();