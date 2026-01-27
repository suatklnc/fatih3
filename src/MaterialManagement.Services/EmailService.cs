using Microsoft.Extensions.Logging;

namespace MaterialManagement.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
    }

    public Task SendEmailAsync(string to, string subject, string body)
    {
        // Gerçek ortamda buraya SMTP kodları gelecek.
        // Şimdilik sadece logluyoruz.
        _logger.LogInformation("================ EMAIL SENT ================");
        _logger.LogInformation("To: {To}", to);
        _logger.LogInformation("Subject: {Subject}", subject);
        _logger.LogInformation("Body: {Body}", body);
        _logger.LogInformation("============================================");
        
        return Task.CompletedTask;
    }
}
