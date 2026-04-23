using FormulaProject.Api.Data;
using FormulaProject.Api.Models;

namespace FormulaProject.Api.Services
{
    public class PerformanceService : IPerformanceService
    {
        private readonly IPerformanceRepository _repository;

        public PerformanceService(IPerformanceRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<PerformanceResult>> GetProcessedStatsAsync()
        {
            return await _repository.GetPerformanceStatsAsync();
        }
    }
}