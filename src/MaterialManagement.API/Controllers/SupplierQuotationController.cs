using Microsoft.AspNetCore.Mvc;
using MaterialManagement.Models;
using MaterialManagement.Services;

namespace MaterialManagement.API.Controllers;

/// <summary>
/// Public API for suppliers to submit quotations via token-based access
/// </summary>
[ApiController]
[Route("api/supplier-quotation")]
public class SupplierQuotationController : ControllerBase
{
    private readonly SupabaseService _supabaseService;
    private readonly IMaterialService _materialService;
    private readonly ISupplierService _supplierService;
    private readonly IQuotationService _quotationService;
    private readonly ILogger<SupplierQuotationController> _logger;

    public SupplierQuotationController(
        SupabaseService supabaseService,
        IMaterialService materialService,
        ISupplierService supplierService,
        IQuotationService quotationService,
        ILogger<SupplierQuotationController> logger)
    {
        _supabaseService = supabaseService;
        _materialService = materialService;
        _supplierService = supplierService;
        _quotationService = quotationService;
        _logger = logger;
    }

    /// <summary>
    /// Get quotation form data by token (public endpoint)
    /// </summary>
    [HttpGet("{token}")]
    public async Task<ActionResult<object>> GetFormData(string token)
    {
        try
        {
            // Find token
            var tokenResponse = await _supabaseService.Client
                .From<QuotationToken>()
                .Filter("token", Supabase.Postgrest.Constants.Operator.Equals, token)
                .Single();

            if (tokenResponse == null)
                return NotFound(new { message = "Geçersiz veya bulunamayan token" });

            // Check expiration
            if (tokenResponse.ExpiresAt < DateTime.UtcNow)
                return BadRequest(new { message = "Bu teklif formu süresi dolmuş" });

            // Check if already used
            if (tokenResponse.UsedAt != null)
                return BadRequest(new { message = "Bu teklif formu daha önce kullanılmış" });

            // Get request with items
            var requestResponse = await _supabaseService.Client
                .From<MaterialRequest>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, tokenResponse.RequestId.ToString())
                .Single();

            if (requestResponse == null)
                return NotFound(new { message = "Talep bulunamadı" });

            // Get request items
            var itemsResponse = await _supabaseService.Client
                .From<MaterialRequestItem>()
                .Filter("request_id", Supabase.Postgrest.Constants.Operator.Equals, tokenResponse.RequestId.ToString())
                .Get();

            // Get supplier info
            var supplier = await _supplierService.GetByIdAsync(tokenResponse.SupplierId);

            // Get material details for each item
            var items = new List<object>();
            foreach (var item in itemsResponse.Models)
            {
                var material = await _materialService.GetMaterialByIdAsync(item.MaterialId);
                items.Add(new
                {
                    id = item.Id,
                    materialId = item.MaterialId,
                    materialCode = material?.Code ?? "-",
                    materialName = material?.Name ?? "Bilinmeyen Malzeme",
                    unit = material?.Unit ?? "Adet",
                    quantity = item.Quantity,
                    notes = item.Notes
                });
            }

            return Ok(new
            {
                requestNumber = requestResponse.RequestNumber,
                requestDate = requestResponse.RequestDate,
                requiredDate = requestResponse.RequiredDate,
                priority = requestResponse.Priority,
                notes = requestResponse.Notes,
                supplierName = supplier?.Name ?? "Tedarikçi",
                supplierEmail = supplier?.Email,
                items = items,
                expiresAt = tokenResponse.ExpiresAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting form data for token: {Token}", token);
            return StatusCode(500, new { message = "Bir hata oluştu" });
        }
    }

    /// <summary>
    /// Submit quotation (public endpoint)
    /// </summary>
    [HttpPost("{token}")]
    public async Task<ActionResult<object>> SubmitQuotation(string token, [FromBody] SupplierQuotationSubmitDto dto)
    {
        try
        {
            // Find and validate token
            var tokenResponse = await _supabaseService.Client
                .From<QuotationToken>()
                .Filter("token", Supabase.Postgrest.Constants.Operator.Equals, token)
                .Single();

            if (tokenResponse == null)
                return NotFound(new { message = "Geçersiz veya bulunamayan token" });

            if (tokenResponse.ExpiresAt < DateTime.UtcNow)
                return BadRequest(new { message = "Bu teklif formu süresi dolmuş" });

            if (tokenResponse.UsedAt != null)
                return BadRequest(new { message = "Bu teklif formu daha önce kullanılmış" });

            // Generate quotation number
            var quotationNumber = $"TEK-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";

            // Calculate total amount
            decimal totalAmount = 0;
            foreach (var item in dto.Items)
            {
                totalAmount += item.Quantity * item.UnitPrice;
            }

            // Create quotation
            var quotation = new Quotation
            {
                Id = Guid.NewGuid(),
                RequestId = tokenResponse.RequestId,
                SupplierId = tokenResponse.SupplierId,
                QuotationNumber = quotationNumber,
                QuotationDate = DateTime.Today,
                ValidUntil = dto.ValidUntil,
                Status = "pending",
                TotalAmount = totalAmount,
                Currency = dto.Currency ?? "TRY",
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var quotationResponse = await _supabaseService.Client
                .From<Quotation>()
                .Insert(quotation);

            var createdQuotation = quotationResponse.Models.First();

            // Create quotation items
            var quotationItems = dto.Items.Select(item => new QuotationItem
            {
                Id = Guid.NewGuid(),
                QuotationId = createdQuotation.Id,
                MaterialId = item.MaterialId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                TotalPrice = item.Quantity * item.UnitPrice,
                DeliveryTime = item.DeliveryDays,
                Notes = item.Notes,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            if (quotationItems.Any())
            {
                await _supabaseService.Client
                    .From<QuotationItem>()
                    .Insert(quotationItems);
            }

            // Mark token as used
            tokenResponse.UsedAt = DateTime.UtcNow;
            await _supabaseService.Client
                .From<QuotationToken>()
                .Update(tokenResponse);

            // Update material request status to quotations_received
            var request = await _supabaseService.Client
                .From<MaterialRequest>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, tokenResponse.RequestId.ToString())
                .Single();

            if (request != null)
            {
                request.Status = "quotations_received";
                request.UpdatedAt = DateTime.UtcNow;
                await _supabaseService.Client
                    .From<MaterialRequest>()
                    .Update(request);
            }

            _logger.LogInformation("Quotation submitted: {QuotationNumber} for request {RequestId}", 
                quotationNumber, tokenResponse.RequestId);

            return Ok(new
            {
                success = true,
                message = "Teklifiniz başarıyla alındı",
                quotationNumber = quotationNumber,
                totalAmount = totalAmount
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting quotation for token: {Token}", token);
            return StatusCode(500, new { message = "Teklif gönderilirken bir hata oluştu: " + ex.Message });
        }
    }
}

/// <summary>
/// DTO for supplier quotation submission
/// </summary>
public class SupplierQuotationSubmitDto
{
    public List<SupplierQuotationItemDto> Items { get; set; } = new();
    public DateTime? ValidUntil { get; set; }
    public string? Currency { get; set; }
    public string? Notes { get; set; }
}

public class SupplierQuotationItemDto
{
    public Guid MaterialId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public int? DeliveryDays { get; set; }
    public string? Notes { get; set; }
}
