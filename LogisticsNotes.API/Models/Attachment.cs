using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace LogisticsNotes.API.Models;

public partial class Attachment
{
    [Key]
    [Column("AttachmentID")]
    public int AttachmentId { get; set; }

    [Column("NoteID")]
    public int NoteId { get; set; }

    [StringLength(255)]
    public string FileName { get; set; } = null!;

    public string FilePath { get; set; } = null!;

    [Column(TypeName = "datetime")]
    public DateTime? UploadedAt { get; set; }

    [ForeignKey("NoteId")]
    [InverseProperty("Attachments")]
    public virtual Note Note { get; set; } = null!;
}
