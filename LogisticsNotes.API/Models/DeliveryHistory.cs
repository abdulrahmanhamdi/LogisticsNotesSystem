using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LogisticsNotes.API.Models
{
    public class DeliveryHistory
    {
        [Key]
        public int HistoryId { get; set; }

        public int ShipmentId { get; set; }
        public int StatusId { get; set; }
        public DateTime ChangedAt { get; set; }
        public string? Notes { get; set; }

        [ForeignKey("ShipmentId")]
        public Shipment? Shipment { get; set; }

        [ForeignKey("StatusId")]
        public ShipmentStatus? Status { get; set; }
    }
}