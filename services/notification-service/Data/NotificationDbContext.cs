using Microsoft.EntityFrameworkCore;
using NotificationService.Models;

namespace NotificationService.Data;

public class NotificationDbContext : DbContext
{
    public NotificationDbContext(DbContextOptions<NotificationDbContext> options) : base(options)
    {
    }

    public DbSet<Notification> Notifications { get; set; }
    public DbSet<NotificationSettings> NotificationSettings { get; set; }
    public DbSet<PushToken> PushTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Notification 엔티티 설정
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Message).HasMaxLength(1000).IsRequired();
            entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ActionUrl).HasMaxLength(500);
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.RelatedType).HasMaxLength(50);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.IsRead);
            entity.HasIndex(e => new { e.UserId, e.IsRead });
        });

        // NotificationSettings 엔티티 설정
        modelBuilder.Entity<NotificationSettings>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();
        });

        // PushToken 엔티티 설정
        modelBuilder.Entity<PushToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Token).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Platform).HasMaxLength(20).IsRequired();
            entity.Property(e => e.DeviceId).HasMaxLength(100);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Token);
            entity.HasIndex(e => e.IsActive);
        });
    }
}
