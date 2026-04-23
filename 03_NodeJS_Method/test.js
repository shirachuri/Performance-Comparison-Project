const sql = require('mssql'); 
const config = require('./dbConfig');

async function connectTest() {
    try {
        console.log("Connecting to SQL Server using Windows Auth...");
        await sql.connect(config);
        console.log("Connection Successful!");
        
        const result = await sql.query`SELECT TOP 1 targil FROM t_targil`;
        console.log("Data sample from DB:", result.recordset[0]);
        
        await sql.close();
    } catch (err) {
        console.error("Connection failed:", err.message);
    }
}

connectTest();