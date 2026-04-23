using FormulaProject.Api.Models;

public interface IPerformanceService
{
    Task<IEnumerable<PerformanceResult>> GetProcessedStatsAsync();
}