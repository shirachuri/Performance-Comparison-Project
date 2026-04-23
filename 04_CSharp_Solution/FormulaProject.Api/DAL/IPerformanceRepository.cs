using FormulaProject.Api.Models;

namespace FormulaProject.Api.Data
{
    public interface IPerformanceRepository
    {
        Task<IEnumerable<PerformanceResult>> GetPerformanceStatsAsync();
    }
}