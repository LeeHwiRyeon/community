using FluentValidation;
using UserService.DTOs;

namespace UserService.Validators;

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.FirstName)
            .MaximumLength(100).WithMessage("First name must not exceed 100 characters");

        RuleFor(x => x.LastName)
            .MaximumLength(100).WithMessage("Last name must not exceed 100 characters");

        RuleFor(x => x.Bio)
            .MaximumLength(500).WithMessage("Bio must not exceed 500 characters");

        RuleFor(x => x.AvatarUrl)
            .MaximumLength(255).WithMessage("Avatar URL must not exceed 255 characters")
            .Must(BeAValidUrl).WithMessage("Avatar URL must be a valid URL");
    }

    private static bool BeAValidUrl(string? url)
    {
        if (string.IsNullOrEmpty(url))
            return true;

        return Uri.TryCreate(url, UriKind.Absolute, out _);
    }
}

