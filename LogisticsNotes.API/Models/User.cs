using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace LogisticsNotes.API.Models;

[Index("Email", Name = "UQ__Users__A9D10534130B5AAB", IsUnique = true)]
public partial class User
{
    [Key]
    [Column("UserID")]
    public int UserId { get; set; }

    [Column("RoleID")]
    public int RoleId { get; set; }

    [StringLength(50)]
    public string FirstName { get; set; } = null!;

    [StringLength(50)]
    public string LastName { get; set; } = null!;

    [StringLength(100)]
    public string Email { get; set; } = null!;

    [StringLength(255)]
    public string PasswordHash { get; set; } = null!;

    [StringLength(20)]
    public string? Phone { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [InverseProperty("User")]
    public virtual Courier? Courier { get; set; }

    [InverseProperty("User")]
    public virtual ICollection<Folder> Folders { get; set; } = new List<Folder>();

    [InverseProperty("User")]
    public virtual ICollection<Note> Notes { get; set; } = new List<Note>();

    [ForeignKey("RoleId")]
    [InverseProperty("Users")]
    public virtual Role? Role { get; set; }

    [InverseProperty("SharedWithUser")]
    public virtual ICollection<SharedNote> SharedNotes { get; set; } = new List<SharedNote>();

    [InverseProperty("Sender")]
    public virtual ICollection<Shipment> Shipments { get; set; } = new List<Shipment>();
}