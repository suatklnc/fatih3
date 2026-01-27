using Supabase.Postgrest;
using Supabase.Postgrest.Models;
using Microsoft.Extensions.Logging;
using MaterialManagement.Models;
using MaterialManagement.Services;

namespace MaterialManagement.Services;

public class MaterialService : IMaterialService
{
    private readonly SupabaseService _supabaseService;
    private readonly ILogger<MaterialService> _logger;

    public MaterialService(SupabaseService supabaseService, ILogger<MaterialService> logger)
    {
        _supabaseService = supabaseService;
        _logger = logger;
    }

    public async Task<List<Material>> GetAllMaterialsAsync()
    {
        try
        {
            var response = await _supabaseService.Client
                .From<Material>()
                .Get();
            
            return response.Models;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all materials");
            throw;
        }
    }

    public async Task<Material?> GetMaterialByIdAsync(Guid id)
    {
        try
        {
            var response = await _supabaseService.Client
                .From<Material>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Single();
            
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting material by id: {Id}", id);
            return null;
        }
    }

    public async Task<Material> CreateMaterialAsync(Material material)
    {
        try
        {
            // Id yoksa oluştur
            if (material.Id == Guid.Empty)
            {
                material.Id = Guid.NewGuid();
            }
            
            // Tarihleri ayarla
            material.CreatedAt = DateTime.UtcNow;
            material.UpdatedAt = DateTime.UtcNow;
            
            var response = await _supabaseService.Client
                .From<Material>()
                .Insert(material);
            
            return response.Models.First();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating material: {Message}", ex.Message);
            throw;
        }
    }

    public async Task<Material> UpdateMaterialAsync(Guid id, Material material)
    {
        try
        {
            material.Id = id;
            material.UpdatedAt = DateTime.UtcNow;
            
            material.Id = id;
            material.UpdatedAt = DateTime.UtcNow;
            var response = await _supabaseService.Client
                .From<Material>()
                .Update(material);
            
            return response.Models.First();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating material: {Id}", id);
            throw;
        }
    }

    public async Task<bool> DeleteMaterialAsync(Guid id)
    {
        try
        {
            var material = await GetMaterialByIdAsync(id);
            if (material != null)
            {
                await material.Delete<Material>();
            }
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting material: {Id}", id);
            return false;
        }
    }
}
