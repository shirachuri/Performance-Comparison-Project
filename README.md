# Performance Comparison Project: SQL Server vs C# .NET vs Node.js

## 🌐 Live Demo
The performance dashboard is available online: 
**[View Live Dashboard](https://performance-comparison-project.vercel.app)**

## 📋 Project Overview
This project compares three different calculation engines (SQL Server, C# .NET, and Node.js) by processing **1,000,000 rows** of data with dynamic mathematical formulas. The results are visualized in a React-based dashboard.

## 📄 Final Report
A detailed analysis of the results, including technical insights and performance conclusions, can be found in the **Final_Report.pdf** file in the root directory.

## 📁 Repository Structure
* **01_Infrastructure_and_Data:** Contains SQL scripts: `01_Create_Schema.sql`, `02_Seed_Data.sql`, and `03_Verification_Scripts.sql`.
* **02_SQL_Method:** Stored Procedures for dynamic SQL-based calculations.
* **03_NodeJS_Method:** Node.js worker using `eval()` for dynamic calculations (includes `.env` configuration).
* **04_CSharp_Solution:** Visual Studio Solution (`CSharp_Solution.sln`) containing:
    * `FormulaProject.Calculator`: Console Engine for massive data processing.
    * `FormulaProject.Api`: Web API for serving the results.
* **05-performance-dashboard:** React frontend (Vite) for data visualization.
* **Screenshots:** Visual evidence of the database, consistency checks, and the dashboard.

## 🚀 How to Run

### 1. Database Setup
* Navigate to `01_Infrastructure_and_Data`.
* Execute `01_Create_Schema.sql` to build the tables.
* Execute `02_Seed_Data.sql` to generate 1,000,000 rows.

### 2. Environment Configuration (ENV)
* **Node.js (03):** Create/update the `.env` file with your SQL Server credentials.
* **C# (04):** Update `appsettings.json` in both `FormulaProject.Api` and `FormulaProject.Calculator` with your Connection String.
* **React (05):** Update the `.env` file with the `REACT_APP_API_URL` variable to point to your backend API.

### 3. Execution Flow
* **C# .NET:** Open `CSharp_Solution.sln`. Run the **Calculator** project to process data, then run the **Api** project.
* **Node.js:** Navigate to `03_NodeJS_Method`, run `npm install` and then `node app.js`.
* **Frontend:** Navigate to `05-performance-dashboard`, run `npm install` and then `npm start`.

## 📊 Key Findings & Data Integrity

### 1. Data Verification (Accuracy Check)
To ensure a fair and valid benchmark, it was mandatory that all three engines produce identical mathematical results. 
* **The Process:** We used the `03_Verification_Scripts.sql` to perform a row-by-row comparison of the results.
* **The Result:** The verification script returned an **empty set (0 rows)**, confirming 100% data consistency across all 1,000,000 rows. This proves that performance differences are purely architectural and not due to calculation errors.

### 2. Performance Comparison
As detailed in the **Final_Report.pdf**:
* **🏆 SQL Server (Winner):** Fastest execution. Minimal overhead as calculations happen directly within the data engine.
* **🥈 C# .NET:** Strong performance with high memory efficiency using `DataTable.Compute` and optimized batching.
* **🥉 Node.js:** Flexible but slower for heavy CPU-bound string evaluation compared to the other methods.