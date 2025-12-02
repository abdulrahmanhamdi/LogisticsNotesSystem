using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace LogisticsNotes.API.Models;

[Table("DeliveryHistory")]
public partial class DeliveryHistory
{
    [Key]
    [Column("HistoryID")]
    public int HistoryId { get; set; }

    [Column("ShipmentID")]
    public int ShipmentId { get; set; }

    [Column("StatusID")]
    public int StatusId { get; set; }

    [StringLength(100)]
    public string? Location { get; set; }

    [Column("ChangedByUserID")]
    public int? ChangedByUserId { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? Timestamp { get; set; }

    [ForeignKey("ShipmentId")]
    [InverseProperty("DeliveryHistories")]
    public virtual Shipment Shipment { get; set; } = null!;

    [ForeignKey("StatusId")]
    [InverseProperty("DeliveryHistories")]
    public virtual ShipmentStatus Status { get; set; } = null!;
}
