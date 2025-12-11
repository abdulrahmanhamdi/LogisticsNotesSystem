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
            entity.HasKey(e => e.AttachmentId).HasName("PK__Attachme__442C64DE2195BA66");
            entity.Property(e => e.UploadedAt).HasDefaultValueSql("(getdate())");
            entity.HasOne(d => d.Note).WithMany(p => p.Attachments).HasConstraintName("FK_Attachments_Notes");
        });

        modelBuilder.Entity<Branch>(entity =>
        {
            entity.HasKey(e => e.BranchId).HasName("PK__Branches__A1682FA5FF9BBF90");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.CategoryId).HasName("PK__Categori__19093A2B81D251DB");
        });

        modelBuilder.Entity<Courier>(entity =>
        {
            entity.HasKey(e => e.CourierId).HasName("PK__Couriers__CDAE76F655620BAA");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.HasOne(d => d.CurrentBranch).WithMany(p => p.Couriers).HasConstraintName("FK_Couriers_Branches");
            entity.HasOne(d => d.User).WithOne(p => p.Courier)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Couriers_Users");
        });

        modelBuilder.Entity<DeliveryHistory>(entity =>
        {
            entity.HasKey(e => e.HistoryId).HasName("PK__Delivery__4D7B4ADD4A2B98BD");
            entity.Property(e => e.ChangedAt).HasDefaultValueSql("(getdate())");
            entity.HasOne(d => d.Shipment).WithMany(p => p.DeliveryHistories).HasConstraintName("FK_History_Shipments");
            entity.HasOne(d => d.Status).WithMany(p => p.DeliveryHistories)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_History_Statuses");
        });

        modelBuilder.Entity<Folder>(entity =>
        {
            entity.HasKey(e => e.FolderId).HasName("PK__Folders__ACD7109FC34BF54F");
            entity.Property(e => e.IsArchived).HasDefaultValue(false);
            entity.HasOne(d => d.User).WithMany(p => p.Folders)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Folders_Users");
        });

        modelBuilder.Entity<Note>(entity =>
        {
            entity.HasKey(e => e.NoteId).HasName("PK__Notes__EACE357F30076034");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.HasOne(d => d.Category).WithMany(p => p.Notes).HasConstraintName("FK_Notes_Categories");
            entity.HasOne(d => d.Folder).WithMany(p => p.Notes).HasConstraintName("FK_Notes_Folders");
            entity.HasOne(d => d.User).WithMany(p => p.Notes)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Notes_Users");

            entity.HasMany(d => d.Tags).WithMany(p => p.Notes)
                .UsingEntity<Dictionary<string, object>>(
                    "NoteTag",
                    r => r.HasOne<Tag>().WithMany()
                        .HasForeignKey("TagId")
                        .HasConstraintName("FK_NoteTags_Tags"),
                    l => l.HasOne<Note>().WithMany()
                        .HasForeignKey("NoteId")
                        .HasConstraintName("FK_NoteTags_Notes"),
                    j =>
                    {
                        j.HasKey("NoteId", "TagId").HasName("PK__NoteTags__3C99FADBE59CCFFA");
                        j.ToTable("NoteTags");
                        j.IndexerProperty<int>("NoteId").HasColumnName("NoteID");
                        j.IndexerProperty<int>("TagId").HasColumnName("TagID");
                    });
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.PaymentId).HasName("PK__Payments__9B556A58F084C8F7");
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
            entity.HasKey(e => e.MethodId).HasName("PK__PaymentM__FC681FB17BA1FB95");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("PK__Roles__8AFACE3A71A8BAAF");
        });

        modelBuilder.Entity<ServiceType>(entity =>
        {
            entity.HasKey(e => e.ServiceTypeId).HasName("PK__ServiceT__8ADFAA0CB36C31DA");
        });

        modelBuilder.Entity<SharedNote>(entity =>
        {
            entity.HasKey(e => e.ShareId).HasName("PK__SharedNo__D32A3F8ECEF9DCF5");
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
            entity.HasKey(e => e.ShipmentId).HasName("PK__Shipment__5CAD378DE24EF432");
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
        });

        modelBuilder.Entity<ShipmentStatus>(entity =>
        {
            entity.HasKey(e => e.StatusId).HasName("PK__Shipment__C8EE2043DD203DD4");
        });

        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(e => e.TagId).HasName("PK__Tags__657CFA4CD1CB764B");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__Users__1788CCAC35399D23");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.HasOne(d => d.Role).WithMany(p => p.Users)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Users_Roles");
        });

        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasKey(e => e.VehicleId).HasName("PK__Vehicles__476B54B2844F34A2");
            entity.Property(e => e.Status).HasDefaultValue("Available");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
