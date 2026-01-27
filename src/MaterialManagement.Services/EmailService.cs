using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MaterialManagement.Services;
using System.Text.Json;

namespace MaterialManagement.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly SupabaseService _supabaseService;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        IConfiguration configuration,
        SupabaseService supabaseService,
        ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _supabaseService = supabaseService;
        _logger = logger;
    }

    public async Task<bool> SendEmailAsync(string recipientEmail, string subject, string body)
    {
        try
        {
            var smtpHost = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
            var smtpUsername = _configuration["Email:SmtpUsername"] ?? "";
            var smtpPassword = _configuration["Email:SmtpPassword"] ?? "";
            var fromEmail = _configuration["Email:FromEmail"] ?? smtpUsername;

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(smtpUsername, smtpPassword)
            };

            using var message = new MailMessage(fromEmail, recipientEmail, subject, body)
            {
                IsBodyHtml = true
            };

            await client.SendMailAsync(message);

            // Log email
            await LogEmailAsync(recipientEmail, subject, body, "sent");

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email to {RecipientEmail}", recipientEmail);
            
            // Log failed email
            await LogEmailAsync(recipientEmail, subject, body, "failed", ex.Message);
            
            return false;
        }
    }

    public async Task<bool> SendRequestApprovalEmailAsync(string recipientEmail, Guid requestId, string requestNumber)
    {
        var subject = $"Malzeme Talebi Onay Bekliyor - {requestNumber}";
        var body = $@"
            <h2>Malzeme Talebi Onay Bekliyor</h2>
            <p>Sayın Yetkili,</p>
            <p><strong>Talep No:</strong> {requestNumber}</p>
            <p>Yeni bir malzeme talebi onayınızı bekliyor.</p>
            <p>Lütfen sisteme giriş yaparak talebi inceleyin ve onaylayın.</p>
            <p>Teşekkürler.</p>
        ";

        return await SendEmailAsync(recipientEmail, subject, body);
    }

    public async Task<bool> SendQuotationReceivedEmailAsync(string recipientEmail, Guid quotationId, string quotationNumber)
    {
        var subject = $"Yeni Teklif Alındı - {quotationNumber}";
        var body = $@"
            <h2>Yeni Teklif Alındı</h2>
            <p>Sayın Yetkili,</p>
            <p><strong>Teklif No:</strong> {quotationNumber}</p>
            <p>Tedarikçiden yeni bir teklif alındı.</p>
            <p>Lütfen sisteme giriş yaparak teklifi inceleyin.</p>
            <p>Teşekkürler.</p>
        ";

        return await SendEmailAsync(recipientEmail, subject, body);
    }

    private async Task LogEmailAsync(string recipientEmail, string subject, string body, string status, string? errorMessage = null)
    {
        try
        {
            var emailLog = new
            {
                id = Guid.NewGuid(),
                recipient_email = recipientEmail,
                subject = subject,
                body = body,
                status = status,
                error_message = errorMessage,
                sent_at = status == "sent" ? DateTime.UtcNow : (DateTime?)null,
                created_at = DateTime.UtcNow
            };

            // Email log için basit bir yaklaşım - Supabase REST API kullan
            var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Add("apikey", _configuration["Supabase:Key"] ?? "");
            httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_configuration["Supabase:Key"] ?? ""}");
            httpClient.DefaultRequestHeaders.Add("Content-Type", "application/json");
            httpClient.DefaultRequestHeaders.Add("Prefer", "return=representation");
            
            var supabaseUrl = _configuration["Supabase:Url"] ?? "";
            var json = System.Text.Json.JsonSerializer.Serialize(emailLog);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            await httpClient.PostAsync($"{supabaseUrl}/rest/v1/email_logs", content);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging email");
        }
    }
}
