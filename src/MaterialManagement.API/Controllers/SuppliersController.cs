using Microsoft.AspNetCore.Mvc;
using MaterialManagement.Models;
using MaterialManagement.Services;

namespace MaterialManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SuppliersController : ControllerBase
{
    private readonly ISupplierService _service;
    private readonly ILogger<SuppliersController> _logger;

    public SuppliersController(ISupplierService service, ILogger<SuppliersController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetAll()
    {
        try
        {
            var suppliers = await _service.GetAllAsync();
            var result = suppliers.Select(s => new
            {
                s.Id,
                s.Name,
                s.TaxNumber,
                s.Address,
                s.Phone,
                s.Email,
                s.ContactPerson,
                s.IsActive,
                s.CreatedAt,
                s.UpdatedAt
            }).ToList();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all suppliers");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetById(Guid id)
    {
        var supplier = await _service.GetByIdAsync(id);
        if (supplier == null) return NotFound();
        return Ok(new
        {
            supplier.Id,
            supplier.Name,
            supplier.TaxNumber,
            supplier.Address,
            supplier.Phone,
            supplier.Email,
            supplier.ContactPerson,
            supplier.IsActive,
            supplier.CreatedAt,
            supplier.UpdatedAt
        });
    }

    [HttpPost]
    public async Task<ActionResult<object>> Create(Supplier supplier)
    {
        try
        {
            var created = await _service.CreateAsync(supplier);
            return Ok(new
            {
                created.Id,
                created.Name,
                created.TaxNumber,
                created.Address,
                created.Phone,
                created.Email,
                created.ContactPerson,
                created.IsActive,
                created.CreatedAt,
                created.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating supplier");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<object>> Update(Guid id, Supplier supplier)
    {
        if (id != supplier.Id && supplier.Id != Guid.Empty)
            return BadRequest();

        try
        {
            var updated = await _service.UpdateAsync(id, supplier);
            return Ok(new
            {
                updated.Id,
                updated.Name,
                updated.TaxNumber,
                updated.Address,
                updated.Phone,
                updated.Email,
                updated.ContactPerson,
                updated.IsActive,
                updated.CreatedAt,
                updated.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating supplier");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        if (await _service.DeleteAsync(id))
            return NoContent();
        return NotFound();
    }
}
