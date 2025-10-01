using System.ComponentModel.DataAnnotations;

namespace ChatService.DTOs;

// 채팅방 생성 요청 DTO
public class CreateChatRoomRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(50)]
    public string Type { get; set; } = "public";

    [StringLength(7)]
    public string? Color { get; set; }

    [StringLength(255)]
    public string? AvatarUrl { get; set; }

    public int MaxMembers { get; set; } = 0;
}

// 채팅방 업데이트 요청 DTO
public class UpdateChatRoomRequest
{
    [StringLength(100, MinimumLength = 1)]
    public string? Name { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(7)]
    public string? Color { get; set; }

    [StringLength(255)]
    public string? AvatarUrl { get; set; }

    public int? MaxMembers { get; set; }
}

// 메시지 전송 요청 DTO
public class SendMessageRequest
{
    [Required]
    [StringLength(2000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;

    [Required]
    public int RoomId { get; set; }

    [StringLength(50)]
    public string? MessageType { get; set; } = "text";

    [StringLength(500)]
    public string? FileUrl { get; set; }

    [StringLength(100)]
    public string? FileName { get; set; }

    public long? FileSize { get; set; }

    [StringLength(100)]
    public string? MimeType { get; set; }

    public int? ReplyToId { get; set; }
}

// 메시지 수정 요청 DTO
public class EditMessageRequest
{
    [Required]
    [StringLength(2000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;
}

// 채팅방 참여 요청 DTO
public class JoinRoomRequest
{
    [Required]
    public int RoomId { get; set; }
}

// 채팅방 나가기 요청 DTO
public class LeaveRoomRequest
{
    [Required]
    public int RoomId { get; set; }
}

// 이모지 반응 요청 DTO
public class AddReactionRequest
{
    [Required]
    public int MessageId { get; set; }

    [Required]
    [StringLength(10, MinimumLength = 1)]
    public string Emoji { get; set; } = string.Empty;
}

// 온라인 상태 업데이트 요청 DTO
public class UpdateStatusRequest
{
    [StringLength(20)]
    public string? Status { get; set; }

    [StringLength(100)]
    public string? CustomStatus { get; set; }
}

// 채팅방 응답 DTO
public class ChatRoomResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Color { get; set; }
    public string? AvatarUrl { get; set; }
    public int CreatedBy { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int MaxMembers { get; set; }
    public int MemberCount { get; set; }
    public int UnreadCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public ChatMessageResponse? LastMessage { get; set; }
    public List<ChatRoomMemberResponse> Members { get; set; } = new();
}

// 메시지 응답 DTO
public class ChatMessageResponse
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public string Content { get; set; } = string.Empty;
    public string MessageType { get; set; } = string.Empty;
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public string? MimeType { get; set; }
    public int? ReplyToId { get; set; }
    public ChatMessageResponse? ReplyTo { get; set; }
    public bool IsEdited { get; set; }
    public bool IsDeleted { get; set; }
    public int ReactionCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<ChatReactionResponse> Reactions { get; set; } = new();
    public List<ChatMessageResponse> Replies { get; set; } = new();
}

// 채팅방 멤버 응답 DTO
public class ChatRoomMemberResponse
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime JoinedAt { get; set; }
    public DateTime? LastReadAt { get; set; }
    public bool IsOnline { get; set; }
    public string? OnlineStatus { get; set; }
}

// 이모지 반응 응답 DTO
public class ChatReactionResponse
{
    public int Id { get; set; }
    public int MessageId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

// 사용자 온라인 상태 응답 DTO
public class UserOnlineStatusResponse
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? CustomStatus { get; set; }
    public DateTime LastSeenAt { get; set; }
    public bool IsOnline { get; set; }
}

// 메시지 히스토리 요청 DTO
public class GetMessagesRequest
{
    public int RoomId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
    public DateTime? Before { get; set; }
    public DateTime? After { get; set; }
    public string? MessageType { get; set; }
}

// 메시지 히스토리 응답 DTO
public class GetMessagesResponse
{
    public List<ChatMessageResponse> Messages { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasMore { get; set; }
}

// 채팅방 검색 요청 DTO
public class SearchRoomsRequest
{
    [StringLength(100)]
    public string? Query { get; set; }
    public string? Type { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

// 채팅방 검색 응답 DTO
public class SearchRoomsResponse
{
    public List<ChatRoomResponse> Rooms { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
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
