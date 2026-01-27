using Microsoft.AspNetCore.Mvc;
using MaterialManagement.Models;
using MaterialManagement.Models.DTOs;
using MaterialManagement.Services;

namespace MaterialManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MaterialRequestsController : ControllerBase
{
    private readonly IMaterialRequestService _requestService;
    private readonly INotificationService _notificationService;
    private readonly IEmailService _emailService;
    private readonly IUserService _userService;
    private readonly ILogger<MaterialRequestsController> _logger;

    public MaterialRequestsController(
        IMaterialRequestService requestService,
        INotificationService notificationService,
        IEmailService emailService,
        IUserService userService,
        ILogger<MaterialRequestsController> logger)
    {
        _requestService = requestService;
        _notificationService = notificationService;
        _emailService = emailService;
        _userService = userService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetAll()
    {
        try
        {
            var requests = await _requestService.GetAllRequestsAsync();
            var result = requests.Select(r => new
            {
                r.Id,
                r.ProjectId,
                r.RequestedBy,
                r.RequestNumber,
                r.Status,
                r.Priority,
                r.RequestDate,
                r.RequiredDate,
                r.Notes,
                r.ApprovedBy,
                r.ApprovedAt,
                r.CreatedAt,
                r.UpdatedAt
            }).ToList();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all requests");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetById(Guid id)
    {
        try
        {
            var request = await _requestService.GetRequestByIdAsync(id);
            if (request == null)
                return NotFound();
            
            return Ok(new
            {
                request.Id,
                request.ProjectId,
                request.RequestedBy,
                request.RequestNumber,
                request.Status,
                request.Priority,
                request.RequestDate,
                request.RequiredDate,
                request.Notes,
                request.ApprovedBy,
                request.ApprovedAt,
                request.CreatedAt,
                request.UpdatedAt,
                Items = request.Items.Select(i => new
                {
                    i.Id,
                    i.MaterialId,
                    i.Quantity,
                    i.UnitPrice,
                    i.Notes
                }).ToList()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting request: {Id}", id);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] MaterialRequestCreateDto dto)
    {
        // ModelState validation kontrolü
        if (!ModelState.IsValid)
        {
            var errors = ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .Select(e => new { Field = e.Key, Errors = e.Value?.Errors.Select(x => x.ErrorMessage) })
                .ToList();
            _logger.LogWarning("ModelState validation failed: {@Errors}", errors);
            return BadRequest(new { message = "Validation failed", errors });
        }
        
        // Null dto kontrolü
        if (dto == null)
        {
            _logger.LogWarning("Request body is null");
            return BadRequest(new { message = "Request body is required" });
        }
        
        _logger.LogInformation("Creating request with data: ProjectId={ProjectId}, Priority={Priority}, Items={ItemCount}", 
            dto.ProjectId, dto.Priority, dto.Items?.Count ?? 0);
        
        try
        {
            // Get the first user from database (temporary until auth is implemented)
            var users = await _userService.GetAllUsersAsync();
            if (users == null || users.Count == 0)
            {
                return BadRequest(new { message = "Sistemde kullanıcı bulunamadı. Önce bir kullanıcı ekleyiniz." });
            }
            var userId = users.First().Id;
            
            var request = await _requestService.CreateRequestAsync(userId, dto);
            
            // Create notification for approvers
            var notification = new Notification
            {
                UserId = userId, // TODO: Get approver user IDs
                Type = "request_approval",
                Title = "Yeni Malzeme Talebi",
                Message = $"Talep No: {request.RequestNumber} onayınızı bekliyor.",
                RelatedEntityType = "material_request",
                RelatedEntityId = request.Id
            };
            
            await _notificationService.CreateNotificationAsync(notification);
            
            // Send email notification
            // await _emailService.SendRequestApprovalEmailAsync("approver@example.com", request.Id, request.RequestNumber);
            
            return Ok(new
            {
                request.Id,
                request.ProjectId,
                request.RequestedBy,
                request.RequestNumber,
                request.Status,
                request.Priority,
                request.RequestDate,
                request.RequiredDate,
                request.Notes,
                request.CreatedAt,
                request.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating request");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult<object>> UpdateStatus(
        Guid id,
        [FromBody] UpdateStatusDto dto)
    {
        try
        {
            // Get actual user from database (temporary until auth is implemented)
            var users = await _userService.GetAllUsersAsync();
            var userId = users.FirstOrDefault()?.Id;
            
            var request = await _requestService.UpdateRequestStatusAsync(
                id,
                dto.Status,
                dto.Status == "approved" ? userId : null);
            
            return Ok(new
            {
                request.Id,
                request.RequestNumber,
                request.Status,
                request.ApprovedBy,
                request.ApprovedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating request status: {Id}", id);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var result = await _requestService.DeleteRequestAsync(id);
            if (!result)
                return NotFound();
            
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting request: {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}/send-to-purchasing")]
    public async Task<ActionResult<object>> SendToPurchasing(Guid id)
    {
        try
        {
            // Get the first user (temporary until auth is implemented)
            var users = await _userService.GetAllUsersAsync();
            var userId = users.FirstOrDefault()?.Id ?? Guid.Empty;
            
            var request = await _requestService.GetRequestByIdAsync(id);
            if (request == null)
                return NotFound();
            
            if (request.Status != "approved")
                return BadRequest(new { message = "Sadece onaylanmış talepler satın almaya gönderilebilir." });
            
            var updated = await _requestService.SendToPurchasingAsync(id, userId);
            
            return Ok(new
            {
                updated.Id,
                updated.RequestNumber,
                updated.Status,
                updated.SentToPurchasingAt,
                updated.SentToPurchasingBy
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending request to purchasing: {Id}", id);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("{id}/send-to-suppliers")]
    public async Task<ActionResult<object>> SendToSuppliers(Guid id)
    {
        try
        {
            var request = await _requestService.GetRequestByIdAsync(id);
            if (request == null)
                return NotFound();
            
            if (request.Status != "sent_to_purchasing")
                return BadRequest(new { message = "Sadece satın almaya iletilmiş talepler tedarikçilere gönderilebilir." });
            
            var updated = await _requestService.SendToSuppliersAsync(id);
            
            return Ok(new
            {
                updated.Id,
                updated.RequestNumber,
                updated.Status,
                updated.SentToSuppliersAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending request to suppliers: {Id}", id);
            return StatusCode(500, new { message = ex.Message });
        }
    }
}

public class UpdateStatusDto
{
    public string Status { get; set; } = string.Empty;
}
