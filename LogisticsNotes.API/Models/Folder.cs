using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace LogisticsNotes.API.Models;

public partial class Folder
{
    [Key]
    [Column("FolderID")]
    public int FolderId { get; set; }

    [Column("UserID")]
    public int UserId { get; set; }

    [StringLength(100)]
    public string FolderName { get; set; } = null!;

    [StringLength(10)]
    public string? ColorCode { get; set; }

    public bool? IsArchived { get; set; }

    [InverseProperty("Folder")]
    public virtual ICollection<Note> Notes { get; set; } = new List<Note>();

    [ForeignKey("UserId")]
    [InverseProperty("Folders")]
    public virtual User? User { get; set; }
}
