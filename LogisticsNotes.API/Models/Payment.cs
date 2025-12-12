using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LogisticsNotes.API.Models
{
    public class Payment
    {
        [Key]
        public int PaymentId { get; set; }

        public int ShipmentId { get; set; }
        public int MethodId { get; set; }

        public double Amount { get; set; }

        public DateTime PaymentDate { get; set; } = DateTime.Now;
        public bool IsSuccessful { get; set; } = true;

        [ForeignKey("ShipmentId")]
        public Shipment? Shipment { get; set; }

        [ForeignKey("MethodId")]
        public PaymentMethod? Method { get; set; }
    }
}