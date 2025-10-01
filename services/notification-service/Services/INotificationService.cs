using NotificationService.DTOs;

namespace NotificationService.Services;

public interface INotificationService
{
    Task<ServiceResult<NotificationDto>> CreateNotificationAsync(CreateNotificationRequest request);
    Task<ServiceResult<List<NotificationDto>>> GetUserNotificationsAsync(int userId, int page = 1, int pageSize = 20);
    Task<ServiceResult<NotificationDto>> GetNotificationByIdAsync(int id, int userId);
    Task<ServiceResult<bool>> MarkAsReadAsync(MarkAsReadRequest request, int userId);
    Task<ServiceResult<bool>> DeleteNotificationsAsync(DeleteNotificationRequest request, int userId);
    Task<ServiceResult<NotificationSettingsDto>> GetNotificationSettingsAsync(int userId);
    Task<ServiceResult<NotificationSettingsDto>> UpdateNotificationSettingsAsync(UpdateNotificationSettingsRequest request, int userId);
    Task<ServiceResult<bool>> RegisterPushTokenAsync(RegisterPushTokenRequest request, int userId);
    Task<ServiceResult<bool>> SendPushNotificationAsync(int userId, string title, string message, string? actionUrl = null);
    Task<ServiceResult<bool>> SendEmailNotificationAsync(int userId, string subject, string body, string? actionUrl = null);
    Task<ServiceResult<List<NotificationDto>>> GetUnreadCountAsync(int userId);
    Task<ServiceResult<bool>> MarkAllAsReadAsync(int userId);
    Task<ServiceResult<bool>> DeleteAllNotificationsAsync(int userId);
}

public class ServiceResult<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }

    public static ServiceResult<T> CreateSuccess(T data)
    {
        return new ServiceResult<T>
        {
            Success = true,
            Data = data
        };
    }

    public static ServiceResult<T> CreateError(string errorMessage, string? errorCode = null)
    {
        return new ServiceResult<T>
        {
            Success = false,
            ErrorMessage = errorMessage,
            ErrorCode = errorCode
        };
    }
}
