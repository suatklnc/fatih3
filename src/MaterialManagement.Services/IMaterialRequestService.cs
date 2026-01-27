using MaterialManagement.Models;
using MaterialManagement.Models.DTOs;

namespace MaterialManagement.Services;

public interface IMaterialRequestService
{
    Task<List<MaterialRequest>> GetAllRequestsAsync();
    Task<MaterialRequest?> GetRequestByIdAsync(Guid id);
    Task<MaterialRequest> CreateRequestAsync(Guid userId, MaterialRequestCreateDto dto);
    Task<MaterialRequest> UpdateRequestStatusAsync(Guid id, string status, Guid? approvedBy);
    Task<MaterialRequest> SendToPurchasingAsync(Guid id, Guid sentBy);
    Task<MaterialRequest> SendToSuppliersAsync(Guid id);
    Task<bool> DeleteRequestAsync(Guid id);
}
