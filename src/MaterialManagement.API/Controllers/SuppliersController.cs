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
    public async Task<ActionResult<List<Supplier>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Supplier>> GetById(Guid id)
    {
        var supplier = await _service.GetByIdAsync(id);
        if (supplier == null) return NotFound();
        return Ok(supplier);
    }

    [HttpPost]
    public async Task<ActionResult<Supplier>> Create(Supplier supplier)
    {
        try
        {
            var created = await _service.CreateAsync(supplier);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating supplier");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Supplier>> Update(Guid id, Supplier supplier)
    {
        if (id != supplier.Id && supplier.Id != Guid.Empty)
            return BadRequest();

        try
        {
            var updated = await _service.UpdateAsync(id, supplier);
            return Ok(updated);
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
