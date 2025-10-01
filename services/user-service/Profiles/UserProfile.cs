using AutoMapper;
using UserService.DTOs;
using UserService.Models;

namespace UserService.Profiles;

public class UserProfile : Profile
{
    public UserProfile()
    {
        // User -> UserResponse
        CreateMap<User, UserResponse>()
            .ForMember(dest => dest.LastLoginAt, opt => opt.MapFrom(src => src.LastLoginAt));

        // CreateUserRequest -> User
        CreateMap<CreateUserRequest, User>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => "User"))
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
            .ForMember(dest => dest.IsEmailVerified, opt => opt.MapFrom(src => false))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.LastLoginAt, opt => opt.Ignore())
            .ForMember(dest => dest.Sessions, opt => opt.Ignore())
            .ForMember(dest => dest.OAuthTokens, opt => opt.Ignore());

        // UpdateUserRequest -> User (부분 업데이트용)
        CreateMap<UpdateUserRequest, User>()
            .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

        // UpdateProfileRequest -> User (부분 업데이트용)
        CreateMap<UpdateProfileRequest, User>()
            .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
    }
}

