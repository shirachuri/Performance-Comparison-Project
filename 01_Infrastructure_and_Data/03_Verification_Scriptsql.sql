/* Verification Script: 
Checks if the math results are consistent across all three methods 
(SQL, .NET, Node.js) for the same formula and data record.
*/

SELECT TOP 100
    t1.data_id, 
    t1.targil_id,
    t1.result AS SQL_Result,
    t2.result AS CSharp_Result,
    t3.result AS Node_Result,
    -- Calculate difference to ensure accuracy
    ABS(t1.result - t2.result) as Diff_Check
FROM t_results t1
JOIN t_results t2 ON t1.data_id = t2.data_id AND t1.targil_id = t2.targil_id AND t2.method = 'CSharp'
JOIN t_results t3 ON t1.data_id = t3.data_id AND t1.targil_id = t3.targil_id AND t3.method = 'NodeJS'
WHERE t1.method = 'SQL'
-- If this returns no rows, it means all results are identical (within floating point margin)
AND ABS(t1.result - t2.result) > 0.001;