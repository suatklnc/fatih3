using Supabase.Postgrest;
using Microsoft.Extensions.Logging;
using MaterialManagement.Models;
using MaterialManagement.Models.DTOs;

namespace MaterialManagement.Services;

public class MaterialRequestService : IMaterialRequestService
{
    private readonly SupabaseService _supabaseService;
    private readonly ILogger<MaterialRequestService> _logger;

    public MaterialRequestService(SupabaseService supabaseService, ILogger<MaterialRequestService> logger)
    {
        _supabaseService = supabaseService;
        _logger = logger;
    }

    public async Task<List<MaterialRequest>> GetAllRequestsAsync()
    {
        try
        {
            var response = await _supabaseService.Client
                .From<MaterialRequest>()
                .Get();
            
            return response.Models;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all requests");
            throw;
        }
    }

    public async Task<MaterialRequest?> GetRequestByIdAsync(Guid id)
    {
        try
        {
            var response = await _supabaseService.Client
                .From<MaterialRequest>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Single();
            
            // Load items
            var itemsResponse = await _supabaseService.Client
                .From<MaterialRequestItem>()
                .Filter("request_id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Get();
            
            response.Items = itemsResponse.Models;
            
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting request by id: {Id}", id);
            return null;
        }
    }

    public async Task<MaterialRequest> CreateRequestAsync(Guid userId, MaterialRequestCreateDto dto)
    {
        try
        {
            // Generate request number
            var requestNumber = $"TAL-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
            
            var request = new MaterialRequest
            {
                Id = Guid.NewGuid(),
                ProjectId = dto.ProjectId,
                RequestedBy = userId,
                RequestNumber = requestNumber,
                Status = "pending",
                Priority = dto.Priority,
                RequestDate = DateTime.Today,
                RequiredDate = dto.RequiredDate,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            var requestResponse = await _supabaseService.Client
                .From<MaterialRequest>()
                .Insert(request);
            
            var createdRequest = requestResponse.Models.First();
            
            // Insert items
            var items = dto.Items.Select(item => new MaterialRequestItem
            {
                Id = Guid.NewGuid(),
                RequestId = createdRequest.Id,
                MaterialId = item.MaterialId,
                Quantity = item.Quantity,
                Notes = item.Notes,
                CreatedAt = DateTime.UtcNow
            }).ToList();
            
            if (items.Any())
            {
                await _supabaseService.Client
                    .From<MaterialRequestItem>()
                    .Insert(items);
            }
            
            createdRequest.Items = items;
            return createdRequest;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating request");
            throw;
        }
    }

    public async Task<MaterialRequest> UpdateRequestStatusAsync(Guid id, string status, Guid? approvedBy)
    {
        try
        {
            var request = await GetRequestByIdAsync(id);
            if (request == null)
                throw new Exception("Request not found");
            
            request.Status = status;
            request.UpdatedAt = DateTime.UtcNow;
            
            if (status == "approved" && approvedBy.HasValue)
            {
                request.ApprovedBy = approvedBy.Value;
                request.ApprovedAt = DateTime.UtcNow;
            }
            
            request.Id = id;
            request.UpdatedAt = DateTime.UtcNow;
            var response = await _supabaseService.Client
                .From<MaterialRequest>()
                .Update(request);
            
            return response.Models.First();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating request status: {Id}", id);
            throw;
        }
    }

    public async Task<MaterialRequest> SendToPurchasingAsync(Guid id, Guid sentBy)
    {
        try
        {
            var request = await GetRequestByIdAsync(id);
            if (request == null)
                throw new Exception("Request not found");
            
            request.Status = "sent_to_purchasing";
            request.SentToPurchasingAt = DateTime.UtcNow;
            request.SentToPurchasingBy = sentBy;
            request.UpdatedAt = DateTime.UtcNow;
            
            var response = await _supabaseService.Client
                .From<MaterialRequest>()
                .Update(request);
            
            return response.Models.First();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending request to purchasing: {Id}", id);
            throw;
        }
    }

    public async Task<MaterialRequest> SendToSuppliersAsync(Guid id)
    {
        try
        {
            var request = await GetRequestByIdAsync(id);
            if (request == null)
                throw new Exception("Request not found");
            
            request.Status = "sent_to_suppliers";
            request.SentToSuppliersAt = DateTime.UtcNow;
            request.UpdatedAt = DateTime.UtcNow;
            
            var response = await _supabaseService.Client
                .From<MaterialRequest>()
                .Update(request);
            
            return response.Models.First();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending request to suppliers: {Id}", id);
            throw;
        }
    }

    public async Task<bool> DeleteRequestAsync(Guid id)
    {
        try
        {
            var request = await GetRequestByIdAsync(id);
            if (request != null)
            {
                await request.Delete<MaterialRequest>();
            }
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting request: {Id}", id);
            return false;
        }
    }
}
