namespace MaterialManagement.Services;

public interface IEmailService
{
    Task<bool> SendEmailAsync(string recipientEmail, string subject, string body);
    Task<bool> SendRequestApprovalEmailAsync(string recipientEmail, Guid requestId, string requestNumber);
    Task<bool> SendQuotationReceivedEmailAsync(string recipientEmail, Guid quotationId, string quotationNumber);
}
