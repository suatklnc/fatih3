using MaterialManagement.Models;
using MaterialManagement.Models.DTOs;

namespace MaterialManagement.Services;

public interface IQuotationService
{
    Task<List<Quotation>> GetAllQuotationsAsync();
    Task<Quotation?> GetQuotationByIdAsync(Guid id);
    Task<List<Quotation>> GetQuotationsByRequestIdAsync(Guid requestId);
    Task<Quotation> CreateQuotationAsync(Guid userId, QuotationCreateDto dto);
    Task<Quotation> UpdateQuotationStatusAsync(Guid id, string status, Guid? approvedBy);
    Task<bool> DeleteQuotationAsync(Guid id);
}
