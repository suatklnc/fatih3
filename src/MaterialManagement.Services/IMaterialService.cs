using MaterialManagement.Models;
using MaterialManagement.Models.DTOs;

namespace MaterialManagement.Services;

public interface IMaterialService
{
    Task<List<Material>> GetAllMaterialsAsync();
    Task<Material?> GetMaterialByIdAsync(Guid id);
    Task<Material> CreateMaterialAsync(Material material);
    Task<List<Material>> CreateManyAsync(List<Material> materials);
    Task<Material> UpdateMaterialAsync(Guid id, Material material);
    Task<bool> DeleteMaterialAsync(Guid id);
    Task<int> DeleteAllAsync();
}
