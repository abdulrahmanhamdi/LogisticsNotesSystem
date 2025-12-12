using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LogisticsNotes.API.Models
{
    public class ServiceType
    {
        [Key]
        public int ServiceTypeId { get; set; }

        [Required]
        [StringLength(50)]
        public string TypeName { get; set; }


        public double PricePerKg { get; set; }

        public double BasePrice { get; set; }

        public double SpeedFactor { get; set; }

        [InverseProperty("ServiceType")]
        public virtual ICollection<Shipment> Shipments { get; set; } = new List<Shipment>();
    }
}