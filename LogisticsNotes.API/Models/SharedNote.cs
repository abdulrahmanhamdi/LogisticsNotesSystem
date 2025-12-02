using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace LogisticsNotes.API.Models;

public partial class SharedNote
{
    [Key]
    [Column("ShareID")]
    public int ShareId { get; set; }

    [Column("NoteID")]
    public int NoteId { get; set; }

    [Column("SharedWithUserID")]
    public int SharedWithUserId { get; set; }

    [StringLength(20)]
    public string? PermissionLevel { get; set; }

    [ForeignKey("NoteId")]
    [InverseProperty("SharedNotes")]
    public virtual Note Note { get; set; } = null!;

    [ForeignKey("SharedWithUserId")]
    [InverseProperty("SharedNotes")]
    public virtual User SharedWithUser { get; set; } = null!;
}
