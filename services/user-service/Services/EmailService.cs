using System.Net;
using System.Net.Mail;

namespace UserService.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendVerificationEmailAsync(string email, string username)
    {
        try
        {
            var subject = "이메일 인증을 완료해주세요";
            var body = $@"
                <h2>안녕하세요, {username}님!</h2>
                <p>Community Hub에 가입해주셔서 감사합니다.</p>
                <p>계정을 활성화하려면 아래 버튼을 클릭해주세요:</p>
                <a href='{_configuration["App:BaseUrl"]}/verify-email?token=VERIFICATION_TOKEN' 
                   style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
                   이메일 인증하기
                </a>
                <p>이 링크는 24시간 후에 만료됩니다.</p>
                <p>만약 이 이메일을 요청하지 않으셨다면, 무시하셔도 됩니다.</p>
            ";

            await SendEmailAsync(email, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email to {Email}", email);
        }
    }

    public async Task SendPasswordResetEmailAsync(string email, string username, string resetToken)
    {
        try
        {
            var subject = "비밀번호 재설정 요청";
            var body = $@"
                <h2>안녕하세요, {username}님!</h2>
                <p>비밀번호 재설정을 요청하셨습니다.</p>
                <p>새 비밀번호를 설정하려면 아래 버튼을 클릭해주세요:</p>
                <a href='{_configuration["App:BaseUrl"]}/reset-password?token={resetToken}' 
                   style='background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
                   비밀번호 재설정하기
                </a>
                <p>이 링크는 1시간 후에 만료됩니다.</p>
                <p>만약 이 요청을 하지 않으셨다면, 이 이메일을 무시하세요.</p>
            ";

            await SendEmailAsync(email, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email to {Email}", email);
        }
    }

    public async Task SendWelcomeEmailAsync(string email, string username)
    {
        try
        {
            var subject = "Community Hub에 오신 것을 환영합니다!";
            var body = $@"
                <h2>안녕하세요, {username}님!</h2>
                <p>Community Hub에 가입해주셔서 감사합니다!</p>
                <p>이제 다음과 같은 기능들을 이용하실 수 있습니다:</p>
                <ul>
                    <li>게시물 작성 및 댓글</li>
                    <li>다른 사용자와 소통</li>
                    <li>관심 있는 주제 팔로우</li>
                    <li>실시간 알림 받기</li>
                </ul>
                <p>궁금한 점이 있으시면 언제든지 문의해주세요!</p>
                <p>즐거운 커뮤니티 활동 되세요!</p>
            ";

            await SendEmailAsync(email, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send welcome email to {Email}", email);
        }
    }

    public async Task SendNotificationEmailAsync(string email, string subject, string message)
    {
        try
        {
            var body = $@"
                <h2>{subject}</h2>
                <p>{message}</p>
                <p>Community Hub에서 더 많은 정보를 확인하세요!</p>
            ";

            await SendEmailAsync(email, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification email to {Email}", email);
        }
    }

    private async Task SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            var smtpHost = _configuration["Email:SmtpHost"];
            var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
            var smtpUsername = _configuration["Email:SmtpUsername"];
            var smtpPassword = _configuration["Email:SmtpPassword"];
            var fromEmail = _configuration["Email:FromEmail"];
            var fromName = _configuration["Email:FromName"];

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                Credentials = new NetworkCredential(smtpUsername, smtpPassword),
                EnableSsl = true
            };

            using var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            message.To.Add(to);

            await client.SendMailAsync(message);
            _logger.LogInformation("Email sent successfully to {Email}", to);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", to);
            throw;
        }
    }
}

