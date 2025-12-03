using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace LogisticsNotes.API.Models;

public partial class Shipment
{
    [Key]
    [Column("ShipmentID")]
    public int ShipmentId { get; set; }

    [Column("SenderID")]
    public int SenderId { get; set; }

    [Column("OriginBranchID")]
    public int OriginBranchId { get; set; }

    [Column("DestinationBranchID")]
    public int DestinationBranchId { get; set; }

    [Column("ServiceTypeID")]
    public int ServiceTypeId { get; set; }

    [Column("CurrentStatusID")]
    public int CurrentStatusId { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal Weight { get; set; }

    [StringLength(255)]
    public string? Description { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? SendingDate { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? EstimatedDeliveryDate { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? DeliveredAt { get; set; }

    [ForeignKey("CurrentStatusId")]
    [InverseProperty("Shipments")]
    public virtual ShipmentStatus? CurrentStatus { get; set; }

    [InverseProperty("Shipment")]
    public virtual ICollection<DeliveryHistory> DeliveryHistories { get; set; } = new List<DeliveryHistory>();

    [ForeignKey("DestinationBranchId")]
    [InverseProperty("ShipmentDestinationBranches")]
    public virtual Branch? DestinationBranch { get; set; }

    [ForeignKey("OriginBranchId")]
    [InverseProperty("ShipmentOriginBranches")]
    public virtual Branch? OriginBranch { get; set; }

    [InverseProperty("Shipment")]
    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    [ForeignKey("SenderId")]
    [InverseProperty("Shipments")]
    public virtual User? Sender { get; set; }

    [ForeignKey("ServiceTypeId")]
    [InverseProperty("Shipments")]
    public virtual ServiceType? ServiceType { get; set; }
    public int? CourierId { get; set; } 

    [ForeignKey("CourierId")]
    [InverseProperty("Shipments")]
    public virtual Courier? Courier { get; set; } // علاقة الربط
}