using System.ComponentModel.DataAnnotations;

namespace NotificationService.DTOs;

// 알림 생성 요청 DTO
public class CreateNotificationRequest
{
    [Required]
    public int UserId { get; set; }

    [Required]
    [StringLength(100)]
    public string Type { get; set; } = string.Empty;

    [Required]
    [StringLength(255)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(1000)]
    public string Message { get; set; } = string.Empty;

    [StringLength(500)]
    public string? ActionUrl { get; set; }

    [StringLength(255)]
    public string? ImageUrl { get; set; }

    public int? RelatedId { get; set; }

    [StringLength(50)]
    public string? RelatedType { get; set; }

    public int Priority { get; set; } = 1;

    public DateTime? ExpiresAt { get; set; }
}

// 알림 읽음 처리 요청 DTO
public class MarkAsReadRequest
{
    [Required]
    public List<int> NotificationIds { get; set; } = new();
}

// 알림 삭제 요청 DTO
public class DeleteNotificationRequest
{
    [Required]
    public List<int> NotificationIds { get; set; } = new();
}

// 알림 설정 업데이트 요청 DTO
public class UpdateNotificationSettingsRequest
{
    [Required]
    public string Type { get; set; } = string.Empty;

    public bool EmailEnabled { get; set; } = true;
    public bool PushEnabled { get; set; } = true;
    public bool InAppEnabled { get; set; } = true;
}

// 푸시 토큰 등록 요청 DTO
public class RegisterPushTokenRequest
{
    [Required]
    [StringLength(500)]
    public string Token { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Platform { get; set; } = string.Empty;

    [StringLength(100)]
    public string? DeviceId { get; set; }
}

// 알림 응답 DTO
public class NotificationDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ActionUrl { get; set; }
    public string? ImageUrl { get; set; }
    public int? RelatedId { get; set; }
    public string? RelatedType { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}

// 알림 설정 DTO
public class NotificationSettingsDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public bool EmailEnabled { get; set; }
    public bool PushEnabled { get; set; }
    public bool InAppEnabled { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// 알림 설정 응답 DTO
public class NotificationSettingsResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public bool EmailEnabled { get; set; }
    public bool PushEnabled { get; set; }
    public bool InAppEnabled { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// 알림 통계 응답 DTO
public class NotificationStatsResponse
{
    public int TotalCount { get; set; }
    public int UnreadCount { get; set; }
    public int ReadCount { get; set; }
    public int DeletedCount { get; set; }
    public Dictionary<string, int> CountByType { get; set; } = new();
    public Dictionary<int, int> CountByPriority { get; set; } = new();
}

// 알림 목록 조회 요청 DTO
public class GetNotificationsRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public bool? IsRead { get; set; }
    public string? Type { get; set; }
    public int? Priority { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

// 알림 목록 응답 DTO
public class GetNotificationsResponse
{
    public List<NotificationDto> Notifications { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasMore { get; set; }
}

// 알림 템플릿 생성 요청 DTO
public class CreateNotificationTemplateRequest
{
    [Required]
    [StringLength(100)]
    public string Type { get; set; } = string.Empty;

    [Required]
    [StringLength(255)]
    public string TitleTemplate { get; set; } = string.Empty;

    [Required]
    [StringLength(1000)]
    public string MessageTemplate { get; set; } = string.Empty;

    [StringLength(500)]
    public string? ActionUrlTemplate { get; set; }

    public int Priority { get; set; } = 1;
}

// 알림 템플릿 응답 DTO
public class NotificationTemplateResponse
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string TitleTemplate { get; set; } = string.Empty;
    public string MessageTemplate { get; set; } = string.Empty;
    public string? ActionUrlTemplate { get; set; }
    public bool IsActive { get; set; }
    public int Priority { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// API 응답 래퍼 DTO
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string> Errors { get; set; } = new();

    public static ApiResponse<T> SuccessResult(T data, string message = "Success")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Data = data
        };
    }

    public static ApiResponse<T> ErrorResult(string message, List<string>? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = errors ?? new List<string>()
        };
    }
}
