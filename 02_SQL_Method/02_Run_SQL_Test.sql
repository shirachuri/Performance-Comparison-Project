/* Logic Explanation:
   We delete only previous 'SQL' results before execution. 
   This ensures that:
   1. We don't have duplicate data for the same method.
   2. We don't accidentally delete results from other methods (Node.js/C#).
   3. Our performance logs (t_log) stay accurate for the current run.
*/

-- 1. Cleanup old SQL results to maintain data integrity
DELETE FROM t_results WHERE method = 'SQL';
DELETE FROM t_log WHERE method = 'SQL';

-- 2. Execute the dynamic calculation engine
-- This will process 1,000,000 rows for each formula in t_targil
EXEC sp_CalculateDynamicFormulas;

-- 3. Review the execution times to compare performance later
SELECT * FROM t_log WHERE method = 'SQL' ORDER BY targil_id;

-- 4. Quick verification of the results
SELECT TOP 100 * FROM t_results WHERE method = 'SQL';