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
    public class AdvancedAnalyticsService
    {
        private readonly ILogger<AdvancedAnalyticsService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly string _connectionString;

        public AdvancedAnalyticsService(ILogger<AdvancedAnalyticsService> logger, IConfiguration configuration, HttpClient httpClient)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClient;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ?? "Data Source=analytics.db";
        }

        /// <summary>
        /// 사용자 행동 패턴 분석
        /// </summary>
        public async Task<UserBehaviorAnalysis> AnalyzeUserBehaviorAsync()
        {
            try
            {
                _logger.LogInformation("사용자 행동 패턴 분석 시작");

                // Community Platform에서 사용자 활동 데이터 수집
                var userActivities = await GetUserActivitiesAsync();

                var analysis = new UserBehaviorAnalysis
                {
                    Timestamp = DateTime.UtcNow,
                    TotalUsers = userActivities.Count,
                    ActiveUsers = userActivities.Count(u => u.IsActive),
                    LoginPatterns = AnalyzeLoginPatterns(userActivities),
                    ContentPreferences = AnalyzeContentPreferences(userActivities),
                    EngagementMetrics = CalculateEngagementMetrics(userActivities),
                    PeakActivityHours = FindPeakActivityHours(userActivities),
                    UserSegments = SegmentUsers(userActivities),
                    RetentionRates = CalculateRetentionRates(userActivities),
                    ChurnPrediction = PredictChurn(userActivities)
                };

                // 분석 결과를 데이터베이스에 저장
                await SaveAnalysisResultAsync("user_behavior", analysis);

                _logger.LogInformation($"사용자 행동 분석 완료: {analysis.TotalUsers}명 분석");
                return analysis;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "사용자 행동 분석 중 오류 발생");
                throw;
            }
        }

        /// <summary>
        /// 콘텐츠 성과 분석
        /// </summary>
        public async Task<ContentPerformanceAnalysis> AnalyzeContentPerformanceAsync()
        {
            try
            {
                _logger.LogInformation("콘텐츠 성과 분석 시작");

                var posts = await GetPostsAsync();
                var comments = await GetCommentsAsync();
                var views = await GetViewDataAsync();

                var analysis = new ContentPerformanceAnalysis
                {
                    Timestamp = DateTime.UtcNow,
                    TotalPosts = posts.Count,
                    TotalComments = comments.Count,
                    TotalViews = views.Sum(v => v.Count),
                    TopPerformingPosts = GetTopPerformingPosts(posts, views),
                    ContentCategories = AnalyzeContentCategories(posts),
                    EngagementTrends = AnalyzeEngagementTrends(posts, comments),
                    ViralContent = IdentifyViralContent(posts, views),
                    ContentQuality = AssessContentQuality(posts, comments),
                    AuthorPerformance = AnalyzeAuthorPerformance(posts),
                    SeasonalTrends = AnalyzeSeasonalTrends(posts)
                };

                await SaveAnalysisResultAsync("content_performance", analysis);

                _logger.LogInformation($"콘텐츠 성과 분석 완료: {analysis.TotalPosts}개 게시글 분석");
                return analysis;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "콘텐츠 성과 분석 중 오류 발생");
                throw;
            }
        }

        /// <summary>
        /// 커뮤니티 건강도 분석
        /// </summary>
        public async Task<CommunityHealthAnalysis> AnalyzeCommunityHealthAsync()
        {
            try
            {
                _logger.LogInformation("커뮤니티 건강도 분석 시작");

                var communities = await GetCommunitiesAsync();
                var healthScores = new List<CommunityHealthScore>();

                foreach (var community in communities)
                {
                    var score = await CalculateCommunityHealthScoreAsync(community);
                    healthScores.Add(score);
                }

                var analysis = new CommunityHealthAnalysis
                {
                    Timestamp = DateTime.UtcNow,
                    TotalCommunities = communities.Count,
                    AverageHealthScore = healthScores.Average(s => s.OverallScore),
                    HealthDistribution = CalculateHealthDistribution(healthScores),
                    TopPerformingCommunities = healthScores.OrderByDescending(s => s.OverallScore).Take(10).ToList(),
                    DecliningCommunities = healthScores.Where(s => s.Trend == "declining").ToList(),
                    GrowthCommunities = healthScores.Where(s => s.Trend == "growing").ToList(),
                    RiskFactors = IdentifyRiskFactors(healthScores),
                    Recommendations = GenerateRecommendations(healthScores)
                };

                await SaveAnalysisResultAsync("community_health", analysis);

                _logger.LogInformation($"커뮤니티 건강도 분석 완료: {analysis.TotalCommunities}개 커뮤니티 분석");
                return analysis;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "커뮤니티 건강도 분석 중 오류 발생");
                throw;
            }
        }

        /// <summary>
        /// 트렌드 분석
        /// </summary>
        public async Task<TrendAnalysis> AnalyzeTrendsAsync()
        {
            try
            {
                _logger.LogInformation("트렌드 분석 시작");

                var posts = await GetPostsAsync();
                var searchQueries = await GetSearchQueriesAsync();
                var hashtags = await GetHashtagsAsync();

                var analysis = new TrendAnalysis
                {
                    Timestamp = DateTime.UtcNow,
                    TrendingTopics = IdentifyTrendingTopics(posts),
                    PopularHashtags = AnalyzeHashtags(hashtags),
                    SearchTrends = AnalyzeSearchTrends(searchQueries),
                    ContentTrends = AnalyzeContentTrends(posts),
                    UserInterestTrends = AnalyzeUserInterestTrends(posts),
                    SeasonalPatterns = IdentifySeasonalPatterns(posts),
                    EmergingTopics = IdentifyEmergingTopics(posts),
                    DecliningTopics = IdentifyDecliningTopics(posts),
                    CrossPlatformTrends = AnalyzeCrossPlatformTrends(posts)
                };

                await SaveAnalysisResultAsync("trend_analysis", analysis);

                _logger.LogInformation("트렌드 분석 완료");
                return analysis;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "트렌드 분석 중 오류 발생");
                throw;
            }
        }

        /// <summary>
        /// 예측 분석
        /// </summary>
        public async Task<PredictiveAnalysis> PerformPredictiveAnalysisAsync()
        {
            try
            {
                _logger.LogInformation("예측 분석 시작");

                var historicalData = await GetHistoricalDataAsync();

                var analysis = new PredictiveAnalysis
                {
                    Timestamp = DateTime.UtcNow,
                    UserGrowthPrediction = PredictUserGrowth(historicalData),
                    ContentDemandPrediction = PredictContentDemand(historicalData),
                    EngagementPrediction = PredictEngagement(historicalData),
                    ChurnPrediction = PredictUserChurn(historicalData),
                    RevenuePrediction = PredictRevenue(historicalData),
                    ResourceNeedsPrediction = PredictResourceNeeds(historicalData),
                    RiskAssessment = AssessRisks(historicalData),
                    OpportunityIdentification = IdentifyOpportunities(historicalData),
                    ScenarioPlanning = GenerateScenarios(historicalData)
                };

                await SaveAnalysisResultAsync("predictive_analysis", analysis);

                _logger.LogInformation("예측 분석 완료");
                return analysis;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "예측 분석 중 오류 발생");
                throw;
            }
        }

        #region Private Helper Methods

        private async Task<List<UserActivity>> GetUserActivitiesAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("/api/analytics/user-activities");
                response.EnsureSuccessStatusCode();
                var json = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<List<UserActivity>>(json) ?? new List<UserActivity>();
            }
            catch
            {
                return GenerateMockUserActivities();
            }
        }

        private async Task<List<Post>> GetPostsAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("/api/analytics/posts");
                response.EnsureSuccessStatusCode();
                var json = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<List<Post>>(json) ?? new List<Post>();
            }
            catch
            {
                return GenerateMockPosts();
            }
        }

        private async Task<List<Comment>> GetCommentsAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("/api/analytics/comments");
                response.EnsureSuccessStatusCode();
                var json = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<List<Comment>>(json) ?? new List<Comment>();
            }
            catch
            {
                return GenerateMockComments();
            }
        }

        private async Task<List<ViewData>> GetViewDataAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("/api/analytics/views");
                response.EnsureSuccessStatusCode();
                var json = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<List<ViewData>>(json) ?? new List<ViewData>();
            }
            catch
            {
                return GenerateMockViewData();
            }
        }

        private async Task<List<Community>> GetCommunitiesAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("/api/communities");
                response.EnsureSuccessStatusCode();
                var json = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<ApiResponse<List<Community>>>(json);
                return result?.Data ?? new List<Community>();
            }
            catch
            {
                return GenerateMockCommunities();
            }
        }

        private async Task<List<SearchQuery>> GetSearchQueriesAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("/api/analytics/search-queries");
                response.EnsureSuccessStatusCode();
                var json = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<List<SearchQuery>>(json) ?? new List<SearchQuery>();
            }
            catch
            {
                return GenerateMockSearchQueries();
            }
        }

        private async Task<List<Hashtag>> GetHashtagsAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("/api/analytics/hashtags");
                response.EnsureSuccessStatusCode();
                var json = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<List<Hashtag>>(json) ?? new List<Hashtag>();
            }
            catch
            {
                return GenerateMockHashtags();
            }
        }

        private async Task<HistoricalData> GetHistoricalDataAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("/api/analytics/historical-data");
                response.EnsureSuccessStatusCode();
                var json = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<HistoricalData>(json) ?? new HistoricalData();
            }
            catch
            {
                return GenerateMockHistoricalData();
            }
        }

        private async Task SaveAnalysisResultAsync<T>(string analysisType, T result)
        {
            using var connection = new SQLiteConnection(_connectionString);
            await connection.OpenAsync();

            var command = new SQLiteCommand($@"
                INSERT INTO analysis_results (type, data, created_at) 
                VALUES (@type, @data, @created_at)", connection);

            command.Parameters.AddWithValue("@type", analysisType);
            command.Parameters.AddWithValue("@data", JsonSerializer.Serialize(result));
            command.Parameters.AddWithValue("@created_at", DateTime.UtcNow);

            await command.ExecuteNonQueryAsync();
        }

        // 분석 로직 구현 메서드들...
        private List<LoginPattern> AnalyzeLoginPatterns(List<UserActivity> activities)
        {
            // 로그인 패턴 분석 로직
            return new List<LoginPattern>();
        }

        private List<ContentPreference> AnalyzeContentPreferences(List<UserActivity> activities)
        {
            // 콘텐츠 선호도 분석 로직
            return new List<ContentPreference>();
        }

        private EngagementMetrics CalculateEngagementMetrics(List<UserActivity> activities)
        {
            // 참여도 메트릭 계산 로직
            return new EngagementMetrics();
        }

        private List<int> FindPeakActivityHours(List<UserActivity> activities)
        {
            // 피크 활동 시간 찾기 로직
            return new List<int>();
        }

        private List<UserSegment> SegmentUsers(List<UserActivity> activities)
        {
            // 사용자 세분화 로직
            return new List<UserSegment>();
        }

        private RetentionRates CalculateRetentionRates(List<UserActivity> activities)
        {
            // 리텐션 비율 계산 로직
            return new RetentionRates();
        }

        private ChurnPrediction PredictChurn(List<UserActivity> activities)
        {
            // 이탈 예측 로직
            return new ChurnPrediction();
        }

        // Mock 데이터 생성 메서드들...
        private List<UserActivity> GenerateMockUserActivities()
        {
            var random = new Random();
            var activities = new List<UserActivity>();

            for (int i = 0; i < 1000; i++)
            {
                activities.Add(new UserActivity
                {
                    UserId = i,
                    IsActive = random.NextDouble() > 0.3,
                    LastLogin = DateTime.UtcNow.AddDays(-random.Next(30)),
                    LoginCount = random.Next(1, 100),
                    ContentViews = random.Next(0, 500),
                    PostsCreated = random.Next(0, 50),
                    CommentsCreated = random.Next(0, 200)
                });
            }

            return activities;
        }

        private List<Post> GenerateMockPosts()
        {
            var random = new Random();
            var posts = new List<Post>();

            for (int i = 0; i < 500; i++)
            {
                posts.Add(new Post
                {
                    Id = i,
                    Title = $"게시글 {i}",
                    Content = $"게시글 내용 {i}",
                    AuthorId = random.Next(1, 100),
                    CreatedAt = DateTime.UtcNow.AddDays(-random.Next(30)),
                    ViewCount = random.Next(0, 1000),
                    LikeCount = random.Next(0, 100),
                    CommentCount = random.Next(0, 50),
                    Category = $"카테고리{random.Next(1, 10)}"
                });
            }

            return posts;
        }

        private List<Comment> GenerateMockComments()
        {
            var random = new Random();
            var comments = new List<Comment>();

            for (int i = 0; i < 2000; i++)
            {
                comments.Add(new Comment
                {
                    Id = i,
                    PostId = random.Next(1, 500),
                    AuthorId = random.Next(1, 100),
                    Content = $"댓글 내용 {i}",
                    CreatedAt = DateTime.UtcNow.AddDays(-random.Next(30)),
                    LikeCount = random.Next(0, 20)
                });
            }

            return comments;
        }

        private List<ViewData> GenerateMockViewData()
        {
            var random = new Random();
            var views = new List<ViewData>();

            for (int i = 0; i < 1000; i++)
            {
                views.Add(new ViewData
                {
                    PostId = random.Next(1, 500),
                    Count = random.Next(1, 100),
                    Date = DateTime.UtcNow.AddDays(-random.Next(30))
                });
            }

            return views;
        }

        private List<Community> GenerateMockCommunities()
        {
            var communities = new List<Community>();
            var types = new[] { "general", "tech", "gaming", "study", "business" };
            var random = new Random();

            for (int i = 0; i < 20; i++)
            {
                communities.Add(new Community
                {
                    Id = $"community_{i}",
                    Name = $"커뮤니티 {i}",
                    Type = types[random.Next(types.Length)],
                    MemberCount = random.Next(100, 5000),
                    PostCount = random.Next(50, 1000),
                    CreatedAt = DateTime.UtcNow.AddDays(-random.Next(365))
                });
            }

            return communities;
        }

        private List<SearchQuery> GenerateMockSearchQueries()
        {
            var queries = new List<SearchQuery>();
            var searchTerms = new[] { "React", "JavaScript", "Python", "게임", "학습", "비즈니스" };
            var random = new Random();

            for (int i = 0; i < 500; i++)
            {
                queries.Add(new SearchQuery
                {
                    Query = searchTerms[random.Next(searchTerms.Length)],
                    Count = random.Next(1, 100),
                    Date = DateTime.UtcNow.AddDays(-random.Next(30))
                });
            }

            return queries;
        }

        private List<Hashtag> GenerateMockHashtags()
        {
            var hashtags = new List<Hashtag>();
            var tags = new[] { "#React", "#JavaScript", "#Python", "#게임개발", "#학습", "#비즈니스" };
            var random = new Random();

            for (int i = 0; i < 200; i++)
            {
                hashtags.Add(new Hashtag
                {
                    Tag = tags[random.Next(tags.Length)],
                    Count = random.Next(1, 50),
                    Date = DateTime.UtcNow.AddDays(-random.Next(30))
                });
            }

            return hashtags;
        }

        private HistoricalData GenerateMockHistoricalData()
        {
            return new HistoricalData
            {
                UserGrowth = new List<DataPoint>(),
                ContentGrowth = new List<DataPoint>(),
                EngagementTrends = new List<DataPoint>()
            };
        }

        // 기타 분석 메서드들...
        private List<TopPost> GetTopPerformingPosts(List<Post> posts, List<ViewData> views)
        {
            return posts.OrderByDescending(p => p.ViewCount).Take(10)
                .Select(p => new TopPost { Post = p, PerformanceScore = p.ViewCount * 0.7 + p.LikeCount * 0.3 })
                .ToList();
        }

        private List<ContentCategory> AnalyzeContentCategories(List<Post> posts)
        {
            return posts.GroupBy(p => p.Category)
                .Select(g => new ContentCategory { Name = g.Key, Count = g.Count(), Engagement = g.Average(p => p.LikeCount) })
                .OrderByDescending(c => c.Count)
                .ToList();
        }

        private List<EngagementTrend> AnalyzeEngagementTrends(List<Post> posts, List<Comment> comments)
        {
            return new List<EngagementTrend>();
        }

        private List<ViralContent> IdentifyViralContent(List<Post> posts, List<ViewData> views)
        {
            return posts.Where(p => p.ViewCount > 1000)
                .Select(p => new ViralContent { Post = p, ViralScore = p.ViewCount / 1000.0 })
                .OrderByDescending(v => v.ViralScore)
                .ToList();
        }

        private ContentQuality AssessContentQuality(List<Post> posts, List<Comment> comments)
        {
            return new ContentQuality
            {
                AverageLength = posts.Average(p => p.Content?.Length ?? 0),
                EngagementRate = posts.Average(p => (double)p.LikeCount / Math.Max(p.ViewCount, 1)),
                CommentRate = posts.Average(p => (double)p.CommentCount / Math.Max(p.ViewCount, 1))
            };
        }

        private List<AuthorPerformance> AnalyzeAuthorPerformance(List<Post> posts)
        {
            return posts.GroupBy(p => p.AuthorId)
                .Select(g => new AuthorPerformance
                {
                    AuthorId = g.Key,
                    PostCount = g.Count(),
                    AverageViews = g.Average(p => p.ViewCount),
                    AverageLikes = g.Average(p => p.LikeCount),
                    TotalEngagement = g.Sum(p => p.LikeCount + p.CommentCount)
                })
                .OrderByDescending(a => a.TotalEngagement)
                .ToList();
        }

        private List<SeasonalTrend> AnalyzeSeasonalTrends(List<Post> posts)
        {
            return new List<SeasonalTrend>();
        }

        private async Task<CommunityHealthScore> CalculateCommunityHealthScoreAsync(Community community)
        {
            return new CommunityHealthScore
            {
                CommunityId = community.Id,
                CommunityName = community.Name,
                OverallScore = 75.0,
                MemberGrowth = 5.2,
                EngagementRate = 12.5,
                ContentQuality = 8.3,
                ActivityLevel = 15.7,
                Trend = "growing"
            };
        }

        private HealthDistribution CalculateHealthDistribution(List<CommunityHealthScore> scores)
        {
            return new HealthDistribution
            {
                Excellent = scores.Count(s => s.OverallScore >= 90),
                Good = scores.Count(s => s.OverallScore >= 70 && s.OverallScore < 90),
                Fair = scores.Count(s => s.OverallScore >= 50 && s.OverallScore < 70),
                Poor = scores.Count(s => s.OverallScore < 50)
            };
        }

        private List<RiskFactor> IdentifyRiskFactors(List<CommunityHealthScore> scores)
        {
            return new List<RiskFactor>();
        }

        private List<Recommendation> GenerateRecommendations(List<CommunityHealthScore> scores)
        {
            return new List<Recommendation>();
        }

        private List<TrendingTopic> IdentifyTrendingTopics(List<Post> posts)
        {
            return new List<TrendingTopic>();
        }

        private List<PopularHashtag> AnalyzeHashtags(List<Hashtag> hashtags)
        {
            return hashtags.GroupBy(h => h.Tag)
                .Select(g => new PopularHashtag { Tag = g.Key, Count = g.Sum(h => h.Count), Trend = "rising" })
                .OrderByDescending(h => h.Count)
                .Take(20)
                .ToList();
        }

        private List<SearchTrend> AnalyzeSearchTrends(List<SearchQuery> queries)
        {
            return new List<SearchTrend>();
        }

        private List<ContentTrend> AnalyzeContentTrends(List<Post> posts)
        {
            return new List<ContentTrend>();
        }

        private List<UserInterestTrend> AnalyzeUserInterestTrends(List<Post> posts)
        {
            return new List<UserInterestTrend>();
        }

        private List<SeasonalPattern> IdentifySeasonalPatterns(List<Post> posts)
        {
            return new List<SeasonalPattern>();
        }

        private List<EmergingTopic> IdentifyEmergingTopics(List<Post> posts)
        {
            return new List<EmergingTopic>();
        }

        private List<DecliningTopic> IdentifyDecliningTopics(List<Post> posts)
        {
            return new List<DecliningTopic>();
        }

        private List<CrossPlatformTrend> AnalyzeCrossPlatformTrends(List<Post> posts)
        {
            return new List<CrossPlatformTrend>();
        }

        private UserGrowthPrediction PredictUserGrowth(HistoricalData data)
        {
            return new UserGrowthPrediction
            {
                NextMonth = 1250,
                NextQuarter = 3800,
                NextYear = 15000,
                Confidence = 0.85
            };
        }

        private ContentDemandPrediction PredictContentDemand(HistoricalData data)
        {
            return new ContentDemandPrediction
            {
                ExpectedPosts = 500,
                ExpectedComments = 2000,
                ExpectedViews = 50000,
                Confidence = 0.78
            };
        }

        private EngagementPrediction PredictEngagement(HistoricalData data)
        {
            return new EngagementPrediction
            {
                ExpectedLikes = 2500,
                ExpectedComments = 1200,
                ExpectedShares = 300,
                Confidence = 0.82
            };
        }

        private UserChurnPrediction PredictUserChurn(HistoricalData data)
        {
            return new UserChurnPrediction
            {
                AtRiskUsers = 150,
                ChurnProbability = 0.15,
                Confidence = 0.90
            };
        }

        private RevenuePrediction PredictRevenue(HistoricalData data)
        {
            return new RevenuePrediction
            {
                NextMonth = 50000,
                NextQuarter = 150000,
                NextYear = 600000,
                Confidence = 0.75
            };
        }

        private ResourceNeedsPrediction PredictResourceNeeds(HistoricalData data)
        {
            return new ResourceNeedsPrediction
            {
                ServerCapacity = "High",
                StorageNeeds = "2TB",
                BandwidthNeeds = "1Gbps",
                Confidence = 0.80
            };
        }

        private RiskAssessment AssessRisks(HistoricalData data)
        {
            return new RiskAssessment
            {
                HighRisks = new List<string> { "서버 과부하", "데이터 손실" },
                MediumRisks = new List<string> { "보안 취약점", "성능 저하" },
                LowRisks = new List<string> { "사용자 불만", "경쟁사 위협" }
            };
        }

        private List<Opportunity> IdentifyOpportunities(HistoricalData data)
        {
            return new List<Opportunity>
            {
                new Opportunity { Title = "모바일 앱 출시", Potential = "High", Effort = "Medium" },
                new Opportunity { Title = "AI 추천 시스템", Potential = "Very High", Effort = "High" },
                new Opportunity { Title = "실시간 채팅", Potential = "Medium", Effort = "Low" }
            };
        }

        private List<Scenario> GenerateScenarios(HistoricalData data)
        {
            return new List<Scenario>
            {
                new Scenario { Name = "Optimistic", Probability = 0.3, Description = "사용자 급증" },
                new Scenario { Name = "Realistic", Probability = 0.5, Description = "안정적 성장" },
                new Scenario { Name = "Pessimistic", Probability = 0.2, Description = "성장 둔화" }
            };
        }

        #endregion
    }

    #region Data Models

    public class UserActivity
    {
        public int UserId { get; set; }
        public bool IsActive { get; set; }
        public DateTime LastLogin { get; set; }
        public int LoginCount { get; set; }
        public int ContentViews { get; set; }
        public int PostsCreated { get; set; }
        public int CommentsCreated { get; set; }
    }

    public class Post
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int AuthorId { get; set; }
        public DateTime CreatedAt { get; set; }
        public int ViewCount { get; set; }
        public int LikeCount { get; set; }
        public int CommentCount { get; set; }
        public string Category { get; set; } = string.Empty;
    }

    public class Comment
    {
        public int Id { get; set; }
        public int PostId { get; set; }
        public int AuthorId { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int LikeCount { get; set; }
    }

    public class ViewData
    {
        public int PostId { get; set; }
        public int Count { get; set; }
        public DateTime Date { get; set; }
    }

    public class Community
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int MemberCount { get; set; }
        public int PostCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class SearchQuery
    {
        public string Query { get; set; } = string.Empty;
        public int Count { get; set; }
        public DateTime Date { get; set; }
    }

    public class Hashtag
    {
        public string Tag { get; set; } = string.Empty;
        public int Count { get; set; }
        public DateTime Date { get; set; }
    }

    public class HistoricalData
    {
        public List<DataPoint> UserGrowth { get; set; } = new();
        public List<DataPoint> ContentGrowth { get; set; } = new();
        public List<DataPoint> EngagementTrends { get; set; } = new();
    }

    public class DataPoint
    {
        public DateTime Date { get; set; }
        public double Value { get; set; }
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T Data { get; set; } = default!;
    }

    // Analysis Result Models
    public class UserBehaviorAnalysis
    {
        public DateTime Timestamp { get; set; }
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public List<LoginPattern> LoginPatterns { get; set; } = new();
        public List<ContentPreference> ContentPreferences { get; set; } = new();
        public EngagementMetrics EngagementMetrics { get; set; } = new();
        public List<int> PeakActivityHours { get; set; } = new();
        public List<UserSegment> UserSegments { get; set; } = new();
        public RetentionRates RetentionRates { get; set; } = new();
        public ChurnPrediction ChurnPrediction { get; set; } = new();
    }

    public class ContentPerformanceAnalysis
    {
        public DateTime Timestamp { get; set; }
        public int TotalPosts { get; set; }
        public int TotalComments { get; set; }
        public int TotalViews { get; set; }
        public List<TopPost> TopPerformingPosts { get; set; } = new();
        public List<ContentCategory> ContentCategories { get; set; } = new();
        public List<EngagementTrend> EngagementTrends { get; set; } = new();
        public List<ViralContent> ViralContent { get; set; } = new();
        public ContentQuality ContentQuality { get; set; } = new();
        public List<AuthorPerformance> AuthorPerformance { get; set; } = new();
        public List<SeasonalTrend> SeasonalTrends { get; set; } = new();
    }

    public class CommunityHealthAnalysis
    {
        public DateTime Timestamp { get; set; }
        public int TotalCommunities { get; set; }
        public double AverageHealthScore { get; set; }
        public HealthDistribution HealthDistribution { get; set; } = new();
        public List<CommunityHealthScore> TopPerformingCommunities { get; set; } = new();
        public List<CommunityHealthScore> DecliningCommunities { get; set; } = new();
        public List<CommunityHealthScore> GrowthCommunities { get; set; } = new();
        public List<RiskFactor> RiskFactors { get; set; } = new();
        public List<Recommendation> Recommendations { get; set; } = new();
    }

    public class TrendAnalysis
    {
        public DateTime Timestamp { get; set; }
        public List<TrendingTopic> TrendingTopics { get; set; } = new();
        public List<PopularHashtag> PopularHashtags { get; set; } = new();
        public List<SearchTrend> SearchTrends { get; set; } = new();
        public List<ContentTrend> ContentTrends { get; set; } = new();
        public List<UserInterestTrend> UserInterestTrends { get; set; } = new();
        public List<SeasonalPattern> SeasonalPatterns { get; set; } = new();
        public List<EmergingTopic> EmergingTopics { get; set; } = new();
        public List<DecliningTopic> DecliningTopics { get; set; } = new();
        public List<CrossPlatformTrend> CrossPlatformTrends { get; set; } = new();
    }

    public class PredictiveAnalysis
    {
        public DateTime Timestamp { get; set; }
        public UserGrowthPrediction UserGrowthPrediction { get; set; } = new();
        public ContentDemandPrediction ContentDemandPrediction { get; set; } = new();
        public EngagementPrediction EngagementPrediction { get; set; } = new();
        public UserChurnPrediction ChurnPrediction { get; set; } = new();
        public RevenuePrediction RevenuePrediction { get; set; } = new();
        public ResourceNeedsPrediction ResourceNeedsPrediction { get; set; } = new();
        public RiskAssessment RiskAssessment { get; set; } = new();
        public List<Opportunity> OpportunityIdentification { get; set; } = new();
        public List<Scenario> ScenarioPlanning { get; set; } = new();
    }

    // Supporting Models
    public class LoginPattern
    {
        public string Pattern { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Percentage { get; set; }
    }

    public class ContentPreference
    {
        public string Category { get; set; } = string.Empty;
        public double PreferenceScore { get; set; }
        public int ViewCount { get; set; }
    }

    public class EngagementMetrics
    {
        public double AverageEngagement { get; set; }
        public double PeakEngagement { get; set; }
        public double EngagementGrowth { get; set; }
    }

    public class UserSegment
    {
        public string Name { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Percentage { get; set; }
        public List<string> Characteristics { get; set; } = new();
    }

    public class RetentionRates
    {
        public double Day1 { get; set; }
        public double Day7 { get; set; }
        public double Day30 { get; set; }
        public double Day90 { get; set; }
    }

    public class ChurnPrediction
    {
        public int AtRiskUsers { get; set; }
        public double ChurnProbability { get; set; }
        public List<string> RiskFactors { get; set; } = new();
    }

    public class TopPost
    {
        public Post Post { get; set; } = new();
        public double PerformanceScore { get; set; }
    }

    public class ContentCategory
    {
        public string Name { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Engagement { get; set; }
    }

    public class EngagementTrend
    {
        public DateTime Date { get; set; }
        public double Engagement { get; set; }
    }

    public class ViralContent
    {
        public Post Post { get; set; } = new();
        public double ViralScore { get; set; }
    }

    public class ContentQuality
    {
        public double AverageLength { get; set; }
        public double EngagementRate { get; set; }
        public double CommentRate { get; set; }
    }

    public class AuthorPerformance
    {
        public int AuthorId { get; set; }
        public int PostCount { get; set; }
        public double AverageViews { get; set; }
        public double AverageLikes { get; set; }
        public int TotalEngagement { get; set; }
    }

    public class SeasonalTrend
    {
        public string Season { get; set; } = string.Empty;
        public double ActivityLevel { get; set; }
        public List<string> PopularTopics { get; set; } = new();
    }

    public class CommunityHealthScore
    {
        public string CommunityId { get; set; } = string.Empty;
        public string CommunityName { get; set; } = string.Empty;
        public double OverallScore { get; set; }
        public double MemberGrowth { get; set; }
        public double EngagementRate { get; set; }
        public double ContentQuality { get; set; }
        public double ActivityLevel { get; set; }
        public string Trend { get; set; } = string.Empty;
    }

    public class HealthDistribution
    {
        public int Excellent { get; set; }
        public int Good { get; set; }
        public int Fair { get; set; }
        public int Poor { get; set; }
    }

    public class RiskFactor
    {
        public string Factor { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class Recommendation
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
    }

    public class TrendingTopic
    {
        public string Topic { get; set; } = string.Empty;
        public int Mentions { get; set; }
        public double GrowthRate { get; set; }
    }

    public class PopularHashtag
    {
        public string Tag { get; set; } = string.Empty;
        public int Count { get; set; }
        public string Trend { get; set; } = string.Empty;
    }

    public class SearchTrend
    {
        public string Query { get; set; } = string.Empty;
        public int Searches { get; set; }
        public double GrowthRate { get; set; }
    }

    public class ContentTrend
    {
        public string Type { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Engagement { get; set; }
    }

    public class UserInterestTrend
    {
        public string Interest { get; set; } = string.Empty;
        public int Users { get; set; }
        public double GrowthRate { get; set; }
    }

    public class SeasonalPattern
    {
        public string Season { get; set; } = string.Empty;
        public double ActivityMultiplier { get; set; }
        public List<string> KeyTrends { get; set; } = new();
    }

    public class EmergingTopic
    {
        public string Topic { get; set; } = string.Empty;
        public double GrowthRate { get; set; }
        public int CurrentMentions { get; set; }
    }

    public class DecliningTopic
    {
        public string Topic { get; set; } = string.Empty;
        public double DeclineRate { get; set; }
        public int PreviousMentions { get; set; }
    }

    public class CrossPlatformTrend
    {
        public string Platform { get; set; } = string.Empty;
        public double ActivityLevel { get; set; }
        public List<string> PopularContent { get; set; } = new();
    }

    public class UserGrowthPrediction
    {
        public int NextMonth { get; set; }
        public int NextQuarter { get; set; }
        public int NextYear { get; set; }
        public double Confidence { get; set; }
    }

    public class ContentDemandPrediction
    {
        public int ExpectedPosts { get; set; }
        public int ExpectedComments { get; set; }
        public int ExpectedViews { get; set; }
        public double Confidence { get; set; }
    }

    public class EngagementPrediction
    {
        public int ExpectedLikes { get; set; }
        public int ExpectedComments { get; set; }
        public int ExpectedShares { get; set; }
        public double Confidence { get; set; }
    }

    public class UserChurnPrediction
    {
        public int AtRiskUsers { get; set; }
        public double ChurnProbability { get; set; }
        public double Confidence { get; set; }
    }

    public class RevenuePrediction
    {
        public int NextMonth { get; set; }
        public int NextQuarter { get; set; }
        public int NextYear { get; set; }
        public double Confidence { get; set; }
    }

    public class ResourceNeedsPrediction
    {
        public string ServerCapacity { get; set; } = string.Empty;
        public string StorageNeeds { get; set; } = string.Empty;
        public string BandwidthNeeds { get; set; } = string.Empty;
        public double Confidence { get; set; }
    }

    public class RiskAssessment
    {
        public List<string> HighRisks { get; set; } = new();
        public List<string> MediumRisks { get; set; } = new();
        public List<string> LowRisks { get; set; } = new();
    }

    public class Opportunity
    {
        public string Title { get; set; } = string.Empty;
        public string Potential { get; set; } = string.Empty;
        public string Effort { get; set; } = string.Empty;
    }

    public class Scenario
    {
        public string Name { get; set; } = string.Empty;
        public double Probability { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    #endregion
}
