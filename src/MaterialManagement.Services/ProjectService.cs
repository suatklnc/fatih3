using Microsoft.Extensions.Logging;
using MaterialManagement.Models;

namespace MaterialManagement.Services;

public interface IProjectService
{
    Task<List<Project>> GetAllProjectsAsync();
    Task<List<Project>> GetProjectsByCompanyIdAsync(Guid companyId);
    Task<Project?> GetProjectByIdAsync(Guid id);
    Task<Project> CreateProjectAsync(Project project);
    Task<Project> UpdateProjectAsync(Guid id, Project project);
    Task<bool> DeleteProjectAsync(Guid id);
}

public class ProjectService : IProjectService
{
    private readonly SupabaseService _supabaseService;
    private readonly ILogger<ProjectService> _logger;

    public ProjectService(SupabaseService supabaseService, ILogger<ProjectService> logger)
    {
        _supabaseService = supabaseService;
        _logger = logger;
    }

    public async Task<List<Project>> GetAllProjectsAsync()
    {
        try
        {
            var response = await _supabaseService.Client
                .From<Project>()
                .Order("created_at", Supabase.Postgrest.Constants.Ordering.Descending)
                .Get();
            
            return response.Models;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all projects");
            throw;
        }
    }

    public async Task<List<Project>> GetProjectsByCompanyIdAsync(Guid companyId)
    {
        try
        {
            var response = await _supabaseService.Client
                .From<Project>()
                .Filter("company_id", Supabase.Postgrest.Constants.Operator.Equals, companyId.ToString())
                .Order("created_at", Supabase.Postgrest.Constants.Ordering.Descending)
                .Get();
            
            return response.Models;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting projects by company id: {CompanyId}", companyId);
            throw;
        }
    }

    public async Task<Project?> GetProjectByIdAsync(Guid id)
    {
        try
        {
            var response = await _supabaseService.Client
                .From<Project>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Single();
            
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting project by id: {Id}", id);
            return null;
        }
    }

    public async Task<Project> CreateProjectAsync(Project project)
    {
        try
        {
            if (project.Id == Guid.Empty)
            {
                project.Id = Guid.NewGuid();
            }
            
            project.CreatedAt = DateTime.UtcNow;
            project.UpdatedAt = DateTime.UtcNow;
            
            var response = await _supabaseService.Client
                .From<Project>()
                .Insert(project);
            
            return response.Models.First();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating project: {Message}", ex.Message);
            throw;
        }
    }

    public async Task<Project> UpdateProjectAsync(Guid id, Project project)
    {
        try
        {
            project.Id = id;
            project.UpdatedAt = DateTime.UtcNow;
            
            var response = await _supabaseService.Client
                .From<Project>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Update(project);
            
            return response.Models.First();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating project: {Id}", id);
            throw;
        }
    }

    public async Task<bool> DeleteProjectAsync(Guid id)
    {
        try
        {
            await _supabaseService.Client
                .From<Project>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Delete();
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting project: {Id}", id);
            return false;
        }
    }
}
