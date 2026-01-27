using Microsoft.AspNetCore.Mvc;
using MaterialManagement.Models;
using MaterialManagement.Services;

namespace MaterialManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;
    private readonly ILogger<ProjectsController> _logger;

    public ProjectsController(IProjectService projectService, ILogger<ProjectsController> logger)
    {
        _projectService = projectService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetAll()
    {
        try
        {
            var projects = await _projectService.GetAllProjectsAsync();
            var result = projects.Select(p => new
            {
                p.Id,
                p.CompanyId,
                p.Name,
                p.Description,
                p.Status,
                p.StartDate,
                p.EndDate,
                p.CreatedBy,
                p.CreatedAt,
                p.UpdatedAt
            }).ToList();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all projects");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("company/{companyId}")]
    public async Task<ActionResult<object>> GetByCompanyId(Guid companyId)
    {
        try
        {
            var projects = await _projectService.GetProjectsByCompanyIdAsync(companyId);
            var result = projects.Select(p => new
            {
                p.Id,
                p.CompanyId,
                p.Name,
                p.Description,
                p.Status,
                p.StartDate,
                p.EndDate,
                p.CreatedBy,
                p.CreatedAt,
                p.UpdatedAt
            }).ToList();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting projects by company id: {CompanyId}", companyId);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetById(Guid id)
    {
        try
        {
            var project = await _projectService.GetProjectByIdAsync(id);
            if (project == null)
                return NotFound();
            
            return Ok(new
            {
                project.Id,
                project.CompanyId,
                project.Name,
                project.Description,
                project.Status,
                project.StartDate,
                project.EndDate,
                project.CreatedBy,
                project.CreatedAt,
                project.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting project: {Id}", id);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] Project project)
    {
        try
        {
            var created = await _projectService.CreateProjectAsync(project);
            return Ok(new
            {
                created.Id,
                created.CompanyId,
                created.Name,
                created.Description,
                created.Status,
                created.StartDate,
                created.EndDate,
                created.CreatedBy,
                created.CreatedAt,
                created.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating project: {Message}", ex.Message);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<object>> Update(Guid id, [FromBody] Project project)
    {
        try
        {
            var updated = await _projectService.UpdateProjectAsync(id, project);
            return Ok(new
            {
                updated.Id,
                updated.CompanyId,
                updated.Name,
                updated.Description,
                updated.Status,
                updated.StartDate,
                updated.EndDate,
                updated.CreatedBy,
                updated.CreatedAt,
                updated.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating project: {Id}", id);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var result = await _projectService.DeleteProjectAsync(id);
            if (!result)
                return NotFound();
            
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting project: {Id}", id);
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
