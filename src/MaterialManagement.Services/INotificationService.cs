using MaterialManagement.Models;

namespace MaterialManagement.Services;

public interface INotificationService
{
    Task<List<Notification>> GetUserNotificationsAsync(Guid userId);
    Task<Notification> CreateNotificationAsync(Notification notification);
    Task<bool> MarkAsReadAsync(Guid notificationId);
    Task<bool> MarkAllAsReadAsync(Guid userId);
}
