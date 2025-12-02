using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace LogisticsNotes.API.Models;

public partial class ShipmentStatus
{
    [Key]
    [Column("StatusID")]
    public int StatusId { get; set; }

    [StringLength(50)]
    public string StatusName { get; set; } = null!;

    [StringLength(200)]
    public string? Description { get; set; }

    [InverseProperty("Status")]
    public virtual ICollection<DeliveryHistory> DeliveryHistories { get; set; } = new List<DeliveryHistory>();

    [InverseProperty("CurrentStatus")]
    public virtual ICollection<Shipment> Shipments { get; set; } = new List<Shipment>();
}
