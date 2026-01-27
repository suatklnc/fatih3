using Microsoft.AspNetCore.Mvc;
using MaterialManagement.Models;
using MaterialManagement.Services;

namespace MaterialManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MaterialsController : ControllerBase
{
    private readonly IMaterialService _materialService;
    private readonly ILogger<MaterialsController> _logger;

    public MaterialsController(IMaterialService materialService, ILogger<MaterialsController> logger)
    {
        _materialService = materialService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetAll()
    {
        try
        {
            var materials = await _materialService.GetAllMaterialsAsync();
            // Anonymous object ile BaseModel'den gelen property'leri temizle
            var cleanMaterials = materials.Select(m => new
            {
                m.Id,
                m.Code,
                m.Name,
                m.Description,
                m.Unit,
                m.Category,
                m.StockQuantity,
                m.MinStockLevel,
                m.CreatedAt,
                m.UpdatedAt
            }).ToList();
            return Ok(cleanMaterials);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all materials: {Message}", ex.Message);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetById(Guid id)
    {
        try
        {
            var material = await _materialService.GetMaterialByIdAsync(id);
            if (material == null)
                return NotFound();
            
            return Ok(new
            {
                material.Id,
                material.Code,
                material.Name,
                material.Description,
                material.Unit,
                material.Category,
                material.StockQuantity,
                material.MinStockLevel,
                material.CreatedAt,
                material.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting material: {Id}", id);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] Material material)
    {
        try
        {
            var created = await _materialService.CreateMaterialAsync(material);
            return Ok(new
            {
                created.Id,
                created.Code,
                created.Name,
                created.Description,
                created.Unit,
                created.Category,
                created.StockQuantity,
                created.MinStockLevel,
                created.CreatedAt,
                created.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating material: {Message}", ex.Message);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<object>> Update(Guid id, [FromBody] Material material)
    {
        try
        {
            var updated = await _materialService.UpdateMaterialAsync(id, material);
            return Ok(new
            {
                updated.Id,
                updated.Code,
                updated.Name,
                updated.Description,
                updated.Unit,
                updated.Category,
                updated.StockQuantity,
                updated.MinStockLevel,
                updated.CreatedAt,
                updated.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating material: {Id}", id);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var result = await _materialService.DeleteMaterialAsync(id);
            if (!result)
                return NotFound();
            
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting material: {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }
}
