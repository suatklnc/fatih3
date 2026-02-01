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
            // Supabase varsayılan 1000 satır limiti var, pagination ile tümünü çek
            var allMaterials = new List<Material>();
            var pageSize = 1000;
            var offset = 0;
            
            while (true)
            {
                var response = await _supabaseService.Client
                    .From<Material>()
                    .Offset(offset)
                    .Limit(pageSize)
                    .Get();
                
                if (response.Models.Count == 0)
                    break;
                    
                allMaterials.AddRange(response.Models);
                
                if (response.Models.Count < pageSize)
                    break;
                    
                offset += pageSize;
            }
            
            return allMaterials;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all materials");
            throw;
        }
    }

    public async Task<PagedResult<Material>> GetMaterialsPagedAsync(int page, int pageSize, string? search = null)
    {
        try
        {
            var offset = (page - 1) * pageSize;
            var hasSearch = !string.IsNullOrWhiteSpace(search);
            var searchPattern = hasSearch ? $"%{search!.ToLower()}%" : "";
            
            // Toplam sayıyı al - Supabase'in 1000 limit sorunundan kaçınmak için
            // pagination ile tüm ID'leri sayıyoruz
            int totalCount = 0;
            var countPageSize = 1000;
            var countOffset = 0;
            
            while (true)
            {
                Supabase.Postgrest.Responses.ModeledResponse<Material> countResponse;
                if (hasSearch)
                {
                    countResponse = await _supabaseService.Client
                        .From<Material>()
                        .Filter("code", Supabase.Postgrest.Constants.Operator.ILike, searchPattern)
                        .Select("id")
                        .Offset(countOffset)
                        .Limit(countPageSize)
                        .Get();
                }
                else
                {
                    countResponse = await _supabaseService.Client
                        .From<Material>()
                        .Select("id")
                        .Offset(countOffset)
                        .Limit(countPageSize)
                        .Get();
                }
                
                totalCount += countResponse.Models.Count;
                
                if (countResponse.Models.Count < countPageSize)
                    break;
                    
                countOffset += countPageSize;
            }
            
            // Sayfalanmış veriyi al
            Supabase.Postgrest.Responses.ModeledResponse<Material> response;
            if (hasSearch)
            {
                response = await _supabaseService.Client
                    .From<Material>()
                    .Filter("code", Supabase.Postgrest.Constants.Operator.ILike, searchPattern)
                    .Order("code", Supabase.Postgrest.Constants.Ordering.Ascending)
                    .Offset(offset)
                    .Limit(pageSize)
                    .Get();
            }
            else
            {
                response = await _supabaseService.Client
                    .From<Material>()
                    .Order("code", Supabase.Postgrest.Constants.Ordering.Ascending)
                    .Offset(offset)
                    .Limit(pageSize)
                    .Get();
            }
            
            return new PagedResult<Material>
            {
                Items = response.Models,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paged materials");
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

    public async Task<List<Material>> CreateManyAsync(List<Material> materials)
    {
        var result = new List<Material>();
        var batchSize = 500; // Supabase batch limit
        
        foreach (var material in materials)
        {
            if (material.Id == Guid.Empty)
                material.Id = Guid.NewGuid();
            material.CreatedAt = DateTime.UtcNow;
            material.UpdatedAt = DateTime.UtcNow;
        }
        
        // Batch halinde ekle
        for (var i = 0; i < materials.Count; i += batchSize)
        {
            var batch = materials.Skip(i).Take(batchSize).ToList();
            try
            {
                var response = await _supabaseService.Client
                    .From<Material>()
                    .Insert(batch);
                result.AddRange(response.Models);
                _logger.LogInformation("Batch {BatchNum} eklendi: {Count} malzeme", (i / batchSize) + 1, batch.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Batch {BatchNum} eklenirken hata: {Message}", (i / batchSize) + 1, ex.Message);
                // Hata olursa tek tek dene
                foreach (var m in batch)
                {
                    try
                    {
                        var single = await _supabaseService.Client.From<Material>().Insert(m);
                        result.AddRange(single.Models);
                    }
                    catch (Exception innerEx)
                    {
                        _logger.LogWarning(innerEx, "Malzeme eklenemedi: {Code}", m.Code);
                    }
                }
            }
        }
        
        return result;
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
            await _supabaseService.Client
                .From<Material>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Delete();
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting material: {Id}", id);
            throw; // Hatayı yutma, fırlat
        }
    }

    public async Task<int> DeleteAllAsync()
    {
        try
        {
            // Önce sayıyı al
            var allMaterials = await GetAllMaterialsAsync();
            var totalCount = allMaterials.Count;
            
            if (totalCount == 0)
                return 0;
            
            _logger.LogInformation("{Count} malzeme toplu olarak siliniyor...", totalCount);
            
            // Supabase'de tek seferde tümünü sil (id > '00000000-0000-0000-0000-000000000000' ile tüm kayıtları seç)
            await _supabaseService.Client
                .From<Material>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.GreaterThan, "00000000-0000-0000-0000-000000000000")
                .Delete();
            
            _logger.LogInformation("{Count} malzeme başarıyla silindi", totalCount);
            return totalCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting all materials");
            throw;
        }
    }
}
