namespace FormulaProject.Api.Models
{
    public class PerformanceResult
    {
        public string Name { get; set; }
        public decimal? SQL { get; set; }
        public decimal? NodeJS { get; set; }
        public decimal? CSharp { get; set; }
    }
}
