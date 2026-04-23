const prepareExpression = (expr, row) => {
    if (!expr) return null;

    let processed = expr.toLowerCase();

    // 1. Math Functions Mapping (All standard SQL Math functions)
    processed = processed
        // Basic Math
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/abs\(/g, 'Math.abs(')
        .replace(/power\(/g, 'Math.pow(')
        .replace(/\^/g, '**') // Supports both POWER(a,b) and a^b
        
        // Logarithms & Exponential
        .replace(/log\(/g, 'Math.log(')   // Natural log (ln)
        .replace(/log10\(/g, 'Math.log10(') 
        .replace(/exp\(/g, 'Math.exp(')
        
        // Rounding & Limits
        .replace(/round\(/g, 'Math.round(')
        .replace(/floor\(/g, 'Math.floor(')
        .replace(/ceiling\(/g, 'Math.ceil(') 
        .replace(/ceil\(/g, 'Math.ceil(')
        
        // Trigonometry (In case you add geometry formulas)
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/pi\(\)/g, 'Math.PI')
        
        // Min/Max (Note: JS Math.min/max takes multiple args)
        .replace(/square\(/g, 'Math.pow('); // If someone uses SQUARE(a), we'll need to handle the ,2 manually or via regex

    // 2. Logical Operators & SQL Specifics
    processed = processed
        .replace(/<>/g, '!==')
        .replace(/=(?!=)/g, '===') // Replaces = with === but leaves already existing === alone
        .replace(/\band\b/g, '&&')
        .replace(/\bor\b/g, '||')
        .replace(/\bnot\b/g, '!')
        .replace(/\bis null\b/g, '=== null')
        .replace(/\bis not null\b/g, '!== null');

    // 3. Columns to Values (The most critical part)
    // We use \b to make sure we only replace standalone 'a','b','c','d' 
    // and not the letters inside 'Math' or 'cos'
    return processed
        .replace(/\ba\b/g, row.a)
        .replace(/\bb\b/g, row.b)
        .replace(/\bc\b/g, row.c)
        .replace(/\bd\b/g, row.d);
};

module.exports = { prepareExpression };