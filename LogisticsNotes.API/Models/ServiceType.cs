using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace LogisticsNotes.API.Models;

public partial class ServiceType
{
    [Key]
    [Column("ServiceTypeID")]
    public int ServiceTypeId { get; set; }

    [StringLength(50)]
    public string TypeName { get; set; } = null!;


    public double BasePrice { get; set; }

    public double? SpeedFactor { get; set; }

    [InverseProperty("ServiceType")]
    public virtual ICollection<Shipment> Shipments { get; set; } = new List<Shipment>();
}