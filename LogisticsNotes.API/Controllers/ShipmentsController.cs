using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LogisticsNotes.API.Models;

namespace LogisticsNotes.API.Controllers
{
    public class StatusUpdateModel
    {
        public int ShipmentId { get; set; }
        public int NewStatusId { get; set; }
        public string? Notes { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class ShipmentsController : ControllerBase
    {
        private readonly LogisticsDbContext _context;

        public ShipmentsController(LogisticsDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Shipment>>> GetShipments()
        {
            return await _context.Shipments
                .Include(s => s.OriginBranch)
                .Include(s => s.DestinationBranch)
                .Include(s => s.ServiceType)
                .Include(s => s.CurrentStatus)
                .Include(s => s.AssignedCourier)
                    .ThenInclude(c => c.User)
                .Include(s => s.AssignedCourier)
                    .ThenInclude(c => c.Vehicle)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Shipment>> GetShipment(int id)
        {
            var shipment = await _context.Shipments
                .Include(s => s.OriginBranch)
                .Include(s => s.DestinationBranch)
                .Include(s => s.ServiceType)
                .Include(s => s.CurrentStatus)
                .FirstOrDefaultAsync(s => s.ShipmentId == id);

            if (shipment == null)
            {
                return NotFound();
            }

            return shipment;
        }

        [HttpPost]
        public async Task<ActionResult<Shipment>> PostShipment(Shipment shipment)
        {
            shipment.SendingDate = DateTime.Now;

            var service = await _context.ServiceTypes.FindAsync(shipment.ServiceTypeId);
            if (service != null)
            {
                shipment.ShippingCost = service.BasePrice + (service.PricePerKg * shipment.Weight);
            }

            _context.Shipments.Add(shipment);
            await _context.SaveChangesAsync();

            var initialHistory = new DeliveryHistory
            {
                ShipmentId = shipment.ShipmentId,
                StatusId = shipment.CurrentStatusId,
                ChangedAt = DateTime.Now,
                Notes = "Shipment created automatically by system."
            };

            _context.DeliveryHistories.Add(initialHistory);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetShipment", new { id = shipment.ShipmentId }, shipment);
        }

        [HttpPost("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus([FromBody] StatusUpdateModel model)
        {
            var shipment = await _context.Shipments.FindAsync(model.ShipmentId);
            if (shipment == null) return NotFound("Shipment not found.");

            shipment.CurrentStatusId = model.NewStatusId;

            if (model.NewStatusId == 5)
            {
                shipment.DeliveredAt = DateTime.Now;
            }

            var history = new DeliveryHistory
            {
                ShipmentId = model.ShipmentId,
                StatusId = model.NewStatusId,
                ChangedAt = DateTime.Now,
                Notes = model.Notes
            };

            _context.DeliveryHistories.Add(history);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Status updated and history recorded." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutShipment(int id, Shipment shipment)
        {
            if (id != shipment.ShipmentId) return BadRequest();

            _context.Entry(shipment).State = EntityState.Modified;
            _context.Entry(shipment).Property(x => x.SendingDate).IsModified = false;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ShipmentExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteShipment(int id)
        {
            var shipment = await _context.Shipments.FindAsync(id);
            if (shipment == null) return NotFound();

            _context.Shipments.Remove(shipment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id}/History")]
        public async Task<ActionResult<IEnumerable<dynamic>>> GetShipmentHistory(int id)
        {
            var history = await _context.DeliveryHistories
                .Where(h => h.ShipmentId == id)
                .Include(h => h.Status)
                .OrderByDescending(h => h.ChangedAt)
                .Select(h => new
                {
                    h.HistoryId,
                    h.ChangedAt,
                    StatusName = h.Status.StatusName,
                    h.Notes
                })
                .ToListAsync();

            return Ok(history);
        }

        private bool ShipmentExists(int id)
        {
            return _context.Shipments.Any(e => e.ShipmentId == id);
        }
    }
}
