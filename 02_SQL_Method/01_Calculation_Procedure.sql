CREATE OR ALTER PROCEDURE sp_CalculateDynamicFormulas
AS
BEGIN
    DECLARE @TargilID INT, @Formula VARCHAR(MAX), @Condition VARCHAR(MAX), @FormulaFalse VARCHAR(MAX);
    -- Changed to DATETIME2 for higher precision
    DECLARE @StartTime DATETIME2, @EndTime DATETIME2; 
    DECLARE @DynamicSQL NVARCHAR(MAX);

    -- Cursor to iterate through each formula in t_targil
    DECLARE formula_cursor CURSOR FOR 
    SELECT targil_id, targil, tnai, targil_false FROM t_targil;

    OPEN formula_cursor;
    FETCH NEXT FROM formula_cursor INTO @TargilID, @Formula, @Condition, @FormulaFalse;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @StartTime = SYSDATETIME(); -- Start timing with microsecond precision

        -- Build the calculation logic: Handle IF/ELSE conditions if they exist
        IF @Condition IS NOT NULL AND @Condition <> ''
        BEGIN
            SET @DynamicSQL = 'INSERT INTO t_results (data_id, targil_id, method, result) ' +
                              'SELECT data_id, ' + CAST(@TargilID AS VARCHAR) + ', ''SQL'', ' +
                              'CASE WHEN ' + @Condition + ' THEN ' + @Formula + 
                              ' ELSE ' + @FormulaFalse + ' END FROM t_data';
        END
        ELSE
        BEGIN
            SET @DynamicSQL = 'INSERT INTO t_results (data_id, targil_id, method, result) ' +
                              'SELECT data_id, ' + CAST(@TargilID AS VARCHAR) + ', ''SQL'', ' + 
                              @Formula + ' FROM t_data';
        END

        -- Execute the generated SQL
        EXEC sp_executesql @DynamicSQL;

        SET @EndTime = SYSDATETIME(); -- End timing

        -- Log the performance (Duration in seconds with decimal precision)
        -- Using MILLISECOND and dividing by 1000.0 to get exact decimal seconds
        INSERT INTO t_log (targil_id, method, run_time)
        VALUES (@TargilID, 'SQL', DATEDIFF(MILLISECOND, @StartTime, @EndTime) / 1000.0);

        FETCH NEXT FROM formula_cursor INTO @TargilID, @Formula, @Condition, @FormulaFalse;
    END

    CLOSE formula_cursor;
    DEALLOCATE formula_cursor;
END;