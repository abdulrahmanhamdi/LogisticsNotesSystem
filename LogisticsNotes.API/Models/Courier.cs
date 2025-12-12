using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

namespace LogisticsNotes.API.Models;

[Index("UserId", Name = "UQ__Couriers__1788CCADE464A99E", IsUnique = true)]
public partial class Courier
{
    [Key]
    [Column("CourierID")]
    public int CourierId { get; set; }

    [Column("UserID")]
    public int UserId { get; set; }

    [Column("CurrentBranchID")]
    public int? CurrentBranchId { get; set; }

    [Column("VehicleID")]
    public int? VehicleId { get; set; }

    [StringLength(50)]
    public string LicenseNumber { get; set; } = null!;

    [StringLength(50)]
    public string? VehicleType { get; set; }

    public TimeOnly? ShiftStart { get; set; }

    public TimeOnly? ShiftEnd { get; set; }

    public bool? IsActive { get; set; }



    [ForeignKey("CurrentBranchId")]
    [InverseProperty("Couriers")]
    public virtual Branch? CurrentBranch { get; set; } 

    [ForeignKey("VehicleId")]
    [InverseProperty("Couriers")]
    public virtual Vehicle? Vehicle { get; set; } 

    [ForeignKey("UserId")]
    [InverseProperty("Courier")]
    public virtual User? User { get; set; }

    [InverseProperty("AssignedCourier")]
    public virtual ICollection<Shipment> Shipments { get; set; } = new List<Shipment>();
}