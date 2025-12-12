using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LogisticsNotes.API.Models
{
    public class SharedNote
    {
        [Key]
        public int ShareId { get; set; }

        public int NoteId { get; set; }

        public int SharedWithUserId { get; set; } 

        [StringLength(20)]
        public string PermissionLevel { get; set; } = "View"; 

        [ForeignKey("NoteId")]
        public virtual Note? Note { get; set; }

        [ForeignKey("SharedWithUserId")]
        public virtual User? SharedWithUser { get; set; }
    }
}