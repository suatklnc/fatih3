using MaterialManagement.Models;
using MaterialManagement.Models.DTOs;

namespace MaterialManagement.Services;

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

public interface IMaterialService
{
    Task<List<Material>> GetAllMaterialsAsync();
    Task<PagedResult<Material>> GetMaterialsPagedAsync(int page, int pageSize, string? search = null);
    Task<Material?> GetMaterialByIdAsync(Guid id);
    Task<Material> CreateMaterialAsync(Material material);
    Task<List<Material>> CreateManyAsync(List<Material> materials);
    Task<Material> UpdateMaterialAsync(Guid id, Material material);
    Task<bool> DeleteMaterialAsync(Guid id);
    Task<int> DeleteAllAsync();
}
