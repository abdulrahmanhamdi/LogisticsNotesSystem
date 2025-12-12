using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace LogisticsNotes.API.Models
{
    [Index("TagName", Name = "UQ__Tags__7B1D0AD1B0B53F71", IsUnique = true)] 
    public partial class Tag
    {
        [Key]
        [Column("TagID")]
        public int TagId { get; set; }

        [Column("TagName")] 
        [StringLength(50)]
        public string TagName { get; set; } = null!; 

        [ForeignKey("TagId")]
        [InverseProperty("Tags")]
        public virtual ICollection<Note> Notes { get; set; } = new List<Note>();
    }
}