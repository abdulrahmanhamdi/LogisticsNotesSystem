using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace LogisticsNotes.API.Models;

public partial class Payment
{
    [Key]
    [Column("PaymentID")]
    public int PaymentId { get; set; }

    [Column("ShipmentID")]
    public int ShipmentId { get; set; }

    [Column("MethodID")]
    public int MethodId { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public double Amount { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? PaymentDate { get; set; }

    public bool? IsSuccessful { get; set; }

    [ForeignKey("MethodId")]
    [InverseProperty("Payments")]
    public virtual PaymentMethod Method { get; set; } = null!;

    [ForeignKey("ShipmentId")]
    [InverseProperty("Payments")]
    public virtual Shipment Shipment { get; set; } = null!;
}
