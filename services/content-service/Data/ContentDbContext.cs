using Microsoft.EntityFrameworkCore;
using ContentService.Models;

namespace ContentService.Data;

public class ContentDbContext : DbContext
{
    public ContentDbContext(DbContextOptions<ContentDbContext> options) : base(options)
    {
    }

    public DbSet<Post> Posts { get; set; }
    public DbSet<Board> Boards { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<PostLike> PostLikes { get; set; }
    public DbSet<CommentLike> CommentLikes { get; set; }
    public DbSet<PostView> PostViews { get; set; }
    public DbSet<Tag> Tags { get; set; }
    public DbSet<PostTag> PostTags { get; set; }
    public DbSet<PostAttachment> PostAttachments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Post 엔티티 설정
        modelBuilder.Entity<Post>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Content).IsRequired().HasColumnType("TEXT");
            entity.Property(e => e.Summary).HasMaxLength(500);
            entity.Property(e => e.Tags).HasMaxLength(1000);
            entity.Property(e => e.FeaturedImageUrl).HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

            // 인덱스 설정
            entity.HasIndex(e => e.AuthorId);
            entity.HasIndex(e => e.BoardId);
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.IsPublished);
            entity.HasIndex(e => e.IsPinned);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.PublishedAt);
            entity.HasIndex(e => e.ViewCount);
            entity.HasIndex(e => e.LikeCount);

            // 복합 인덱스
            entity.HasIndex(e => new { e.BoardId, e.IsPublished, e.CreatedAt });
            entity.HasIndex(e => new { e.AuthorId, e.IsPublished, e.CreatedAt });
            entity.HasIndex(e => new { e.Category, e.IsPublished, e.CreatedAt });

            // 외래 키 설정
            entity.HasOne(e => e.Author)
                  .WithMany()
                  .HasForeignKey(e => e.AuthorId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Board)
                  .WithMany(e => e.Posts)
                  .HasForeignKey(e => e.BoardId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Board 엔티티 설정
        modelBuilder.Entity<Board>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Icon).HasMaxLength(50);
            entity.Property(e => e.Color).HasMaxLength(7);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

            // 인덱스 설정
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.SortOrder);
        });

        // Comment 엔티티 설정
        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).IsRequired().HasColumnType("TEXT");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

            // 인덱스 설정
            entity.HasIndex(e => e.PostId);
            entity.HasIndex(e => e.AuthorId);
            entity.HasIndex(e => e.ParentId);
            entity.HasIndex(e => e.IsDeleted);
            entity.HasIndex(e => e.CreatedAt);

            // 외래 키 설정
            entity.HasOne(e => e.Post)
                  .WithMany(e => e.Comments)
                  .HasForeignKey(e => e.PostId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Author)
                  .WithMany()
                  .HasForeignKey(e => e.AuthorId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Parent)
                  .WithMany(e => e.Replies)
                  .HasForeignKey(e => e.ParentId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // PostLike 엔티티 설정
        modelBuilder.Entity<PostLike>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            // 인덱스 설정
            entity.HasIndex(e => e.PostId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.PostId, e.UserId }).IsUnique();

            // 외래 키 설정
            entity.HasOne(e => e.Post)
                  .WithMany(e => e.Likes)
                  .HasForeignKey(e => e.PostId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // CommentLike 엔티티 설정
        modelBuilder.Entity<CommentLike>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            // 인덱스 설정
            entity.HasIndex(e => e.CommentId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.CommentId, e.UserId }).IsUnique();

            // 외래 키 설정
            entity.HasOne(e => e.Comment)
                  .WithMany(e => e.Likes)
                  .HasForeignKey(e => e.CommentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // PostView 엔티티 설정
        modelBuilder.Entity<PostView>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.IpAddress).HasMaxLength(45);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            // 인덱스 설정
            entity.HasIndex(e => e.PostId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);

            // 외래 키 설정
            entity.HasOne(e => e.Post)
                  .WithMany(e => e.Views)
                  .HasForeignKey(e => e.PostId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Tag 엔티티 설정
        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(200);
            entity.Property(e => e.Color).HasMaxLength(7);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            // 인덱스 설정
            entity.HasIndex(e => e.Name).IsUnique();
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.UsageCount);
        });

        // PostTag 엔티티 설정
        modelBuilder.Entity<PostTag>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            // 인덱스 설정
            entity.HasIndex(e => e.PostId);
            entity.HasIndex(e => e.TagId);
            entity.HasIndex(e => new { e.PostId, e.TagId }).IsUnique();

            // 외래 키 설정
            entity.HasOne(e => e.Post)
                  .WithMany(e => e.PostTags)
                  .HasForeignKey(e => e.PostId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Tag)
                  .WithMany(e => e.PostTags)
                  .HasForeignKey(e => e.TagId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // PostAttachment 엔티티 설정
        modelBuilder.Entity<PostAttachment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.FileUrl).IsRequired().HasMaxLength(500);
            entity.Property(e => e.MimeType).HasMaxLength(100);
            entity.Property(e => e.FileType).HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            // 인덱스 설정
            entity.HasIndex(e => e.PostId);
            entity.HasIndex(e => e.IsActive);

            // 외래 키 설정
            entity.HasOne(e => e.Post)
                  .WithMany(e => e.Attachments)
                  .HasForeignKey(e => e.PostId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

