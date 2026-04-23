require('dotenv').config();

// Standard SQL Authentication configuration
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
    // Adding timeout settings for big data
    requestTimeout: 300000, // 5 minutes
    connectionTimeout: 30000
};

module.exports = config;