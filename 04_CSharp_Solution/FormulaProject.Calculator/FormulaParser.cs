using System;
using System.Text.RegularExpressions;

namespace FormulaSolverCSharp
{
    public static class FormulaParser
    {
        public static string PrepareExpression(string expr, double a, double b, double c, double d)
        {
            if (string.IsNullOrEmpty(expr)) return null;

            string processed = expr.ToLower();

            // SQL Math to C# Math
            processed = processed.Replace("sqrt(", "Math.Sqrt(")
                                 .Replace("power(", "Math.Pow(")
                                 .Replace("abs(", "Math.Abs(")
                                 .Replace("log(", "Math.Log(");

            // SQL Logic to C# Logic
            processed = processed.Replace("<>", "!=")
                                 .Replace("and", "&&")
                                 .Replace("or", "||");

            // Convert single '=' to '==' but not inside >= or <=
            processed = Regex.Replace(processed, @"(?<![<>!])=(?!=)", "==");

            // Replace variables with actual numbers
            processed = Regex.Replace(processed, @"\ba\b", a.ToString());
            processed = Regex.Replace(processed, @"\bb\b", b.ToString());
            processed = Regex.Replace(processed, @"\bc\b", c.ToString());
            processed = Regex.Replace(processed, @"\bd\b", d.ToString());

            return processed;
        }
    }
}