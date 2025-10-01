using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Text.Json;
using System.Data.SQLite;

namespace AutoAgent.Worker.Services
{
    public class TodoGeneratorService
    {
        private readonly ILogger<TodoGeneratorService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly string _connectionString;

        public TodoGeneratorService(ILogger<TodoGeneratorService> logger, IConfiguration configuration, HttpClient httpClient)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClient;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ?? "Data Source=todo_generator.db";
        }

        /// <summary>
        /// 자동 TODO 생성 메인 메서드
        /// </summary>
        public async Task<TodoGenerationResult> GenerateTodosAsync()
        {
            try
            {
                _logger.LogInformation("자동 TODO 생성 시작");

                // 1. 현재 시스템 상태 분석
                var systemAnalysis = await AnalyzeSystemStatusAsync();

                // 2. 기존 TODO 분석
                var existingTodos = await GetExistingTodosAsync();

                // 3. 새로운 TODO 생성
                var newTodos = await GenerateNewTodosAsync(systemAnalysis, existingTodos);

                // 4. TODO 우선순위 설정
                var prioritizedTodos = PrioritizeTodos(newTodos);

                // 5. TODO 저장
                var savedTodos = await SaveTodosAsync(prioritizedTodos);

                // 6. 결과 반환
                var result = new TodoGenerationResult
                {
                    Success = true,
                    Message = $"{savedTodos.Count}개의 새로운 TODO가 생성되었습니다.",
                    GeneratedTodos = savedTodos,
                    Timestamp = DateTime.UtcNow
                };

                _logger.LogInformation($"자동 TODO 생성 완료: {savedTodos.Count}개 생성");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "자동 TODO 생성 중 오류 발생");
                return new TodoGenerationResult
                {
                    Success = false,
                    Message = $"TODO 생성 실패: {ex.Message}",
                    Timestamp = DateTime.UtcNow
                };
            }
        }

        /// <summary>
        /// 시스템 상태 분석
        /// </summary>
        private async Task<SystemAnalysis> AnalyzeSystemStatusAsync()
        {
            try
            {
                _logger.LogInformation("시스템 상태 분석 시작");

                // Community Platform 상태 확인
                var healthResponse = await _httpClient.GetAsync("http://localhost:50000/api/health-check");
                var isHealthy = healthResponse.IsSuccessStatusCode;

                // 성능 메트릭 수집
                var performanceResponse = await _httpClient.GetAsync("http://localhost:50000/api/agent/performance");
                var performanceData = performanceResponse.IsSuccessStatusCode ?
                    await performanceResponse.Content.ReadAsStringAsync() : "{}";

                // 분석 결과 수집
                var analyticsResponse = await _httpClient.GetAsync("http://localhost:50000/api/analytics/dashboard");
                var analyticsData = analyticsResponse.IsSuccessStatusCode ?
                    await analyticsResponse.Content.ReadAsStringAsync() : "{}";

                var analysis = new SystemAnalysis
                {
                    IsHealthy = isHealthy,
                    PerformanceMetrics = performanceData,
                    AnalyticsData = analyticsData,
                    Timestamp = DateTime.UtcNow,
                    Issues = IdentifyIssues(isHealthy, performanceData, analyticsData),
                    Opportunities = IdentifyOpportunities(analyticsData),
                    Recommendations = GenerateRecommendations(isHealthy, performanceData, analyticsData)
                };

                _logger.LogInformation($"시스템 상태 분석 완료: {analysis.Issues.Count}개 이슈, {analysis.Opportunities.Count}개 기회 식별");
                return analysis;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "시스템 상태 분석 중 오류, 기본값 사용");
                return new SystemAnalysis
                {
                    IsHealthy = true,
                    Timestamp = DateTime.UtcNow,
                    Issues = new List<string>(),
                    Opportunities = new List<string>(),
                    Recommendations = new List<string>()
                };
            }
        }

        /// <summary>
        /// 기존 TODO 분석
        /// </summary>
        private async Task<List<TodoItem>> GetExistingTodosAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("http://localhost:50000/api/todos");
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<ApiResponse<List<TodoItem>>>(json);
                    return result?.Data ?? new List<TodoItem>();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "기존 TODO 조회 실패, 로컬 데이터 사용");
            }

            return await GetLocalTodosAsync();
        }

        /// <summary>
        /// 새로운 TODO 생성
        /// </summary>
        private async Task<List<TodoItem>> GenerateNewTodosAsync(SystemAnalysis analysis, List<TodoItem> existingTodos)
        {
            var newTodos = new List<TodoItem>();
            var existingCategories = existingTodos.Select(t => t.Category).ToHashSet();

            // 1. 시스템 이슈 기반 TODO 생성
            foreach (var issue in analysis.Issues)
            {
                var todo = CreateTodoFromIssue(issue, existingCategories);
                if (todo != null)
                {
                    newTodos.Add(todo);
                }
            }

            // 2. 기회 기반 TODO 생성
            foreach (var opportunity in analysis.Opportunities)
            {
                var todo = CreateTodoFromOpportunity(opportunity, existingCategories);
                if (todo != null)
                {
                    newTodos.Add(todo);
                }
            }

            // 3. 권장사항 기반 TODO 생성
            foreach (var recommendation in analysis.Recommendations)
            {
                var todo = CreateTodoFromRecommendation(recommendation, existingCategories);
                if (todo != null)
                {
                    newTodos.Add(todo);
                }
            }

            // 4. 정기적인 유지보수 TODO 생성
            var maintenanceTodos = GenerateMaintenanceTodos(existingCategories);
            newTodos.AddRange(maintenanceTodos);

            // 5. 새로운 기능 개발 TODO 생성
            var featureTodos = GenerateFeatureTodos(existingCategories);
            newTodos.AddRange(featureTodos);

            _logger.LogInformation($"새로운 TODO 생성: {newTodos.Count}개");
            return newTodos;
        }

        /// <summary>
        /// TODO 우선순위 설정
        /// </summary>
        private List<TodoItem> PrioritizeTodos(List<TodoItem> todos)
        {
            var priorityOrder = new Dictionary<string, int>
            {
                ["OPTIMIZATION"] = 1,
                ["SECURITY"] = 2,
                ["DEPLOYMENT"] = 3,
                ["USER_EXPERIENCE"] = 4,
                ["ANALYTICS"] = 5,
                ["ADVANCED_FEATURES"] = 6,
                ["INTEGRATION"] = 7
            };

            return todos
                .OrderBy(t => priorityOrder.GetValueOrDefault(t.Category, 999))
                .ThenBy(t => t.Priority)
                .ThenBy(t => t.CreatedAt)
                .ToList();
        }

        /// <summary>
        /// TODO 저장
        /// </summary>
        private async Task<List<TodoItem>> SaveTodosAsync(List<TodoItem> todos)
        {
            var savedTodos = new List<TodoItem>();

            foreach (var todo in todos)
            {
                try
                {
                    // Community Platform에 저장 시도
                    var json = JsonSerializer.Serialize(todo);
                    var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

                    var response = await _httpClient.PostAsync("http://localhost:50000/api/todos", content);

                    if (response.IsSuccessStatusCode)
                    {
                        var responseJson = await response.Content.ReadAsStringAsync();
                        var result = JsonSerializer.Deserialize<ApiResponse<TodoItem>>(responseJson);
                        if (result?.Success == true)
                        {
                            savedTodos.Add(result.Data);
                            _logger.LogInformation($"TODO 저장 성공: {todo.Content}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"TODO 저장 실패: {todo.Content}, 로컬 저장 시도");

                    // 로컬 저장
                    await SaveLocalTodoAsync(todo);
                    savedTodos.Add(todo);
                }
            }

            return savedTodos;
        }

        #region Helper Methods

        private List<string> IdentifyIssues(bool isHealthy, string performanceData, string analyticsData)
        {
            var issues = new List<string>();

            if (!isHealthy)
            {
                issues.Add("시스템 상태 불안정");
            }

            // 성능 이슈 분석 (간단한 시뮬레이션)
            if (performanceData.Contains("high") || performanceData.Contains("slow"))
            {
                issues.Add("성능 저하 감지");
            }

            // 분석 데이터 기반 이슈 식별
            if (analyticsData.Contains("decline") || analyticsData.Contains("low"))
            {
                issues.Add("사용자 참여도 감소");
            }

            return issues;
        }

        private List<string> IdentifyOpportunities(string analyticsData)
        {
            var opportunities = new List<string>();

            // 분석 데이터 기반 기회 식별
            if (analyticsData.Contains("growth") || analyticsData.Contains("increase"))
            {
                opportunities.Add("사용자 성장 기회");
            }

            if (analyticsData.Contains("trend") || analyticsData.Contains("popular"))
            {
                opportunities.Add("새로운 트렌드 활용");
            }

            return opportunities;
        }

        private List<string> GenerateRecommendations(bool isHealthy, string performanceData, string analyticsData)
        {
            var recommendations = new List<string>();

            if (!isHealthy)
            {
                recommendations.Add("시스템 안정성 개선 필요");
            }

            if (performanceData.Contains("slow"))
            {
                recommendations.Add("성능 최적화 권장");
            }

            if (analyticsData.Contains("user"))
            {
                recommendations.Add("사용자 경험 개선 필요");
            }

            return recommendations;
        }

        private TodoItem CreateTodoFromIssue(string issue, HashSet<string> existingCategories)
        {
            return issue switch
            {
                "시스템 상태 불안정" => new TodoItem
                {
                    Id = $"ISSUE_{DateTime.UtcNow.Ticks}",
                    Content = "시스템 안정성 개선 및 모니터링 강화",
                    Category = "OPTIMIZATION",
                    Priority = 1,
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                "성능 저하 감지" => new TodoItem
                {
                    Id = $"PERF_{DateTime.UtcNow.Ticks}",
                    Content = "성능 최적화 및 병목 지점 해결",
                    Category = "OPTIMIZATION",
                    Priority = 1,
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                "사용자 참여도 감소" => new TodoItem
                {
                    Id = $"ENGAGE_{DateTime.UtcNow.Ticks}",
                    Content = "사용자 참여도 향상을 위한 전략 수립",
                    Category = "USER_EXPERIENCE",
                    Priority = 2,
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                _ => null
            };
        }

        private TodoItem CreateTodoFromOpportunity(string opportunity, HashSet<string> existingCategories)
        {
            return opportunity switch
            {
                "사용자 성장 기회" => new TodoItem
                {
                    Id = $"GROWTH_{DateTime.UtcNow.Ticks}",
                    Content = "사용자 성장을 위한 마케팅 전략 수립",
                    Category = "USER_EXPERIENCE",
                    Priority = 3,
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                "새로운 트렌드 활용" => new TodoItem
                {
                    Id = $"TREND_{DateTime.UtcNow.Ticks}",
                    Content = "새로운 트렌드를 활용한 기능 개발",
                    Category = "ADVANCED_FEATURES",
                    Priority = 4,
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                _ => null
            };
        }

        private TodoItem CreateTodoFromRecommendation(string recommendation, HashSet<string> existingCategories)
        {
            return recommendation switch
            {
                "시스템 안정성 개선 필요" => new TodoItem
                {
                    Id = $"STABILITY_{DateTime.UtcNow.Ticks}",
                    Content = "시스템 안정성 개선 및 장애 대응 체계 구축",
                    Category = "OPTIMIZATION",
                    Priority = 1,
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                "성능 최적화 권장" => new TodoItem
                {
                    Id = $"PERF_OPT_{DateTime.UtcNow.Ticks}",
                    Content = "데이터베이스 및 API 성능 최적화",
                    Category = "OPTIMIZATION",
                    Priority = 2,
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                "사용자 경험 개선 필요" => new TodoItem
                {
                    Id = $"UX_{DateTime.UtcNow.Ticks}",
                    Content = "사용자 인터페이스 및 경험 개선",
                    Category = "USER_EXPERIENCE",
                    Priority = 3,
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                _ => null
            };
        }

        private List<TodoItem> GenerateMaintenanceTodos(HashSet<string> existingCategories)
        {
            var todos = new List<TodoItem>();

            // 정기적인 유지보수 TODO들
            if (!existingCategories.Contains("OPTIMIZATION"))
            {
                todos.Add(new TodoItem
                {
                    Id = $"MAINT_{DateTime.UtcNow.Ticks}",
                    Content = "정기적인 시스템 유지보수 및 최적화",
                    Category = "OPTIMIZATION",
                    Priority = 5,
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            if (!existingCategories.Contains("SECURITY"))
            {
                todos.Add(new TodoItem
                {
                    Id = $"SEC_{DateTime.UtcNow.Ticks}",
                    Content = "보안 점검 및 취약점 분석",
                    Category = "SECURITY",
                    Priority = 2,
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            return todos;
        }

        private List<TodoItem> GenerateFeatureTodos(HashSet<string> existingCategories)
        {
            var todos = new List<TodoItem>();

            // 새로운 기능 개발 TODO들
            var features = new[]
            {
                ("AI 기반 추천 시스템", "ADVANCED_FEATURES", 4),
                ("실시간 협업 도구", "ADVANCED_FEATURES", 5),
                ("고급 검색 시스템", "ADVANCED_FEATURES", 6),
                ("모바일 앱 개발", "USER_EXPERIENCE", 7),
                ("다국어 지원", "USER_EXPERIENCE", 8),
                ("API 문서화", "INTEGRATION", 9)
            };

            foreach (var (content, category, priority) in features)
            {
                if (!existingCategories.Contains(category))
                {
                    todos.Add(new TodoItem
                    {
                        Id = $"FEATURE_{DateTime.UtcNow.Ticks}",
                        Content = content,
                        Category = category,
                        Priority = priority,
                        Status = "pending",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }

            return todos;
        }

        private async Task<List<TodoItem>> GetLocalTodosAsync()
        {
            var todos = new List<TodoItem>();

            using var connection = new SQLiteConnection(_connectionString);
            await connection.OpenAsync();

            var command = new SQLiteCommand("SELECT * FROM todos ORDER BY created_at", connection);
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                todos.Add(new TodoItem
                {
                    Id = reader.GetString("id"),
                    Content = reader.GetString("content"),
                    Status = reader.GetString("status"),
                    Category = reader.GetString("category"),
                    Priority = reader.GetInt32("priority"),
                    CreatedAt = reader.GetDateTime("created_at"),
                    UpdatedAt = reader.GetDateTime("updated_at")
                });
            }

            return todos;
        }

        private async Task SaveLocalTodoAsync(TodoItem todo)
        {
            using var connection = new SQLiteConnection(_connectionString);
            await connection.OpenAsync();

            var command = new SQLiteCommand(@"
                INSERT OR REPLACE INTO todos (id, content, status, category, priority, created_at, updated_at) 
                VALUES (@id, @content, @status, @category, @priority, @created_at, @updated_at)", connection);

            command.Parameters.AddWithValue("@id", todo.Id);
            command.Parameters.AddWithValue("@content", todo.Content);
            command.Parameters.AddWithValue("@status", todo.Status);
            command.Parameters.AddWithValue("@category", todo.Category);
            command.Parameters.AddWithValue("@priority", todo.Priority);
            command.Parameters.AddWithValue("@created_at", todo.CreatedAt);
            command.Parameters.AddWithValue("@updated_at", todo.UpdatedAt);

            await command.ExecuteNonQueryAsync();
        }

        #endregion
    }

    #region Data Models

    public class SystemAnalysis
    {
        public bool IsHealthy { get; set; }
        public string PerformanceMetrics { get; set; } = string.Empty;
        public string AnalyticsData { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public List<string> Issues { get; set; } = new();
        public List<string> Opportunities { get; set; } = new();
        public List<string> Recommendations { get; set; } = new();
    }

    public class TodoGenerationResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<TodoItem> GeneratedTodos { get; set; } = new();
        public DateTime Timestamp { get; set; }
    }

    public class TodoItem
    {
        public string Id { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int Priority { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T Data { get; set; } = default!;
    }

    #endregion
}
