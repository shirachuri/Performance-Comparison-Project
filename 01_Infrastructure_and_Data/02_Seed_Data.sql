-- Fill t_data with 1,000,000 records using a system object cross join for speed
INSERT INTO t_data (a, b, c, d)
SELECT TOP 1000000 
    ABS(CHECKSUM(NEWID()) % 100) + 1, -- Random value for 'a'
    ABS(CHECKSUM(NEWID()) % 100) + 1, -- Random value for 'b'
    ABS(CHECKSUM(NEWID()) % 100) + 1, -- Random value for 'c'
    ABS(CHECKSUM(NEWID()) % 100) + 1  -- Random value for 'd'
FROM sys.all_objects a
CROSS JOIN sys.all_objects b;

-- Clean previous samples if they exist
TRUNCATE TABLE t_targil;

-- Insert a wide variety of formulas to cover all requirements
INSERT INTO t_targil (targil, tnai, targil_false) VALUES 
-- 1. Simple Formulas
('a + b', NULL, NULL),                     -- Addition
('c * 2', NULL, NULL),                     -- Multiplication by constant
('b - a', NULL, NULL),                     -- Subtraction
('d / 4', NULL, NULL),                     -- Division

-- 2. Complex Formulas
('(a + b) * 8', NULL, NULL),               -- Grouping with parenthesis
('sqrt(power(c, 2) + power(d, 2))', NULL, NULL), -- Square root and power (Pythagorean)
('log(b) + c', NULL, NULL),                -- Natural Logarithm
('abs(d - b)', NULL, NULL),                -- Absolute value

-- 3. Conditional Formulas (The "Bonus" section)
('b * 2', 'a > 5', 'b / 2'),               -- If a > 5 then b*2 else b/2
('a + 1', 'b < 10', 'd - 1'),              -- If b < 10 then a+1 else d-1
('1', 'a = c', '0');                       -- Comparison (If a=c then 1 else 0)