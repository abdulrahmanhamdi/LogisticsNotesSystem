using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LogisticsNotes.API.Models
{
    public class Attachment
    {
        [Key]
        public int AttachmentId { get; set; }

        public int NoteId { get; set; }

        [StringLength(255)]
        public string FileName { get; set; }

        public string FilePath { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.Now;

        [ForeignKey("NoteId")]
        public virtual Note? Note { get; set; }
    }
}