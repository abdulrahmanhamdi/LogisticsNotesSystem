using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace LogisticsNotes.API.Models;

public partial class LogisticsDbContext : DbContext
{
    public LogisticsDbContext()
    {
    }

    public LogisticsDbContext(DbContextOptions<LogisticsDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Attachment> Attachments { get; set; }
    public virtual DbSet<Branch> Branches { get; set; }
    public virtual DbSet<Category> Categories { get; set; }
    public virtual DbSet<Courier> Couriers { get; set; }
    public virtual DbSet<DeliveryHistory> DeliveryHistories { get; set; }
    public virtual DbSet<Folder> Folders { get; set; }
    public virtual DbSet<Note> Notes { get; set; }
    public virtual DbSet<Payment> Payments { get; set; }
    public virtual DbSet<PaymentMethod> PaymentMethods { get; set; }
    public virtual DbSet<Role> Roles { get; set; }
    public virtual DbSet<ServiceType> ServiceTypes { get; set; }
    public virtual DbSet<SharedNote> SharedNotes { get; set; }
    public virtual DbSet<Shipment> Shipments { get; set; }
    public virtual DbSet<ShipmentStatus> ShipmentStatuses { get; set; }
    public virtual DbSet<Tag> Tags { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<Vehicle> Vehicles { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Attachment>(entity =>
        {
            entity.HasKey(e => e.AttachmentId);
            entity.Property(e => e.UploadedAt).HasDefaultValueSql("(getdate())");
            entity.HasOne(d => d.Note).WithMany(p => p.Attachments).HasConstraintName("FK_Attachments_Notes");
        });

        modelBuilder.Entity<Branch>(entity =>
        {
            entity.HasKey(e => e.BranchId);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.CategoryId);
        });

        modelBuilder.Entity<Courier>(entity =>
        {
            entity.HasKey(e => e.CourierId);
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.CurrentBranch).WithMany(p => p.Couriers).HasConstraintName("FK_Couriers_Branches");

            entity.HasOne(d => d.User).WithOne(p => p.Courier)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Couriers_Users");

            entity.HasOne(d => d.Vehicle).WithMany(p => p.Couriers).HasConstraintName("FK_Couriers_Vehicles");
        });

        modelBuilder.Entity<DeliveryHistory>(entity =>
        {
            entity.HasKey(e => e.HistoryId);
            entity.Property(e => e.ChangedAt).HasDefaultValueSql("(getdate())");
            entity.HasOne(d => d.Shipment).WithMany(p => p.DeliveryHistories).HasConstraintName("FK_History_Shipments");
            entity.HasOne(d => d.Status).WithMany(p => p.DeliveryHistories)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_History_Statuses");
        });

        modelBuilder.Entity<Folder>(entity =>
        {
            entity.HasKey(e => e.FolderId);
            entity.HasOne(d => d.User).WithMany(p => p.Folders)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Folders_Users");
        });

        modelBuilder.Entity<Note>(entity =>
        {
            entity.HasKey(e => e.NoteId);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.HasOne(d => d.Category).WithMany(p => p.Notes).HasConstraintName("FK_Notes_Categories");
            entity.HasOne(d => d.Folder).WithMany(p => p.Notes).HasConstraintName("FK_Notes_Folders");
            entity.HasOne(d => d.User).WithMany(p => p.Notes)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Notes_Users");

            entity.HasMany(d => d.Tags)
                  .WithMany(p => p.Notes)
                  .UsingEntity<Dictionary<string, object>>(
                      "NoteTag",
                      r => r.HasOne<Tag>().WithMany().HasForeignKey("TagId").HasConstraintName("FK_NoteTags_Tags"),
                      l => l.HasOne<Note>().WithMany().HasForeignKey("NoteId").HasConstraintName("FK_NoteTags_Notes"),
                      j =>
                      {
                          j.HasKey("NoteId", "TagId");
                          j.ToTable("NoteTags");
                      });
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.PaymentId);
            entity.Property(e => e.IsSuccessful).HasDefaultValue(true);
            entity.Property(e => e.PaymentDate).HasDefaultValueSql("(getdate())");
            entity.HasOne(d => d.Method).WithMany(p => p.Payments)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Payments_Methods");
            entity.HasOne(d => d.Shipment).WithMany(p => p.Payments)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Payments_Shipments");
        });

        modelBuilder.Entity<PaymentMethod>(entity =>
        {
            entity.HasKey(e => e.MethodId);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId);
        });

        modelBuilder.Entity<ServiceType>(entity =>
        {
            entity.HasKey(e => e.ServiceTypeId);
        });

        modelBuilder.Entity<SharedNote>(entity =>
        {
            entity.HasKey(e => e.ShareId);
            entity.Property(e => e.PermissionLevel).HasDefaultValue("View");
            entity.HasOne(d => d.Note).WithMany(p => p.SharedNotes)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SharedNotes_Notes");
            entity.HasOne(d => d.SharedWithUser).WithMany(p => p.SharedNotes)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SharedNotes_Users");
        });

        modelBuilder.Entity<Shipment>(entity =>
        {
            entity.HasKey(e => e.ShipmentId);
            entity.Property(e => e.SendingDate).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.CurrentStatus).WithMany(p => p.Shipments)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Shipments_Statuses");

            entity.HasOne(d => d.DestinationBranch).WithMany(p => p.ShipmentDestinationBranches)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Shipments_Destination");

            entity.HasOne(d => d.OriginBranch).WithMany(p => p.ShipmentOriginBranches)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Shipments_Origin");

            entity.HasOne(d => d.Sender).WithMany(p => p.Shipments)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Shipments_Users");

            entity.HasOne(d => d.ServiceType).WithMany(p => p.Shipments)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Shipments_ServiceTypes");

            entity.HasOne(d => d.AssignedCourier).WithMany(p => p.Shipments)
                .HasForeignKey(d => d.AssignedCourierId)
                .HasConstraintName("FK_Shipments_Courier");
        });

        modelBuilder.Entity<ShipmentStatus>(entity =>
        {
            entity.HasKey(e => e.StatusId);
        });

        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(e => e.TagId);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.HasOne(d => d.Role).WithMany(p => p.Users)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Users_Roles");
        });

        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasKey(e => e.VehicleId);
            entity.Property(e => e.Status).HasDefaultValue("Available");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}