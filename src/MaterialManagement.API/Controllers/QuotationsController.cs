using Microsoft.AspNetCore.Mvc;
using MaterialManagement.Models;
using MaterialManagement.Models.DTOs;
using MaterialManagement.Services;

namespace MaterialManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuotationsController : ControllerBase
{
    private readonly IQuotationService _quotationService;
    private readonly INotificationService _notificationService;
    private readonly IEmailService _emailService;
    private readonly ILogger<QuotationsController> _logger;

    public QuotationsController(
        IQuotationService quotationService,
        INotificationService notificationService,
        IEmailService emailService,
        ILogger<QuotationsController> logger)
    {
        _quotationService = quotationService;
        _notificationService = notificationService;
        _emailService = emailService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetAll()
    {
        try
        {
            var quotations = await _quotationService.GetAllQuotationsAsync();
            var result = quotations.Select(MapToResult).ToList();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all quotations");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("request/{requestId}")]
    public async Task<ActionResult<object>> GetByRequestId(Guid requestId)
    {
        try
        {
            var quotations = await _quotationService.GetQuotationsByRequestIdAsync(requestId);
            var result = quotations.Select(MapToResult).ToList();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting quotations by request id: {RequestId}", requestId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetById(Guid id)
    {
        try
        {
            var quotation = await _quotationService.GetQuotationByIdAsync(id);
            if (quotation == null)
                return NotFound();
            
            return Ok(MapToResult(quotation));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting quotation: {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] QuotationCreateDto dto)
    {
        try
        {
            // TODO: Get userId from authentication context
            var userId = Guid.Parse("00000000-0000-0000-0000-000000000001"); // Placeholder
            
            var quotation = await _quotationService.CreateQuotationAsync(userId, dto);
            
            // Create notification
            var notification = new Notification
            {
                UserId = userId, // TODO: Get approver user IDs
                Type = "quotation_received",
                Title = "Yeni Teklif Alındı",
                Message = $"Teklif No: {quotation.QuotationNumber} incelenmeyi bekliyor.",
                RelatedEntityType = "quotation",
                RelatedEntityId = quotation.Id
            };
            
            await _notificationService.CreateNotificationAsync(notification);
            
            // Send email notification
            // await _emailService.SendQuotationReceivedEmailAsync("approver@example.com", quotation.Id, quotation.QuotationNumber);
            
            return CreatedAtAction(nameof(GetById), new { id = quotation.Id }, MapToResult(quotation));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating quotation");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult<object>> UpdateStatus(
        Guid id,
        [FromBody] UpdateStatusDto dto)
    {
        try
        {
            // TODO: Get userId from authentication context
            var userId = Guid.Parse("00000000-0000-0000-0000-000000000001"); // Placeholder
            
            var quotation = await _quotationService.UpdateQuotationStatusAsync(
                id,
                dto.Status,
                dto.Status == "approved" ? userId : null);
            
            return Ok(MapToResult(quotation));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating quotation status: {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var result = await _quotationService.DeleteQuotationAsync(id);
            if (!result)
                return NotFound();
            
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting quotation: {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    // Helper to map Quotation to anonymous object to avoid serialization issues
    private object MapToResult(Quotation q)
    {
        return new
        {
            q.Id,
            q.RequestId,
            q.SupplierId,
            q.QuotationNumber,
            q.QuotationDate,
            q.ValidUntil,
            q.Status,
            q.TotalAmount,
            q.Currency,
            q.Notes,
            q.SubmittedBy,
            q.ApprovedBy,
            q.ApprovedAt,
            q.CreatedAt,
            q.UpdatedAt,
            Items = q.Items.Select(i => new {
                i.Id,
                i.MaterialId,
                i.Quantity,
                i.UnitPrice,
                i.TotalPrice,
                i.DeliveryTime,
                i.Notes
            }).ToList()
        };
    }
}
