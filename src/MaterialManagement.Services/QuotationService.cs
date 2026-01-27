using Supabase.Postgrest;
using Microsoft.Extensions.Logging;
using MaterialManagement.Models;
using MaterialManagement.Models.DTOs;

namespace MaterialManagement.Services;

public class QuotationService : IQuotationService
{
    private readonly SupabaseService _supabaseService;
    private readonly ILogger<QuotationService> _logger;

    public QuotationService(SupabaseService supabaseService, ILogger<QuotationService> logger)
    {
        _supabaseService = supabaseService;
        _logger = logger;
    }

    public async Task<List<Quotation>> GetAllQuotationsAsync()
    {
        try
        {
            var response = await _supabaseService.Client
                .From<Quotation>()
                .Get();
            
            return response.Models;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all quotations");
            throw;
        }
    }

    public async Task<Quotation?> GetQuotationByIdAsync(Guid id)
    {
        try
        {
            var response = await _supabaseService.Client
                .From<Quotation>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Single();
            
            // Load items
            var itemsResponse = await _supabaseService.Client
                .From<QuotationItem>()
                .Filter("quotation_id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Get();
            
            response.Items = itemsResponse.Models;
            
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting quotation by id: {Id}", id);
            return null;
        }
    }

    public async Task<List<Quotation>> GetQuotationsByRequestIdAsync(Guid requestId)
    {
        try
        {
            var response = await _supabaseService.Client
                .From<Quotation>()
                .Filter("request_id", Supabase.Postgrest.Constants.Operator.Equals, requestId.ToString())
                .Get();
            
            return response.Models;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting quotations by request id: {RequestId}", requestId);
            throw;
        }
    }

    public async Task<Quotation> CreateQuotationAsync(Guid userId, QuotationCreateDto dto)
    {
        try
        {
            // Generate quotation number
            var quotationNumber = $"TEK-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
            
            var totalAmount = dto.Items.Sum(item => item.Quantity * item.UnitPrice);
            
            var quotation = new Quotation
            {
                Id = Guid.NewGuid(),
                RequestId = dto.RequestId,
                SupplierId = dto.SupplierId,
                QuotationNumber = quotationNumber,
                QuotationDate = DateTime.Today,
                ValidUntil = dto.ValidUntil,
                Status = "pending",
                TotalAmount = totalAmount,
                Currency = dto.Currency,
                Notes = dto.Notes,
                SubmittedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            var quotationResponse = await _supabaseService.Client
                .From<Quotation>()
                .Insert(quotation);
            
            var createdQuotation = quotationResponse.Models.First();
            
            // Insert items
            var items = dto.Items.Select(item => new QuotationItem
            {
                Id = Guid.NewGuid(),
                QuotationId = createdQuotation.Id,
                MaterialId = item.MaterialId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                TotalPrice = item.Quantity * item.UnitPrice,
                DeliveryTime = item.DeliveryTime,
                Notes = item.Notes,
                CreatedAt = DateTime.UtcNow
            }).ToList();
            
            if (items.Any())
            {
                await _supabaseService.Client
                    .From<QuotationItem>()
                    .Insert(items);
            }
            
            createdQuotation.Items = items;
            return createdQuotation;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating quotation");
            throw;
        }
    }

    public async Task<Quotation> UpdateQuotationStatusAsync(Guid id, string status, Guid? approvedBy)
    {
        try
        {
            var quotation = await GetQuotationByIdAsync(id);
            if (quotation == null)
                throw new Exception("Quotation not found");
            
            quotation.Status = status;
            quotation.UpdatedAt = DateTime.UtcNow;
            
            if (status == "approved" && approvedBy.HasValue)
            {
                quotation.ApprovedBy = approvedBy.Value;
                quotation.ApprovedAt = DateTime.UtcNow;
            }
            
            quotation.Id = id;
            quotation.UpdatedAt = DateTime.UtcNow;
            var response = await _supabaseService.Client
                .From<Quotation>()
                .Update(quotation);
            
            return response.Models.First();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating quotation status: {Id}", id);
            throw;
        }
    }

    public async Task<bool> DeleteQuotationAsync(Guid id)
    {
        try
        {
            var quotation = await GetQuotationByIdAsync(id);
            if (quotation != null)
            {
                await quotation.Delete<Quotation>();
            }
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting quotation: {Id}", id);
            return false;
        }
    }
}
