using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class PerformanceController : ControllerBase
{
    private readonly IPerformanceService _service;

    public PerformanceController(IPerformanceService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var data = await _service.GetProcessedStatsAsync();
        return Ok(data);
    }
}