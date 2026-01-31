using Supabase.Postgrest;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using MaterialManagement.Models;
using MaterialManagement.Models.DTOs;

namespace MaterialManagement.Services;

public class MaterialRequestService : IMaterialRequestService
{
    private readonly SupabaseService _supabaseService;
    private readonly ILogger<MaterialRequestService> _logger;
    private readonly IEmailService _emailService;
    private readonly ISupplierService _supplierService;
    private readonly IMaterialService _materialService;
    private readonly IConfiguration _configuration;

    public MaterialRequestService(
        SupabaseService supabaseService, 
        ILogger<MaterialRequestService> logger,
        IEmailService emailService,
        ISupplierService supplierService,
        IMaterialService materialService,
        IConfiguration configuration)
    {
        _supabaseService = supabaseService;
        _logger = logger;
        _emailService = emailService;
        _supplierService = supplierService;
        _materialService = materialService;
        _configuration = configuration;
    }

    // ... (GetAll, GetById, Create, UpdateStatus, SendToPurchasing aynı)

    public async Task<MaterialRequest> SendToSuppliersAsync(Guid id, List<Guid> supplierIds)
    {
        try
        {
            var request = await GetRequestByIdAsync(id);
            if (request == null)
                throw new Exception("Request not found");
            
            // Malzeme detaylarını HTML tablo satırları olarak oluştur
            var materialsTableRows = new System.Text.StringBuilder();
            int rowIndex = 1;
            foreach (var item in request.Items)
            {
                var material = await _materialService.GetMaterialByIdAsync(item.MaterialId);
                var materialName = material?.Name ?? item.MaterialId.ToString();
                var materialCode = material?.Code ?? "-";
                var unit = material?.Unit ?? "Adet";
                var bgColor = rowIndex % 2 == 0 ? "#f8f9fa" : "#ffffff";
                
                materialsTableRows.AppendLine($@"
                    <tr style=""background-color: {bgColor};"">
                        <td style=""padding: 12px; border-bottom: 1px solid #dee2e6;"">{rowIndex}</td>
                        <td style=""padding: 12px; border-bottom: 1px solid #dee2e6;"">{materialCode}</td>
                        <td style=""padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: 500;"">{materialName}</td>
                        <td style=""padding: 12px; border-bottom: 1px solid #dee2e6; text-align: center;"">{item.Quantity:N2}</td>
                        <td style=""padding: 12px; border-bottom: 1px solid #dee2e6; text-align: center;"">{unit}</td>
                        <td style=""padding: 12px; border-bottom: 1px solid #dee2e6;"">{item.Notes ?? "-"}</td>
                    </tr>");
                rowIndex++;
            }

            foreach (var supplierId in supplierIds)
            {
                var supplier = await _supplierService.GetByIdAsync(supplierId);
                if (supplier != null && !string.IsNullOrEmpty(supplier.Email))
                {
                    string subject = $"📋 Teklif İsteği - Talep No: {request.RequestNumber}";
                    
                    // Teklif formu için benzersiz token oluştur ve kaydet
                    var quotationToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray()).Replace("+", "-").Replace("/", "_").TrimEnd('=');
                    
                    // Token'ı veritabanına kaydet
                    var tokenEntity = new QuotationToken
                    {
                        Id = Guid.NewGuid(),
                        Token = quotationToken,
                        RequestId = id,
                        SupplierId = supplierId,
                        ExpiresAt = DateTime.UtcNow.AddDays(7), // 7 gün geçerli
                        CreatedAt = DateTime.UtcNow
                    };
                    
                    await _supabaseService.Client
                        .From<QuotationToken>()
                        .Insert(tokenEntity);
                    
                    // Online form URL'i: mevcut domain (Coolify/production) veya localhost
                    var baseUrl = (_configuration["App:BaseUrl"] ?? Environment.GetEnvironmentVariable("APP_URL") ?? "http://localhost:3000").TrimEnd('/');
                    var formUrl = $"{baseUrl}/supplier-quote/{quotationToken}";
                    
                    string body = $@"
<!DOCTYPE html>
<html lang=""tr"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
</head>
<body style=""margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;"">
    <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""max-width: 700px; margin: 0 auto; background-color: #ffffff;"">
        <!-- Header -->
        <tr>
            <td style=""background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;"">
                <h1 style=""color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;"">📋 Teklif İsteği</h1>
                <p style=""color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;"">Talep No: {request.RequestNumber}</p>
            </td>
        </tr>
        
        <!-- Content -->
        <tr>
            <td style=""padding: 30px;"">
                <p style=""font-size: 16px; color: #333; margin: 0 0 20px 0;"">
                    Sayın <strong>{supplier.Name}</strong>,
                </p>
                
                <p style=""font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 25px 0;"">
                    Aşağıda listelenen malzemeler için fiyat ve teslim süresi teklifinizi iletmenizi rica ederiz.
                </p>
                
                <!-- Info Box -->
                <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color: #f8f9fa; border-radius: 8px; margin-bottom: 25px;"">
                    <tr>
                        <td style=""padding: 20px;"">
                            <table width=""100%"" cellpadding=""0"" cellspacing=""0"">
                                <tr>
                                    <td style=""width: 50%; padding: 5px 0;"">
                                        <span style=""color: #666; font-size: 12px;"">Talep No:</span><br>
                                        <strong style=""color: #333; font-size: 14px;"">{request.RequestNumber}</strong>
                                    </td>
                                    <td style=""width: 50%; padding: 5px 0;"">
                                        <span style=""color: #666; font-size: 12px;"">Son Teklif Tarihi:</span><br>
                                        <strong style=""color: #e74c3c; font-size: 14px;"">{request.RequiredDate?.ToString("dd.MM.yyyy", System.Globalization.CultureInfo.InvariantCulture) ?? "Belirtilmemiş"}</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan=""2"" style=""padding: 5px 0;"">
                                        <span style=""color: #666; font-size: 12px;"">Malzeme Sayısı:</span><br>
                                        <strong style=""color: #333; font-size: 14px;"">{request.Items.Count} kalem</strong>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                
                <!-- Materials Table -->
                <h3 style=""color: #333; font-size: 16px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #667eea;"">
                    📦 Talep Edilen Malzemeler
                </h3>
                
                <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; margin-bottom: 25px;"">
                    <thead>
                        <tr style=""background-color: #667eea; color: #ffffff;"">
                            <th style=""padding: 12px; text-align: left; font-weight: 600; font-size: 13px;"">#</th>
                            <th style=""padding: 12px; text-align: left; font-weight: 600; font-size: 13px;"">Kod</th>
                            <th style=""padding: 12px; text-align: left; font-weight: 600; font-size: 13px;"">Malzeme Adı</th>
                            <th style=""padding: 12px; text-align: center; font-weight: 600; font-size: 13px;"">Miktar</th>
                            <th style=""padding: 12px; text-align: center; font-weight: 600; font-size: 13px;"">Birim</th>
                            <th style=""padding: 12px; text-align: left; font-weight: 600; font-size: 13px;"">Not</th>
                        </tr>
                    </thead>
                    <tbody>
                        {materialsTableRows}
                    </tbody>
                </table>
                
                <!-- Notes -->
                {(string.IsNullOrEmpty(request.Notes) ? "" : $@"
                <div style=""background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 25px; border-radius: 0 8px 8px 0;"">
                    <strong style=""color: #856404;"">📝 Ek Notlar:</strong>
                    <p style=""color: #856404; margin: 10px 0 0 0; font-size: 14px;"">{request.Notes}</p>
                </div>
                ")}
                
                <!-- CTA -->
                <div style=""text-align: center; margin: 30px 0;"">
                    <p style=""color: #666; font-size: 14px; margin-bottom: 20px;"">
                        Teklifinizi online form üzerinden veya e-posta ile gönderebilirsiniz:
                    </p>
                    
                    <a href=""{formUrl}"" 
                       style=""display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 5px;"">
                        📝 Online Teklif Formu
                    </a>
                    
                    <p style=""color: #999; font-size: 12px; margin: 15px 0;"">veya</p>
                    
                    <a href=""mailto:suatkilinc0102@gmail.com?subject=Teklif - {request.RequestNumber}"" 
                       style=""display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 5px;"">
                        ✉️ E-posta ile Gönder
                    </a>
                </div>
                
                <p style=""font-size: 14px; color: #555; line-height: 1.6; margin: 25px 0 0 0;"">
                    Sorularınız için bizimle iletişime geçebilirsiniz.
                </p>
                
                <p style=""font-size: 14px; color: #333; margin: 20px 0 0 0;"">
                    Saygılarımızla,<br>
                    <strong>Satın Alma Departmanı</strong>
                </p>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td style=""background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;"">
                <p style=""color: #666; font-size: 12px; margin: 0;"">
                    Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>";

                    await _emailService.SendEmailAsync(supplier.Email, subject, body, isHtml: true);
                }
            }
            
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
                Priority = dto.Priority ?? "normal",
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
