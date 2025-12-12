using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LogisticsNotes.API.Models
{
    public class NoteTag
    {
        public int NoteId { get; set; }
        public int TagId { get; set; }

        [ForeignKey("NoteId")]
        public virtual Note? Note { get; set; }

        [ForeignKey("TagId")]
        public virtual Tag? Tag { get; set; }
    }
}