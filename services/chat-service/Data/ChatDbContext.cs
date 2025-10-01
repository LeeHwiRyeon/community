using Microsoft.EntityFrameworkCore;
using ChatService.Models;

namespace ChatService.Data;

public class ChatDbContext : DbContext
{
    public ChatDbContext(DbContextOptions<ChatDbContext> options) : base(options) { }

    public DbSet<ChatRoom> ChatRooms { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<ChatRoomMember> ChatRoomMembers { get; set; }
    public DbSet<ChatReaction> ChatReactions { get; set; }
    public DbSet<UserOnlineStatus> UserOnlineStatuses { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ChatRoom configurations
        modelBuilder.Entity<ChatRoom>(entity =>
        {
            entity.HasIndex(r => r.Type);
            entity.HasIndex(r => r.CreatedBy);
            entity.HasIndex(r => r.IsActive);
            entity.Property(r => r.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(r => r.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP").ValueGeneratedOnAddOrUpdate();
        });

        // ChatMessage configurations
        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasOne(m => m.Room)
                  .WithMany(r => r.Messages)
                  .HasForeignKey(m => m.RoomId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.ReplyTo)
                  .WithMany(m => m.Replies)
                  .HasForeignKey(m => m.ReplyToId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(m => m.RoomId);
            entity.HasIndex(m => m.UserId);
            entity.HasIndex(m => m.CreatedAt);
            entity.HasIndex(m => m.MessageType);
            entity.Property(m => m.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(m => m.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP").ValueGeneratedOnAddOrUpdate();
        });

        // ChatRoomMember configurations
        modelBuilder.Entity<ChatRoomMember>(entity =>
        {
            entity.HasOne(m => m.Room)
                  .WithMany(r => r.Members)
                  .HasForeignKey(m => m.RoomId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(m => new { m.RoomId, m.UserId }).IsUnique();
            entity.HasIndex(m => m.RoomId);
            entity.HasIndex(m => m.UserId);
            entity.Property(m => m.JoinedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // ChatReaction configurations
        modelBuilder.Entity<ChatReaction>(entity =>
        {
            entity.HasOne(r => r.Message)
                  .WithMany(m => m.Reactions)
                  .HasForeignKey(r => r.MessageId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(r => new { r.MessageId, r.UserId, r.Emoji }).IsUnique();
            entity.HasIndex(r => r.MessageId);
            entity.Property(r => r.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // UserOnlineStatus configurations
        modelBuilder.Entity<UserOnlineStatus>(entity =>
        {
            entity.HasIndex(u => u.UserId).IsUnique();
            entity.HasIndex(u => u.Status);
            entity.Property(u => u.LastSeenAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(u => u.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP").ValueGeneratedOnAddOrUpdate();
        });
    }
}
