using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LogisticsNotes.API.Models
{
    public class PaymentMethod
    {
        [Key]
        public int MethodId { get; set; }

        public string MethodName { get; set; }

        [InverseProperty("Method")]
        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}