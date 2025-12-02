using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace LogisticsNotes.API.Models;

public partial class Branch
{
    [Key]
    [Column("BranchID")]
    public int BranchId { get; set; }

    [StringLength(100)]
    public string BranchName { get; set; } = null!;

    [StringLength(50)]
    public string City { get; set; } = null!;

    [StringLength(255)]
    public string Address { get; set; } = null!;

    [StringLength(20)]
    public string? Phone { get; set; }

    [InverseProperty("CurrentBranch")]
    public virtual ICollection<Courier> Couriers { get; set; } = new List<Courier>();

    [InverseProperty("DestinationBranch")]
    public virtual ICollection<Shipment> ShipmentDestinationBranches { get; set; } = new List<Shipment>();

    [InverseProperty("OriginBranch")]
    public virtual ICollection<Shipment> ShipmentOriginBranches { get; set; } = new List<Shipment>();
}
