using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ChatService.Services;
using System.Security.Claims;

namespace ChatService.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(IChatService chatService, ILogger<ChatHub> logger)
    {
        _chatService = chatService;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId.HasValue)
            {
                // 사용자를 온라인 상태로 설정
                await _chatService.UpdateUserOnlineStatusAsync(userId.Value, "online");

                // 사용자가 참여한 모든 채팅방에 연결
                var userRooms = await _chatService.GetUserRoomsAsync(userId.Value);
                foreach (var room in userRooms)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"Room_{room.Id}");
                }

                // 온라인 상태 변경 알림
                await Clients.All.SendAsync("UserStatusChanged", new
                {
                    UserId = userId.Value,
                    Status = "online",
                    LastSeenAt = DateTime.UtcNow
                });

                _logger.LogInformation("User {UserId} connected to chat hub", userId.Value);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in OnConnectedAsync");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId.HasValue)
            {
                // 사용자를 오프라인 상태로 설정
                await _chatService.UpdateUserOnlineStatusAsync(userId.Value, "offline");

                // 오프라인 상태 변경 알림
                await Clients.All.SendAsync("UserStatusChanged", new
                {
                    UserId = userId.Value,
                    Status = "offline",
                    LastSeenAt = DateTime.UtcNow
                });

                _logger.LogInformation("User {UserId} disconnected from chat hub", userId.Value);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in OnDisconnectedAsync");
        }

        await base.OnDisconnectedAsync(exception);
    }

    // 채팅방 참여
    public async Task JoinRoom(int roomId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return;

            var result = await _chatService.JoinRoomAsync(roomId, userId.Value);
            if (result.Success)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"Room_{roomId}");
                await Clients.Group($"Room_{roomId}").SendAsync("UserJoinedRoom", new
                {
                    RoomId = roomId,
                    UserId = userId.Value,
                    UserName = result.Data?.CreatedByName ?? "Unknown"
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining room {RoomId}", roomId);
        }
    }

    // 채팅방 나가기
    public async Task LeaveRoom(int roomId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return;

            var result = await _chatService.LeaveRoomAsync(roomId, userId.Value);
            if (result.Success)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Room_{roomId}");
                await Clients.Group($"Room_{roomId}").SendAsync("UserLeftRoom", new
                {
                    RoomId = roomId,
                    UserId = userId.Value
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leaving room {RoomId}", roomId);
        }
    }

    // 메시지 전송
    public async Task SendMessage(int roomId, string content, string messageType = "text",
        string? fileUrl = null, string? fileName = null, long? fileSize = null,
        string? mimeType = null, int? replyToId = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return;

            var request = new SendMessageRequest
            {
                Content = content,
                RoomId = roomId,
                MessageType = messageType,
                FileUrl = fileUrl,
                FileName = fileName,
                FileSize = fileSize,
                MimeType = mimeType,
                ReplyToId = replyToId
            };

            var result = await _chatService.SendMessageAsync(request, userId.Value);
            if (result.Success)
            {
                await Clients.Group($"Room_{roomId}").SendAsync("MessageReceived", result.Data);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message to room {RoomId}", roomId);
        }
    }

    // 메시지 수정
    public async Task EditMessage(int messageId, string content)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return;

            var request = new EditMessageRequest { Content = content };
            var result = await _chatService.EditMessageAsync(messageId, request, userId.Value);
            if (result.Success)
            {
                await Clients.Group($"Room_{result.Data.RoomId}").SendAsync("MessageEdited", result.Data);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error editing message {MessageId}", messageId);
        }
    }

    // 메시지 삭제
    public async Task DeleteMessage(int messageId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return;

            var result = await _chatService.DeleteMessageAsync(messageId, userId.Value);
            if (result.Success)
            {
                await Clients.Group($"Room_{result.Data.RoomId}").SendAsync("MessageDeleted", new
                {
                    MessageId = messageId,
                    RoomId = result.Data.RoomId
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting message {MessageId}", messageId);
        }
    }

    // 이모지 반응 추가
    public async Task AddReaction(int messageId, string emoji)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return;

            var request = new AddReactionRequest
            {
                MessageId = messageId,
                Emoji = emoji
            };

            var result = await _chatService.AddReactionAsync(request, userId.Value);
            if (result.Success)
            {
                var message = await _chatService.GetMessageByIdAsync(messageId);
                if (message.Success)
                {
                    await Clients.Group($"Room_{message.Data.RoomId}").SendAsync("ReactionAdded", new
                    {
                        MessageId = messageId,
                        Reaction = result.Data
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding reaction to message {MessageId}", messageId);
        }
    }

    // 이모지 반응 제거
    public async Task RemoveReaction(int messageId, string emoji)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return;

            var result = await _chatService.RemoveReactionAsync(messageId, emoji, userId.Value);
            if (result.Success)
            {
                var message = await _chatService.GetMessageByIdAsync(messageId);
                if (message.Success)
                {
                    await Clients.Group($"Room_{message.Data.RoomId}").SendAsync("ReactionRemoved", new
                    {
                        MessageId = messageId,
                        Emoji = emoji,
                        UserId = userId.Value
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing reaction from message {MessageId}", messageId);
        }
    }

    // 타이핑 상태 전송
    public async Task Typing(int roomId, bool isTyping)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return;

            await Clients.GroupExcept($"Room_{roomId}", Context.ConnectionId).SendAsync("UserTyping", new
            {
                RoomId = roomId,
                UserId = userId.Value,
                IsTyping = isTyping
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending typing status for room {RoomId}", roomId);
        }
    }

    // 메시지 읽음 처리
    public async Task MarkAsRead(int roomId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return;

            await _chatService.MarkMessagesAsReadAsync(roomId, userId.Value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking messages as read for room {RoomId}", roomId);
        }
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = Context.User?.FindFirst("userId");
        return userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId) ? userId : null;
    }
}
