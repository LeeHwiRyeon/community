using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Text.Json;
using System.Data.SQLite;
using System.Text;

namespace AutoAgent.Worker.Services
{
    public class NotificationService
    {
        private readonly ILogger<NotificationService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly string _connectionString;
        private readonly List<INotificationChannel> _channels;

        public NotificationService(ILogger<NotificationService> logger, IConfiguration configuration, HttpClient httpClient)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClient;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ?? "Data Source=notifications.db";
            _channels = new List<INotificationChannel>
            {
                new EmailNotificationChannel(_logger, _configuration),
                new WebPushNotificationChannel(_logger, _configuration),
                new SlackNotificationChannel(_logger, _configuration),
                new DiscordNotificationChannel(_logger, _configuration)
            };
        }

        /// <summary>
        /// 알림 전송
        /// </summary>
        public async Task<NotificationResult> SendNotificationAsync(NotificationRequest request)
        {
            try
            {
                _logger.LogInformation($"알림 전송 시작: {request.Type} - {request.Title}");

                // 알림 규칙 검증
                if (!await ValidateNotificationRulesAsync(request))
                {
                    return new NotificationResult
                    {
                        Success = false,
                        Message = "알림 규칙 검증 실패",
                        Timestamp = DateTime.UtcNow
                    };
                }

                // 템플릿 적용
                var processedRequest = await ProcessNotificationTemplateAsync(request);

                // 큐에 추가
                await AddToQueueAsync(processedRequest);

                // 채널별 전송
                var results = new List<ChannelResult>();
                foreach (var channel in _channels.Where(c => request.Channels.Contains(c.ChannelType)))
                {
                    try
                    {
                        var result = await channel.SendAsync(processedRequest);
                        results.Add(result);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"채널 {channel.ChannelType} 전송 실패");
                        results.Add(new ChannelResult
                        {
                            ChannelType = channel.ChannelType,
                            Success = false,
                            Message = ex.Message
                        });
                    }
                }

                // 결과 저장
                var notificationResult = new NotificationResult
                {
                    Success = results.Any(r => r.Success),
                    Message = results.Any(r => r.Success) ? "알림 전송 완료" : "모든 채널 전송 실패",
                    ChannelResults = results,
                    Timestamp = DateTime.UtcNow
                };

                await SaveNotificationResultAsync(processedRequest, notificationResult);

                _logger.LogInformation($"알림 전송 완료: {notificationResult.Success}");
                return notificationResult;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "알림 전송 중 오류 발생");
                return new NotificationResult
                {
                    Success = false,
                    Message = $"알림 전송 실패: {ex.Message}",
                    Timestamp = DateTime.UtcNow
                };
            }
        }

        /// <summary>
        /// 배치 알림 전송
        /// </summary>
        public async Task<BatchNotificationResult> SendBatchNotificationsAsync(List<NotificationRequest> requests)
        {
            try
            {
                _logger.LogInformation($"배치 알림 전송 시작: {requests.Count}개");

                var results = new List<NotificationResult>();
                var successCount = 0;
                var failureCount = 0;

                foreach (var request in requests)
                {
                    try
                    {
                        var result = await SendNotificationAsync(request);
                        results.Add(result);

                        if (result.Success)
                            successCount++;
                        else
                            failureCount++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"배치 알림 전송 중 오류: {request.Title}");
                        failureCount++;
                        results.Add(new NotificationResult
                        {
                            Success = false,
                            Message = ex.Message,
                            Timestamp = DateTime.UtcNow
                        });
                    }
                }

                var batchResult = new BatchNotificationResult
                {
                    TotalCount = requests.Count,
                    SuccessCount = successCount,
                    FailureCount = failureCount,
                    Results = results,
                    Timestamp = DateTime.UtcNow
                };

                _logger.LogInformation($"배치 알림 전송 완료: {successCount}개 성공, {failureCount}개 실패");
                return batchResult;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "배치 알림 전송 중 오류 발생");
                throw;
            }
        }

        /// <summary>
        /// 시스템 상태 알림
        /// </summary>
        public async Task SendSystemStatusNotificationAsync(SystemStatus status)
        {
            var request = new NotificationRequest
            {
                Type = NotificationType.System,
                Priority = status.IsHealthy ? NotificationPriority.Info : NotificationPriority.Critical,
                Title = $"시스템 상태 알림 - {status.ServiceName}",
                Message = status.IsHealthy ?
                    $"✅ {status.ServiceName}이 정상적으로 작동 중입니다." :
                    $"❌ {status.ServiceName}에 문제가 발생했습니다: {status.Message}",
                Channels = new[] { NotificationChannelType.Email, NotificationChannelType.Slack },
                Recipients = GetSystemAdmins(),
                Data = new Dictionary<string, object>
                {
                    ["service"] = status.ServiceName,
                    ["status"] = status.IsHealthy ? "healthy" : "unhealthy",
                    ["timestamp"] = status.Timestamp,
                    ["details"] = status.Details
                }
            };

            await SendNotificationAsync(request);
        }

        /// <summary>
        /// 분석 결과 알림
        /// </summary>
        public async Task SendAnalysisNotificationAsync(AnalysisResult analysis)
        {
            var request = new NotificationRequest
            {
                Type = NotificationType.Analytics,
                Priority = GetAnalysisPriority(analysis),
                Title = $"분석 결과 알림 - {analysis.AnalysisType}",
                Message = GenerateAnalysisMessage(analysis),
                Channels = new[] { NotificationChannelType.Email, NotificationChannelType.WebPush },
                Recipients = GetAnalysisRecipients(analysis),
                Data = new Dictionary<string, object>
                {
                    ["analysisType"] = analysis.AnalysisType,
                    ["timestamp"] = analysis.Timestamp,
                    ["summary"] = analysis.Summary,
                    ["insights"] = analysis.Insights
                }
            };

            await SendNotificationAsync(request);
        }

        /// <summary>
        /// 사용자 활동 알림
        /// </summary>
        public async Task SendUserActivityNotificationAsync(UserActivity activity)
        {
            var request = new NotificationRequest
            {
                Type = NotificationType.User,
                Priority = NotificationPriority.Medium,
                Title = "새로운 활동 알림",
                Message = GenerateUserActivityMessage(activity),
                Channels = new[] { NotificationChannelType.WebPush, NotificationChannelType.Email },
                Recipients = new[] { activity.UserId.ToString() },
                Data = new Dictionary<string, object>
                {
                    ["userId"] = activity.UserId,
                    ["activityType"] = activity.Type,
                    ["timestamp"] = activity.Timestamp,
                    ["details"] = activity.Details
                }
            };

            await SendNotificationAsync(request);
        }

        /// <summary>
        /// 예약된 알림 처리
        /// </summary>
        public async Task ProcessScheduledNotificationsAsync()
        {
            try
            {
                _logger.LogInformation("예약된 알림 처리 시작");

                var scheduledNotifications = await GetScheduledNotificationsAsync();

                foreach (var notification in scheduledNotifications)
                {
                    if (notification.ScheduledTime <= DateTime.UtcNow)
                    {
                        await SendNotificationAsync(notification);
                        await MarkNotificationAsProcessedAsync(notification.Id);
                    }
                }

                _logger.LogInformation($"예약된 알림 처리 완료: {scheduledNotifications.Count}개");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "예약된 알림 처리 중 오류 발생");
            }
        }

        #region Private Helper Methods

        private async Task<bool> ValidateNotificationRulesAsync(NotificationRequest request)
        {
            // 스로틀링 검사
            if (await IsThrottledAsync(request))
            {
                _logger.LogWarning($"알림 스로틀링: {request.Type} - {request.Title}");
                return false;
            }

            // 사용자 알림 설정 검사
            if (request.Type == NotificationType.User)
            {
                foreach (var recipient in request.Recipients)
                {
                    if (!await IsNotificationEnabledAsync(recipient, request.Type))
                    {
                        _logger.LogWarning($"사용자 알림 비활성화: {recipient} - {request.Type}");
                        return false;
                    }
                }
            }

            return true;
        }

        private async Task<NotificationRequest> ProcessNotificationTemplateAsync(NotificationRequest request)
        {
            var template = await GetNotificationTemplateAsync(request.Type);
            if (template == null)
                return request;

            var processedRequest = new NotificationRequest
            {
                Type = request.Type,
                Priority = request.Priority,
                Title = ProcessTemplate(template.Title, request.Data),
                Message = ProcessTemplate(template.Message, request.Data),
                Channels = request.Channels,
                Recipients = request.Recipients,
                Data = request.Data
            };

            return processedRequest;
        }

        private string ProcessTemplate(string template, Dictionary<string, object> data)
        {
            if (string.IsNullOrEmpty(template))
                return template;

            var processed = template;
            foreach (var kvp in data)
            {
                processed = processed.Replace($"{{{kvp.Key}}}", kvp.Value?.ToString() ?? "");
            }

            return processed;
        }

        private async Task AddToQueueAsync(NotificationRequest request)
        {
            using var connection = new SQLiteConnection(_connectionString);
            await connection.OpenAsync();

            var command = new SQLiteCommand(@"
                INSERT INTO notification_queue (type, priority, title, message, channels, recipients, data, created_at) 
                VALUES (@type, @priority, @title, @message, @channels, @recipients, @data, @created_at)", connection);

            command.Parameters.AddWithValue("@type", request.Type.ToString());
            command.Parameters.AddWithValue("@priority", (int)request.Priority);
            command.Parameters.AddWithValue("@title", request.Title);
            command.Parameters.AddWithValue("@message", request.Message);
            command.Parameters.AddWithValue("@channels", JsonSerializer.Serialize(request.Channels));
            command.Parameters.AddWithValue("@recipients", JsonSerializer.Serialize(request.Recipients));
            command.Parameters.AddWithValue("@data", JsonSerializer.Serialize(request.Data));
            command.Parameters.AddWithValue("@created_at", DateTime.UtcNow);

            await command.ExecuteNonQueryAsync();
        }

        private async Task<bool> IsThrottledAsync(NotificationRequest request)
        {
            using var connection = new SQLiteConnection(_connectionString);
            await connection.OpenAsync();

            var command = new SQLiteCommand(@"
                SELECT COUNT(*) FROM notification_history 
                WHERE type = @type AND created_at > @time_threshold", connection);

            command.Parameters.AddWithValue("@type", request.Type.ToString());
            command.Parameters.AddWithValue("@time_threshold", DateTime.UtcNow.AddMinutes(-GetThrottleMinutes(request.Type)));

            var count = Convert.ToInt32(await command.ExecuteScalarAsync());
            return count >= GetMaxNotificationsPerPeriod(request.Type);
        }

        private async Task<bool> IsNotificationEnabledAsync(string recipient, NotificationType type)
        {
            using var connection = new SQLiteConnection(_connectionString);
            await connection.OpenAsync();

            var command = new SQLiteCommand(@"
                SELECT enabled FROM user_notification_settings 
                WHERE user_id = @user_id AND notification_type = @type", connection);

            command.Parameters.AddWithValue("@user_id", recipient);
            command.Parameters.AddWithValue("@type", type.ToString());

            var result = await command.ExecuteScalarAsync();
            return result != null && Convert.ToBoolean(result);
        }

        private async Task<NotificationTemplate> GetNotificationTemplateAsync(NotificationType type)
        {
            using var connection = new SQLiteConnection(_connectionString);
            await connection.OpenAsync();

            var command = new SQLiteCommand(@"
                SELECT title_template, message_template FROM notification_templates 
                WHERE notification_type = @type", connection);

            command.Parameters.AddWithValue("@type", type.ToString());

            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new NotificationTemplate
                {
                    Title = reader.GetString("title_template"),
                    Message = reader.GetString("message_template")
                };
            }

            return null;
        }

        private async Task<List<NotificationRequest>> GetScheduledNotificationsAsync()
        {
            var notifications = new List<NotificationRequest>();

            using var connection = new SQLiteConnection(_connectionString);
            await connection.OpenAsync();

            var command = new SQLiteCommand(@"
                SELECT * FROM scheduled_notifications 
                WHERE scheduled_time <= @now AND processed = 0", connection);

            command.Parameters.AddWithValue("@now", DateTime.UtcNow);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                notifications.Add(new NotificationRequest
                {
                    Type = Enum.Parse<NotificationType>(reader.GetString("type")),
                    Priority = (NotificationPriority)reader.GetInt32("priority"),
                    Title = reader.GetString("title"),
                    Message = reader.GetString("message"),
                    Channels = JsonSerializer.Deserialize<NotificationChannelType[]>(reader.GetString("channels")),
                    Recipients = JsonSerializer.Deserialize<string[]>(reader.GetString("recipients")),
                    Data = JsonSerializer.Deserialize<Dictionary<string, object>>(reader.GetString("data"))
                });
            }

            return notifications;
        }

        private async Task MarkNotificationAsProcessedAsync(int notificationId)
        {
            using var connection = new SQLiteConnection(_connectionString);
            await connection.OpenAsync();

            var command = new SQLiteCommand(@"
                UPDATE scheduled_notifications 
                SET processed = 1, processed_at = @processed_at 
                WHERE id = @id", connection);

            command.Parameters.AddWithValue("@id", notificationId);
            command.Parameters.AddWithValue("@processed_at", DateTime.UtcNow);

            await command.ExecuteNonQueryAsync();
        }

        private async Task SaveNotificationResultAsync(NotificationRequest request, NotificationResult result)
        {
            using var connection = new SQLiteConnection(_connectionString);
            await connection.OpenAsync();

            var command = new SQLiteCommand(@"
                INSERT INTO notification_history (type, priority, title, message, success, channel_results, created_at) 
                VALUES (@type, @priority, @title, @message, @success, @channel_results, @created_at)", connection);

            command.Parameters.AddWithValue("@type", request.Type.ToString());
            command.Parameters.AddWithValue("@priority", (int)request.Priority);
            command.Parameters.AddWithValue("@title", request.Title);
            command.Parameters.AddWithValue("@message", request.Message);
            command.Parameters.AddWithValue("@success", result.Success);
            command.Parameters.AddWithValue("@channel_results", JsonSerializer.Serialize(result.ChannelResults));
            command.Parameters.AddWithValue("@created_at", DateTime.UtcNow);

            await command.ExecuteNonQueryAsync();
        }

        private string[] GetSystemAdmins()
        {
            return _configuration.GetSection("NotificationSettings:SystemAdmins").Get<string[]>() ?? new[] { "admin@example.com" };
        }

        private string[] GetAnalysisRecipients(AnalysisResult analysis)
        {
            return analysis.Priority == AnalysisPriority.Critical ?
                GetSystemAdmins() :
                new[] { "analyst@example.com" };
        }

        private NotificationPriority GetAnalysisPriority(AnalysisResult analysis)
        {
            return analysis.Priority switch
            {
                AnalysisPriority.Critical => NotificationPriority.Critical,
                AnalysisPriority.High => NotificationPriority.High,
                AnalysisPriority.Medium => NotificationPriority.Medium,
                AnalysisPriority.Low => NotificationPriority.Low,
                _ => NotificationPriority.Medium
            };
        }

        private string GenerateAnalysisMessage(AnalysisResult analysis)
        {
            var emoji = analysis.Priority switch
            {
                AnalysisPriority.Critical => "🚨",
                AnalysisPriority.High => "⚠️",
                AnalysisPriority.Medium => "📊",
                AnalysisPriority.Low => "ℹ️",
                _ => "📊"
            };

            return $"{emoji} {analysis.AnalysisType} 분석이 완료되었습니다.\n\n{analysis.Summary}";
        }

        private string GenerateUserActivityMessage(UserActivity activity)
        {
            return activity.Type switch
            {
                "new_post" => "새로운 게시글이 작성되었습니다.",
                "new_comment" => "새로운 댓글이 작성되었습니다.",
                "like_received" => "게시글에 좋아요를 받았습니다.",
                "mention" => "게시글에서 언급되었습니다.",
                _ => "새로운 활동이 있습니다."
            };
        }

        private int GetThrottleMinutes(NotificationType type)
        {
            return type switch
            {
                NotificationType.System => 5,
                NotificationType.Analytics => 30,
                NotificationType.User => 1,
                _ => 10
            };
        }

        private int GetMaxNotificationsPerPeriod(NotificationType type)
        {
            return type switch
            {
                NotificationType.System => 10,
                NotificationType.Analytics => 5,
                NotificationType.User => 20,
                _ => 10
            };
        }

        #endregion
    }

    #region Data Models

    public class NotificationRequest
    {
        public NotificationType Type { get; set; }
        public NotificationPriority Priority { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public NotificationChannelType[] Channels { get; set; } = Array.Empty<NotificationChannelType>();
        public string[] Recipients { get; set; } = Array.Empty<string>();
        public Dictionary<string, object> Data { get; set; } = new();
        public DateTime? ScheduledTime { get; set; }
    }

    public class NotificationResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<ChannelResult> ChannelResults { get; set; } = new();
        public DateTime Timestamp { get; set; }
    }

    public class BatchNotificationResult
    {
        public int TotalCount { get; set; }
        public int SuccessCount { get; set; }
        public int FailureCount { get; set; }
        public List<NotificationResult> Results { get; set; } = new();
        public DateTime Timestamp { get; set; }
    }

    public class ChannelResult
    {
        public NotificationChannelType ChannelType { get; set; }
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string ExternalId { get; set; } = string.Empty;
    }

    public class NotificationTemplate
    {
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    public class SystemStatus
    {
        public string ServiceName { get; set; } = string.Empty;
        public bool IsHealthy { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public Dictionary<string, object> Details { get; set; } = new();
    }

    public class AnalysisResult
    {
        public string AnalysisType { get; set; } = string.Empty;
        public AnalysisPriority Priority { get; set; }
        public string Summary { get; set; } = string.Empty;
        public List<string> Insights { get; set; } = new();
        public DateTime Timestamp { get; set; }
    }

    public class UserActivity
    {
        public int UserId { get; set; }
        public string Type { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public Dictionary<string, object> Details { get; set; } = new();
    }

    public enum NotificationType
    {
        System,
        Analytics,
        User,
        Admin
    }

    public enum NotificationPriority
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4
    }

    public enum NotificationChannelType
    {
        Email,
        WebPush,
        SMS,
        Slack,
        Discord,
        Teams
    }

    public enum AnalysisPriority
    {
        Low,
        Medium,
        High,
        Critical
    }

    #endregion

    #region Notification Channels

    public interface INotificationChannel
    {
        NotificationChannelType ChannelType { get; }
        Task<ChannelResult> SendAsync(NotificationRequest request);
    }

    public class EmailNotificationChannel : INotificationChannel
    {
        private readonly ILogger _logger;
        private readonly IConfiguration _configuration;

        public NotificationChannelType ChannelType => NotificationChannelType.Email;

        public EmailNotificationChannel(ILogger logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<ChannelResult> SendAsync(NotificationRequest request)
        {
            try
            {
                _logger.LogInformation($"이메일 알림 전송: {request.Title}");

                // 실제 이메일 전송 로직 구현
                // SMTP 서버 설정, 템플릿 적용 등

                return new ChannelResult
                {
                    ChannelType = ChannelType,
                    Success = true,
                    Message = "이메일 전송 완료",
                    ExternalId = Guid.NewGuid().ToString()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "이메일 전송 실패");
                return new ChannelResult
                {
                    ChannelType = ChannelType,
                    Success = false,
                    Message = ex.Message
                };
            }
        }
    }

    public class WebPushNotificationChannel : INotificationChannel
    {
        private readonly ILogger _logger;
        private readonly IConfiguration _configuration;

        public NotificationChannelType ChannelType => NotificationChannelType.WebPush;

        public WebPushNotificationChannel(ILogger logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<ChannelResult> SendAsync(NotificationRequest request)
        {
            try
            {
                _logger.LogInformation($"웹푸시 알림 전송: {request.Title}");

                // 웹푸시 전송 로직 구현
                // FCM, VAPID 키 등 사용

                return new ChannelResult
                {
                    ChannelType = ChannelType,
                    Success = true,
                    Message = "웹푸시 전송 완료",
                    ExternalId = Guid.NewGuid().ToString()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "웹푸시 전송 실패");
                return new ChannelResult
                {
                    ChannelType = ChannelType,
                    Success = false,
                    Message = ex.Message
                };
            }
        }
    }

    public class SlackNotificationChannel : INotificationChannel
    {
        private readonly ILogger _logger;
        private readonly IConfiguration _configuration;

        public NotificationChannelType ChannelType => NotificationChannelType.Slack;

        public SlackNotificationChannel(ILogger logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<ChannelResult> SendAsync(NotificationRequest request)
        {
            try
            {
                _logger.LogInformation($"슬랙 알림 전송: {request.Title}");

                // 슬랙 웹훅 전송 로직 구현

                return new ChannelResult
                {
                    ChannelType = ChannelType,
                    Success = true,
                    Message = "슬랙 전송 완료",
                    ExternalId = Guid.NewGuid().ToString()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "슬랙 전송 실패");
                return new ChannelResult
                {
                    ChannelType = ChannelType,
                    Success = false,
                    Message = ex.Message
                };
            }
        }
    }

    public class DiscordNotificationChannel : INotificationChannel
    {
        private readonly ILogger _logger;
        private readonly IConfiguration _configuration;

        public NotificationChannelType ChannelType => NotificationChannelType.Discord;

        public DiscordNotificationChannel(ILogger logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<ChannelResult> SendAsync(NotificationRequest request)
        {
            try
            {
                _logger.LogInformation($"디스코드 알림 전송: {request.Title}");

                // 디스코드 웹훅 전송 로직 구현

                return new ChannelResult
                {
                    ChannelType = ChannelType,
                    Success = true,
                    Message = "디스코드 전송 완료",
                    ExternalId = Guid.NewGuid().ToString()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "디스코드 전송 실패");
                return new ChannelResult
                {
                    ChannelType = ChannelType,
                    Success = false,
                    Message = ex.Message
                };
            }
        }
    }

    #endregion
}
