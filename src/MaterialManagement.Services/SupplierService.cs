using Microsoft.Extensions.Logging;
using MaterialManagement.Models;

namespace MaterialManagement.Services;

public class SupplierService : ISupplierService
{
    private readonly SupabaseService _supabaseService;
    private readonly ILogger<SupplierService> _logger;

    public SupplierService(SupabaseService supabaseService, ILogger<SupplierService> logger)
    {
        _supabaseService = supabaseService;
        _logger = logger;
    }

    public async Task<List<Supplier>> GetAllAsync()
    {
        try
        {
            var response = await _supabaseService.Client
                .From<Supplier>()
                .Order("name", Supabase.Postgrest.Constants.Ordering.Ascending)
                .Get();
            return response.Models;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all suppliers");
            throw;
        }
    }

    public async Task<Supplier?> GetByIdAsync(Guid id)
    {
        try
        {
            var response = await _supabaseService.Client
                .From<Supplier>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Single();
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting supplier by id: {Id}", id);
            return null;
        }
    }

    public async Task<Supplier> CreateAsync(Supplier supplier)
    {
        try
        {
            if (supplier.Id == Guid.Empty)
                supplier.Id = Guid.NewGuid();
            
            supplier.CreatedAt = DateTime.UtcNow;
            supplier.UpdatedAt = DateTime.UtcNow;

            var response = await _supabaseService.Client
                .From<Supplier>()
                .Insert(supplier);
            return response.Models.First();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating supplier");
            throw;
        }
    }

    public async Task<Supplier> UpdateAsync(Guid id, Supplier supplier)
    {
        try
        {
            supplier.Id = id;
            supplier.UpdatedAt = DateTime.UtcNow;

            var response = await _supabaseService.Client
                .From<Supplier>()
                .Update(supplier);
            return response.Models.First();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating supplier: {Id}", id);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        try
        {
            await _supabaseService.Client
                .From<Supplier>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Delete();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting supplier: {Id}", id);
            return false;
        }
    }
}
