using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace LogisticsNotes.API.Models;

[Index("LicensePlate", Name = "UQ__Vehicles__026BC15C37E257F6", IsUnique = true)]
public partial class Vehicle
{
    [Key]
    [Column("VehicleID")]
    public int VehicleId { get; set; }

    [StringLength(20)]
    public string LicensePlate { get; set; } = null!;

    [StringLength(50)]
    public string? Model { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public double? Capacity { get; set; }

    [StringLength(20)]
    public string? Status { get; set; }
}
