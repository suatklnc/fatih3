using Microsoft.Extensions.Logging;
using MaterialManagement.Models;

namespace MaterialManagement.Services;

public interface ICompanyService
{
    Task<List<Company>> GetAllCompaniesAsync();
    Task<Company?> GetCompanyByIdAsync(Guid id);
    Task<Company> CreateCompanyAsync(Company company);
    Task<Company> UpdateCompanyAsync(Guid id, Company company);
    Task<bool> DeleteCompanyAsync(Guid id);
}

public class CompanyService : ICompanyService
{
    private readonly SupabaseService _supabaseService;
    private readonly ILogger<CompanyService> _logger;

    public CompanyService(SupabaseService supabaseService, ILogger<CompanyService> logger)
    {
        _supabaseService = supabaseService;
        _logger = logger;
    }

    public async Task<List<Company>> GetAllCompaniesAsync()
    {
        try
        {
            var response = await _supabaseService.Client
                .From<Company>()
                .Order("name", Supabase.Postgrest.Constants.Ordering.Ascending)
                .Get();
            
            return response.Models;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all companies");
            throw;
        }
    }

    public async Task<Company?> GetCompanyByIdAsync(Guid id)
    {
        try
        {
            var response = await _supabaseService.Client
                .From<Company>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Single();
            
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting company by id: {Id}", id);
            return null;
        }
    }

    public async Task<Company> CreateCompanyAsync(Company company)
    {
        try
        {
            if (company.Id == Guid.Empty)
            {
                company.Id = Guid.NewGuid();
            }
            
            company.CreatedAt = DateTime.UtcNow;
            company.UpdatedAt = DateTime.UtcNow;
            
            var response = await _supabaseService.Client
                .From<Company>()
                .Insert(company);
            
            return response.Models.First();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating company: {Message}", ex.Message);
            throw;
        }
    }

    public async Task<Company> UpdateCompanyAsync(Guid id, Company company)
    {
        try
        {
            company.Id = id;
            company.UpdatedAt = DateTime.UtcNow;
            
            var response = await _supabaseService.Client
                .From<Company>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Update(company);
            
            return response.Models.First();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating company: {Id}", id);
            throw;
        }
    }

    public async Task<bool> DeleteCompanyAsync(Guid id)
    {
        try
        {
            await _supabaseService.Client
                .From<Company>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Delete();
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting company: {Id}", id);
            throw;
        }
    }
}
