using MaterialManagement.Models;

namespace MaterialManagement.Services;

public interface ISupplierService
{
    Task<List<Supplier>> GetAllAsync();
    Task<Supplier?> GetByIdAsync(Guid id);
    Task<Supplier> CreateAsync(Supplier supplier);
    Task<Supplier> UpdateAsync(Guid id, Supplier supplier);
    Task<bool> DeleteAsync(Guid id);
}
