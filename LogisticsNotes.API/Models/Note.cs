using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace LogisticsNotes.API.Models;

public partial class Note
{
    [Key]
    [Column("NoteID")]
    public int NoteId { get; set; }

    [Column("UserID")]
    public int UserId { get; set; }

    [Column("FolderID")]
    public int? FolderId { get; set; }

    [Column("CategoryID")]
    public int? CategoryId { get; set; }

    [StringLength(200)]
    public string Title { get; set; } = null!;

    public string? Content { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? ModifiedAt { get; set; }

    [InverseProperty("Note")]
    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();

    [ForeignKey("CategoryId")]
    [InverseProperty("Notes")]
    public virtual Category? Category { get; set; }

    [ForeignKey("FolderId")]
    [InverseProperty("Notes")]
    public virtual Folder? Folder { get; set; }

    [InverseProperty("Note")]
    public virtual ICollection<SharedNote> SharedNotes { get; set; } = new List<SharedNote>();

    [ForeignKey("UserId")]
    [InverseProperty("Notes")]
    public virtual User User { get; set; } = null!;

    [ForeignKey("NoteId")]
    [InverseProperty("Notes")]
    public virtual ICollection<Tag> Tags { get; set; } = new List<Tag>();
}
