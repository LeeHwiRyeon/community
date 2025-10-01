using ChatService.DTOs;

namespace ChatService.Services;

public interface IChatService
{
    // 채팅방 관리
    Task<ApiResponse<ChatRoomResponse>> CreateRoomAsync(CreateChatRoomRequest request, int userId);
    Task<ApiResponse<ChatRoomResponse>> GetRoomByIdAsync(int roomId, int? userId = null);
    Task<ApiResponse<List<ChatRoomResponse>>> GetUserRoomsAsync(int userId);
    Task<ApiResponse<ChatRoomResponse>> UpdateRoomAsync(int roomId, UpdateChatRoomRequest request, int userId);
    Task<ApiResponse<bool>> DeleteRoomAsync(int roomId, int userId);
    Task<ApiResponse<SearchRoomsResponse>> SearchRoomsAsync(SearchRoomsRequest request, int? userId = null);

    // 채팅방 참여/나가기
    Task<ApiResponse<bool>> JoinRoomAsync(int roomId, int userId);
    Task<ApiResponse<bool>> LeaveRoomAsync(int roomId, int userId);
    Task<ApiResponse<List<ChatRoomMemberResponse>>> GetRoomMembersAsync(int roomId, int? userId = null);

    // 메시지 관리
    Task<ApiResponse<ChatMessageResponse>> SendMessageAsync(SendMessageRequest request, int userId);
    Task<ApiResponse<ChatMessageResponse>> GetMessageByIdAsync(int messageId);
    Task<ApiResponse<GetMessagesResponse>> GetMessagesAsync(GetMessagesRequest request, int? userId = null);
    Task<ApiResponse<ChatMessageResponse>> EditMessageAsync(int messageId, EditMessageRequest request, int userId);
    Task<ApiResponse<ChatMessageResponse>> DeleteMessageAsync(int messageId, int userId);

    // 이모지 반응
    Task<ApiResponse<ChatReactionResponse>> AddReactionAsync(AddReactionRequest request, int userId);
    Task<ApiResponse<bool>> RemoveReactionAsync(int messageId, string emoji, int userId);

    // 사용자 상태 관리
    Task<ApiResponse<bool>> UpdateUserOnlineStatusAsync(int userId, string status, string? customStatus = null);
    Task<ApiResponse<List<UserOnlineStatusResponse>>> GetOnlineUsersAsync();
    Task<ApiResponse<UserOnlineStatusResponse>> GetUserStatusAsync(int userId);

    // 읽음 처리
    Task<ApiResponse<bool>> MarkMessagesAsReadAsync(int roomId, int userId);
    Task<ApiResponse<int>> GetUnreadCountAsync(int roomId, int userId);

    // 통계
    Task<ApiResponse<object>> GetChatStatsAsync();
}
