using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LogisticsNotes.API.Models
{
    public class Vehicle
    {
        [Key]
        public int VehicleId { get; set; } 

        [Required]
        public string LicensePlate { get; set; } 

        public string Model { get; set; } 

        public double Capacity { get; set; } 

        public string Status { get; set; } = "Available"; 
    }
}