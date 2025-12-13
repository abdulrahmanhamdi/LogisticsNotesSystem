namespace LogisticsNotes.API.DTOs
{
    public class ShipmentDto
    {

        public int ShipmentId { get; set; }
        public int SenderId { get; set; }
        public int OriginBranchId { get; set; }
        public int DestinationBranchId { get; set; }
        public int ServiceTypeId { get; set; }
        public int CurrentStatusId { get; set; }
        public string? Description { get; set; }
        public double Weight { get; set; }
        public DateTime? EstimatedDeliveryDate { get; set; }
        public int? AssignedCourierId { get; set; }

        // هذا هو الحقل الذي تحتاجه لتعديل السعر يدوياً
        public double ShippingCost { get; set; }
    }
}