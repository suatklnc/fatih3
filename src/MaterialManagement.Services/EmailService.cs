using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;

namespace MaterialManagement.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly IConfiguration _configuration;

    public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = false)
    {
        try
        {
            var smtpHost = _configuration["Smtp:Host"] ?? Environment.GetEnvironmentVariable("SMTP_HOST") ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_configuration["Smtp:Port"] ?? Environment.GetEnvironmentVariable("SMTP_PORT") ?? "587");
            var smtpUsername = _configuration["Smtp:Username"] ?? Environment.GetEnvironmentVariable("SMTP_USERNAME") ?? "";
            var smtpPassword = _configuration["Smtp:Password"] ?? Environment.GetEnvironmentVariable("SMTP_PASSWORD") ?? "";
            var fromEmail = _configuration["Smtp:FromEmail"] ?? Environment.GetEnvironmentVariable("SMTP_FROM_EMAIL") ?? smtpUsername;

            if (string.IsNullOrEmpty(smtpUsername) || string.IsNullOrEmpty(smtpPassword))
            {
                // SMTP ayarları yoksa sadece logla (development mode)
                _logger.LogWarning("SMTP not configured. Email would be sent to: {To}", to);
                _logger.LogInformation("================ EMAIL (NOT SENT - NO SMTP CONFIG) ================");
                _logger.LogInformation("To: {To}", to);
                _logger.LogInformation("Subject: {Subject}", subject);
                _logger.LogInformation("Body: {Body}", body);
                _logger.LogInformation("====================================================================");
                return;
            }

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                Credentials = new NetworkCredential(smtpUsername, smtpPassword),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(fromEmail),
                Subject = subject,
                Body = body,
                IsBodyHtml = isHtml
            };
            mailMessage.To.Add(to);

            await client.SendMailAsync(mailMessage);
            
            _logger.LogInformation("================ EMAIL SENT ================");
            _logger.LogInformation("To: {To}", to);
            _logger.LogInformation("Subject: {Subject}", subject);
            _logger.LogInformation("============================================");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email to {To}: {Message}", to, ex.Message);
            throw;
        }
    }
}
