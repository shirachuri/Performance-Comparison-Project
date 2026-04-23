-- 1. Data table
CREATE TABLE t_data (
    data_id INT PRIMARY KEY IDENTITY(1,1),
    a FLOAT NOT NULL,
    b FLOAT NOT NULL,
    c FLOAT NOT NULL,
    d FLOAT NOT NULL
);

-- 2. Formulas table
CREATE TABLE t_targil (
    targil_id INT PRIMARY KEY IDENTITY(1,1),
    targil VARCHAR(MAX) NOT NULL,       
    tnai VARCHAR(MAX) NULL,             
    targil_false VARCHAR(MAX) NULL     
);

-- 3. Results table
CREATE TABLE t_results (
    result_id INT PRIMARY KEY IDENTITY(1,1),
    data_id INT NOT NULL,
    targil_id INT NOT NULL,
    method VARCHAR(50) NOT NULL,        
    result FLOAT
);

-- 4. Performance log
CREATE TABLE t_log (
    log_id INT PRIMARY KEY IDENTITY(1,1),
    targil_id INT NOT NULL,
    method VARCHAR(50) NOT NULL,
    run_time FLOAT                      
);
