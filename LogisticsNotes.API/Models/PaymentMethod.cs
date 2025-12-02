using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace LogisticsNotes.API.Models;

public partial class PaymentMethod
{
    [Key]
    [Column("MethodID")]
    public int MethodId { get; set; }

    [StringLength(50)]
    public string MethodName { get; set; } = null!;

    [InverseProperty("Method")]
    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
