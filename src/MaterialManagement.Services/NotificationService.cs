using Supabase.Postgrest;
using Microsoft.Extensions.Logging;
using MaterialManagement.Models;

namespace MaterialManagement.Services;

public class NotificationService : INotificationService
{
    private readonly SupabaseService _supabaseService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(SupabaseService supabaseService, ILogger<NotificationService> logger)
    {
        _supabaseService = supabaseService;
        _logger = logger;
    }

    public async Task<List<Notification>> GetUserNotificationsAsync(Guid userId)
    {
        try
        {
            var response = await _supabaseService.Client
                .From<Notification>()
                .Filter("user_id", Supabase.Postgrest.Constants.Operator.Equals, userId.ToString())
                .Order("created_at", Supabase.Postgrest.Constants.Ordering.Descending)
                .Get();
            
            return response.Models;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user notifications: {UserId}", userId);
            throw;
        }
    }

    public async Task<Notification> CreateNotificationAsync(Notification notification)
    {
        try
        {
            notification.Id = Guid.NewGuid();
            notification.CreatedAt = DateTime.UtcNow;
            
            var response = await _supabaseService.Client
                .From<Notification>()
                .Insert(notification);
            
            return response.Models.First();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating notification");
            throw;
        }
    }

    public async Task<bool> MarkAsReadAsync(Guid notificationId)
    {
        try
        {
            var notification = await _supabaseService.Client
                .From<Notification>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, notificationId.ToString())
                .Single();
            
            notification.IsRead = true;
            await notification.Update<Notification>();
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification as read: {NotificationId}", notificationId);
            return false;
        }
    }

    public async Task<bool> MarkAllAsReadAsync(Guid userId)
    {
        try
        {
            var notifications = await GetUserNotificationsAsync(userId);
            var unreadNotifications = notifications.Where(n => !n.IsRead).ToList();
            
            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
                await notification.Update<Notification>();
            }
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking all notifications as read: {UserId}", userId);
            return false;
        }
    }
}
