namespace UserService.Services;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string email, string username);
    Task SendPasswordResetEmailAsync(string email, string username, string resetToken);
    Task SendWelcomeEmailAsync(string email, string username);
    Task SendNotificationEmailAsync(string email, string subject, string message);
}

