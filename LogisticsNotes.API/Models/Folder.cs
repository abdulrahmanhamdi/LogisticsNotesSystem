using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LogisticsNotes.API.Models
{
    public class Folder
    {
        [Key]
        public int FolderId { get; set; }

        public int UserId { get; set; }

        [Required]
        [StringLength(50)]
        public string FolderName { get; set; }

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        [InverseProperty("Folder")]
        public virtual ICollection<Note> Notes { get; set; } = new List<Note>();
    }
}