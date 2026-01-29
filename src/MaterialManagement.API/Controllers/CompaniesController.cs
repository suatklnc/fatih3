using Microsoft.AspNetCore.Mvc;
using MaterialManagement.Models;
using MaterialManagement.Services;

namespace MaterialManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompaniesController : ControllerBase
{
    private readonly ICompanyService _companyService;
    private readonly ILogger<CompaniesController> _logger;

    public CompaniesController(ICompanyService companyService, ILogger<CompaniesController> logger)
    {
        _companyService = companyService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetAll()
    {
        try
        {
            var companies = await _companyService.GetAllCompaniesAsync();
            var result = companies.Select(c => new
            {
                c.Id,
                c.Name,
                c.TaxNumber,
                c.Address,
                c.Phone,
                c.Email,
                c.CreatedAt,
                c.UpdatedAt
            }).ToList();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all companies");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetById(Guid id)
    {
        try
        {
            var company = await _companyService.GetCompanyByIdAsync(id);
            if (company == null)
                return NotFound();
            
            return Ok(new
            {
                company.Id,
                company.Name,
                company.TaxNumber,
                company.Address,
                company.Phone,
                company.Email,
                company.CreatedAt,
                company.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting company: {Id}", id);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] Company company)
    {
        try
        {
            var created = await _companyService.CreateCompanyAsync(company);
            return Ok(new
            {
                created.Id,
                created.Name,
                created.TaxNumber,
                created.Address,
                created.Phone,
                created.Email,
                created.CreatedAt,
                created.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating company: {Message}", ex.Message);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<object>> Update(Guid id, [FromBody] Company company)
    {
        try
        {
            var updated = await _companyService.UpdateCompanyAsync(id, company);
            return Ok(new
            {
                updated.Id,
                updated.Name,
                updated.TaxNumber,
                updated.Address,
                updated.Phone,
                updated.Email,
                updated.CreatedAt,
                updated.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating company: {Id}", id);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _companyService.DeleteCompanyAsync(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting company: {Id}", id);
            
            if (ex.Message.Contains("violates foreign key constraint") || 
                (ex.InnerException != null && ex.InnerException.Message.Contains("violates foreign key constraint")))
            {
                if (ex.Message.Contains("user_profiles") || (ex.InnerException != null && ex.InnerException.Message.Contains("user_profiles")))
                {
                    return BadRequest(new { message = "Bu firma sistemde kayıtlı KULLANICILAR (Personel) ile ilişkilidir. Silmek için önce firmaya bağlı kullanıcıları güncelleyin veya silin." });
                }
                
                return BadRequest(new { message = "Bu firma kullanımda olduğu için silinemez. Lütfen önce ilişkili kayıtları silin." });
            }

            return StatusCode(500, new { message = "Silme işlemi sırasında bir hata oluştu: " + ex.Message });
        }
    }
}
