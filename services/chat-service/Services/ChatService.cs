using Microsoft.EntityFrameworkCore;
using ChatService.Data;
using ChatService.DTOs;
using ChatService.Models;
using AutoMapper;
using StackExchange.Redis;
using System.Text.Json;

namespace ChatService.Services;

public class ChatService : IChatService
{
    private readonly ChatDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICacheService _cacheService;
    private readonly ILogger<ChatService> _logger;

    public ChatService(
        ChatDbContext context,
        IMapper mapper,
        ICacheService cacheService,
        ILogger<ChatService> logger)
    {
        _context = context;
        _mapper = mapper;
        _cacheService = cacheService;
        _logger = logger;
    }

    #region Chat Room Management

    public async Task<ApiResponse<ChatRoomResponse>> CreateRoomAsync(CreateChatRoomRequest request, int userId)
    {
        try
        {
            var room = new ChatRoom
            {
                Name = request.Name,
                Description = request.Description,
                Type = request.Type,
                Color = request.Color,
                AvatarUrl = request.AvatarUrl,
                CreatedBy = userId,
                MaxMembers = request.MaxMembers,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ChatRooms.Add(room);
            await _context.SaveChangesAsync();

            // 생성자를 자동으로 멤버로 추가
            var member = new ChatRoomMember
            {
                RoomId = room.Id,
                UserId = userId,
                Role = "admin",
                JoinedAt = DateTime.UtcNow
            };
            _context.ChatRoomMembers.Add(member);
            await _context.SaveChangesAsync();

            // 캐시 무효화
            await _cacheService.RemoveAsync($"user:{userId}:rooms");

            var roomResponse = await GetChatRoomResponseAsync(room.Id, userId);
            return ApiResponse<ChatRoomResponse>.SuccessResult(roomResponse, "Room created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating room for user {UserId}", userId);
            return ApiResponse<ChatRoomResponse>.ErrorResult($"Error creating room: {ex.Message}");
        }
    }

    public async Task<ApiResponse<ChatRoomResponse>> GetRoomByIdAsync(int roomId, int? userId = null)
    {
        try
        {
            var cacheKey = $"room:{roomId}:user:{userId ?? 0}";
            var cachedRoom = await _cacheService.GetAsync<ChatRoomResponse>(cacheKey);
            if (cachedRoom != null)
            {
                return ApiResponse<ChatRoomResponse>.SuccessResult(cachedRoom);
            }

            var room = await _context.ChatRooms
                .Include(r => r.Members)
                .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(r => r.Id == roomId && r.IsActive);

            if (room == null)
            {
                return ApiResponse<ChatRoomResponse>.ErrorResult("Room not found");
            }

            var roomResponse = await GetChatRoomResponseAsync(room.Id, userId);

            // 캐시에 저장 (5분)
            await _cacheService.SetAsync(cacheKey, roomResponse, TimeSpan.FromMinutes(5));

            return ApiResponse<ChatRoomResponse>.SuccessResult(roomResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving room {RoomId}", roomId);
            return ApiResponse<ChatRoomResponse>.ErrorResult($"Error retrieving room: {ex.Message}");
        }
    }

    public async Task<ApiResponse<List<ChatRoomResponse>>> GetUserRoomsAsync(int userId)
    {
        try
        {
            var cacheKey = $"user:{userId}:rooms";
            var cachedRooms = await _cacheService.GetAsync<List<ChatRoomResponse>>(cacheKey);
            if (cachedRooms != null)
            {
                return ApiResponse<List<ChatRoomResponse>>.SuccessResult(cachedRooms);
            }

            var rooms = await _context.ChatRooms
                .Include(r => r.Members)
                .ThenInclude(m => m.User)
                .Where(r => r.IsActive && r.Members.Any(m => m.UserId == userId && m.IsActive))
                .OrderByDescending(r => r.UpdatedAt)
                .ToListAsync();

            var roomResponses = new List<ChatRoomResponse>();
            foreach (var room in rooms)
            {
                var roomResponse = await GetChatRoomResponseAsync(room.Id, userId);
                roomResponses.Add(roomResponse);
            }

            // 캐시에 저장 (2분)
            await _cacheService.SetAsync(cacheKey, roomResponses, TimeSpan.FromMinutes(2));

            return ApiResponse<List<ChatRoomResponse>>.SuccessResult(roomResponses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving rooms for user {UserId}", userId);
            return ApiResponse<List<ChatRoomResponse>>.ErrorResult($"Error retrieving rooms: {ex.Message}");
        }
    }

    #endregion

    #region Room Participation

    public async Task<ApiResponse<bool>> JoinRoomAsync(int roomId, int userId)
    {
        try
        {
            var room = await _context.ChatRooms.FindAsync(roomId);
            if (room == null || !room.IsActive)
            {
                return ApiResponse<bool>.ErrorResult("Room not found or inactive");
            }

            // 이미 참여 중인지 확인
            var existingMember = await _context.ChatRoomMembers
                .FirstOrDefaultAsync(m => m.RoomId == roomId && m.UserId == userId);

            if (existingMember != null)
            {
                if (existingMember.IsActive)
                {
                    return ApiResponse<bool>.ErrorResult("Already a member of this room");
                }
                else
                {
                    // 재참여
                    existingMember.IsActive = true;
                    existingMember.JoinedAt = DateTime.UtcNow;
                    _context.ChatRoomMembers.Update(existingMember);
                }
            }
            else
            {
                // 새 멤버 추가
                var member = new ChatRoomMember
                {
                    RoomId = roomId,
                    UserId = userId,
                    Role = "member",
                    JoinedAt = DateTime.UtcNow
                };
                _context.ChatRoomMembers.Add(member);
            }

            await _context.SaveChangesAsync();

            // 캐시 무효화
            await _cacheService.RemoveAsync($"user:{userId}:rooms");
            await _cacheService.RemoveAsync($"room:{roomId}:*");

            return ApiResponse<bool>.SuccessResult(true, "Successfully joined room");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining room {RoomId} for user {UserId}", roomId, userId);
            return ApiResponse<bool>.ErrorResult($"Error joining room: {ex.Message}");
        }
    }

    public async Task<ApiResponse<bool>> LeaveRoomAsync(int roomId, int userId)
    {
        try
        {
            var member = await _context.ChatRoomMembers
                .FirstOrDefaultAsync(m => m.RoomId == roomId && m.UserId == userId);

            if (member == null)
            {
                return ApiResponse<bool>.ErrorResult("Not a member of this room");
            }

            member.IsActive = false;
            _context.ChatRoomMembers.Update(member);
            await _context.SaveChangesAsync();

            // 캐시 무효화
            await _cacheService.RemoveAsync($"user:{userId}:rooms");
            await _cacheService.RemoveAsync($"room:{roomId}:*");

            return ApiResponse<bool>.SuccessResult(true, "Successfully left room");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leaving room {RoomId} for user {UserId}", roomId, userId);
            return ApiResponse<bool>.ErrorResult($"Error leaving room: {ex.Message}");
        }
    }

    #endregion

    #region Message Management

    public async Task<ApiResponse<ChatMessageResponse>> SendMessageAsync(SendMessageRequest request, int userId)
    {
        try
        {
            // 채팅방 멤버 확인
            var isMember = await _context.ChatRoomMembers
                .AnyAsync(m => m.RoomId == request.RoomId && m.UserId == userId && m.IsActive);

            if (!isMember)
            {
                return ApiResponse<ChatMessageResponse>.ErrorResult("Not a member of this room");
            }

            var message = new ChatMessage
            {
                RoomId = request.RoomId,
                UserId = userId,
                Content = request.Content,
                MessageType = request.MessageType,
                FileUrl = request.FileUrl,
                FileName = request.FileName,
                FileSize = request.FileSize,
                MimeType = request.MimeType,
                ReplyToId = request.ReplyToId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            // 채팅방 업데이트 시간 갱신
            var room = await _context.ChatRooms.FindAsync(request.RoomId);
            if (room != null)
            {
                room.UpdatedAt = DateTime.UtcNow;
                _context.ChatRooms.Update(room);
                await _context.SaveChangesAsync();
            }

            // 캐시 무효화
            await _cacheService.RemoveAsync($"room:{request.RoomId}:*");
            await _cacheService.RemoveAsync($"user:{userId}:rooms");

            var messageResponse = await GetChatMessageResponseAsync(message.Id);
            return ApiResponse<ChatMessageResponse>.SuccessResult(messageResponse, "Message sent successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message to room {RoomId}", request.RoomId);
            return ApiResponse<ChatMessageResponse>.ErrorResult($"Error sending message: {ex.Message}");
        }
    }

    public async Task<ApiResponse<ChatMessageResponse>> GetMessageByIdAsync(int messageId)
    {
        try
        {
            var message = await _context.ChatMessages
                .Include(m => m.User)
                .Include(m => m.Reactions)
                .ThenInclude(r => r.User)
                .Include(m => m.ReplyTo)
                .ThenInclude(r => r.User)
                .FirstOrDefaultAsync(m => m.Id == messageId && !m.IsDeleted);

            if (message == null)
            {
                return ApiResponse<ChatMessageResponse>.ErrorResult("Message not found");
            }

            var messageResponse = await GetChatMessageResponseAsync(message.Id);
            return ApiResponse<ChatMessageResponse>.SuccessResult(messageResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving message {MessageId}", messageId);
            return ApiResponse<ChatMessageResponse>.ErrorResult($"Error retrieving message: {ex.Message}");
        }
    }

    public async Task<ApiResponse<GetMessagesResponse>> GetMessagesAsync(GetMessagesRequest request, int? userId = null)
    {
        try
        {
            var query = _context.ChatMessages
                .Include(m => m.User)
                .Include(m => m.Reactions)
                .ThenInclude(r => r.User)
                .Include(m => m.ReplyTo)
                .ThenInclude(r => r.User)
                .Where(m => m.RoomId == request.RoomId && !m.IsDeleted);

            // 날짜 필터
            if (request.Before.HasValue)
                query = query.Where(m => m.CreatedAt < request.Before.Value);

            if (request.After.HasValue)
                query = query.Where(m => m.CreatedAt > request.After.Value);

            // 메시지 타입 필터
            if (!string.IsNullOrEmpty(request.MessageType))
                query = query.Where(m => m.MessageType == request.MessageType);

            var totalCount = await query.CountAsync();

            var messages = await query
                .OrderByDescending(m => m.CreatedAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var messageResponses = new List<ChatMessageResponse>();
            foreach (var message in messages)
            {
                var messageResponse = await GetChatMessageResponseAsync(message.Id);
                messageResponses.Add(messageResponse);
            }

            var response = new GetMessagesResponse
            {
                Messages = messageResponses,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / request.PageSize),
                HasMore = request.Page < (int)Math.Ceiling((double)totalCount / request.PageSize)
            };

            return ApiResponse<GetMessagesResponse>.SuccessResult(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving messages for room {RoomId}", request.RoomId);
            return ApiResponse<GetMessagesResponse>.ErrorResult($"Error retrieving messages: {ex.Message}");
        }
    }

    #endregion

    #region User Status Management

    public async Task<ApiResponse<bool>> UpdateUserOnlineStatusAsync(int userId, string status, string? customStatus = null)
    {
        try
        {
            var userStatus = await _context.UserOnlineStatuses
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (userStatus == null)
            {
                userStatus = new UserOnlineStatus
                {
                    UserId = userId,
                    Status = status,
                    CustomStatus = customStatus,
                    LastSeenAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.UserOnlineStatuses.Add(userStatus);
            }
            else
            {
                userStatus.Status = status;
                userStatus.CustomStatus = customStatus;
                userStatus.UpdatedAt = DateTime.UtcNow;
                if (status == "offline")
                {
                    userStatus.LastSeenAt = DateTime.UtcNow;
                }
                _context.UserOnlineStatuses.Update(userStatus);
            }

            await _context.SaveChangesAsync();

            // 캐시 무효화
            await _cacheService.RemoveAsync($"user:{userId}:status");
            await _cacheService.RemoveAsync("online_users");

            return ApiResponse<bool>.SuccessResult(true, "Status updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating status for user {UserId}", userId);
            return ApiResponse<bool>.ErrorResult($"Error updating status: {ex.Message}");
        }
    }

    #endregion

    #region Helper Methods

    private async Task<ChatRoomResponse> GetChatRoomResponseAsync(int roomId, int? userId)
    {
        var room = await _context.ChatRooms
            .Include(r => r.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(r => r.Id == roomId);

        if (room == null) return null;

        var lastMessage = await _context.ChatMessages
            .Include(m => m.User)
            .Where(m => m.RoomId == roomId && !m.IsDeleted)
            .OrderByDescending(m => m.CreatedAt)
            .FirstOrDefaultAsync();

        var unreadCount = 0;
        if (userId.HasValue)
        {
            var lastReadAt = await _context.ChatRoomMembers
                .Where(m => m.RoomId == roomId && m.UserId == userId.Value)
                .Select(m => m.LastReadAt)
                .FirstOrDefaultAsync();

            if (lastReadAt.HasValue)
            {
                unreadCount = await _context.ChatMessages
                    .CountAsync(m => m.RoomId == roomId && m.CreatedAt > lastReadAt.Value && !m.IsDeleted);
            }
        }

        return new ChatRoomResponse
        {
            Id = room.Id,
            Name = room.Name,
            Description = room.Description,
            Type = room.Type,
            Color = room.Color,
            AvatarUrl = room.AvatarUrl,
            CreatedBy = room.CreatedBy,
            CreatedByName = room.Members.FirstOrDefault(m => m.UserId == room.CreatedBy)?.User?.Username ?? "Unknown",
            IsActive = room.IsActive,
            MaxMembers = room.MaxMembers,
            MemberCount = room.Members.Count(m => m.IsActive),
            UnreadCount = unreadCount,
            CreatedAt = room.CreatedAt,
            UpdatedAt = room.UpdatedAt,
            LastMessageAt = lastMessage?.CreatedAt,
            LastMessage = lastMessage != null ? await GetChatMessageResponseAsync(lastMessage.Id) : null,
            Members = room.Members.Where(m => m.IsActive).Select(m => new ChatRoomMemberResponse
            {
                Id = m.Id,
                RoomId = m.RoomId,
                UserId = m.UserId,
                UserName = m.User?.Username ?? "Unknown",
                UserAvatar = m.User?.AvatarUrl,
                Role = m.Role,
                IsActive = m.IsActive,
                JoinedAt = m.JoinedAt,
                LastReadAt = m.LastReadAt,
                IsOnline = false, // TODO: 실제 온라인 상태 확인
                OnlineStatus = "offline"
            }).ToList()
        };
    }

    private async Task<ChatMessageResponse> GetChatMessageResponseAsync(int messageId)
    {
        var message = await _context.ChatMessages
            .Include(m => m.User)
            .Include(m => m.Reactions)
            .ThenInclude(r => r.User)
            .Include(m => m.ReplyTo)
            .ThenInclude(r => r.User)
            .FirstOrDefaultAsync(m => m.Id == messageId);

        if (message == null) return null;

        var replies = new List<ChatMessageResponse>();
        foreach (var reply in message.Replies.Where(r => !r.IsDeleted))
        {
            var replyResponse = await GetChatMessageResponseAsync(reply.Id);
            if (replyResponse != null)
                replies.Add(replyResponse);
        }

        return new ChatMessageResponse
        {
            Id = message.Id,
            RoomId = message.RoomId,
            UserId = message.UserId,
            UserName = message.User?.Username ?? "Unknown",
            UserAvatar = message.User?.AvatarUrl,
            Content = message.Content,
            MessageType = message.MessageType,
            FileUrl = message.FileUrl,
            FileName = message.FileName,
            FileSize = message.FileSize,
            MimeType = message.MimeType,
            ReplyToId = message.ReplyToId,
            ReplyTo = message.ReplyTo != null ? await GetChatMessageResponseAsync(message.ReplyTo.Id) : null,
            IsEdited = message.IsEdited,
            IsDeleted = message.IsDeleted,
            ReactionCount = message.ReactionCount,
            CreatedAt = message.CreatedAt,
            UpdatedAt = message.UpdatedAt,
            Reactions = message.Reactions.Select(r => new ChatReactionResponse
            {
                Id = r.Id,
                MessageId = r.MessageId,
                UserId = r.UserId,
                UserName = r.User?.Username ?? "Unknown",
                Emoji = r.Emoji,
                CreatedAt = r.CreatedAt
            }).ToList(),
            Replies = replies
        };
    }

    #endregion

    #region Not Implemented Methods

    public Task<ApiResponse<ChatRoomResponse>> UpdateRoomAsync(int roomId, UpdateChatRoomRequest request, int userId)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<bool>> DeleteRoomAsync(int roomId, int userId)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<SearchRoomsResponse>> SearchRoomsAsync(SearchRoomsRequest request, int? userId = null)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<List<ChatRoomMemberResponse>>> GetRoomMembersAsync(int roomId, int? userId = null)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<ChatMessageResponse>> EditMessageAsync(int messageId, EditMessageRequest request, int userId)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<ChatMessageResponse>> DeleteMessageAsync(int messageId, int userId)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<ChatReactionResponse>> AddReactionAsync(AddReactionRequest request, int userId)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<bool>> RemoveReactionAsync(int messageId, string emoji, int userId)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<List<UserOnlineStatusResponse>>> GetOnlineUsersAsync()
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<UserOnlineStatusResponse>> GetUserStatusAsync(int userId)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<bool>> MarkMessagesAsReadAsync(int roomId, int userId)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<int>> GetUnreadCountAsync(int roomId, int userId)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<object>> GetChatStatsAsync()
    {
        throw new NotImplementedException();
    }

    #endregion
}
