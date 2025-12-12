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
    [Route("api/[controller]")]
    [ApiController]
    public class ShipmentsController : ControllerBase
    {
        private readonly LogisticsDbContext _context;

        public ShipmentsController(LogisticsDbContext context)
        {
            _context = context;
        }

        // GET: api/Shipments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Shipment>>> GetShipments()
        {
            return await _context.Shipments.ToListAsync();
        }

        // GET: api/Shipments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Shipment>> GetShipment(int id)
        {
            var shipment = await _context.Shipments.FindAsync(id);

            if (shipment == null)
            {
                return NotFound();
            }

            return shipment;
        }

        // PUT: api/Shipments/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        // PUT: api/Shipments/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutShipment(int id, Shipment shipment)
        {
            if (id != shipment.ShipmentId)
                return BadRequest();

            // --- Safe update block to prevent crashes ---
            try
            {
                // Try to load the service type to calculate cost
                var service = await _context.ServiceTypes.FindAsync(shipment.ServiceTypeId);

                // Check service availability (prevents NullReferenceException)
                if (service != null)
                {
                    // Safe cost calculation
                    shipment.ShippingCost = service.BasePrice + (shipment.Weight * service.PricePerKg);
                }
                else
                {
                    // If service type is missing, avoid crash → fallback to zero
                    shipment.ShippingCost = 0;
                }

                _context.Entry(shipment).State = EntityState.Modified;

                // Add history log
                var history = new DeliveryHistory
                {
                    ShipmentId = shipment.ShipmentId,
                    StatusId = shipment.CurrentStatusId,
                    ChangedAt = DateTime.Now,
                    Notes = $"Updated. Cost: ${shipment.ShippingCost}"
                };
                _context.DeliveryHistories.Add(history);

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Return clear server-side error message instead of freezing
                if (!ShipmentExists(id))
                    return NotFound();
                else
                    return StatusCode(500, $"Internal Server Error: {ex.Message}");
            }
            // --- End safe update block ---

            return NoContent();
        }


        // POST: api/Shipments
        [HttpPost]
        public async Task<ActionResult<Shipment>> PostShipment(Shipment shipment)
        {
            try
            {
                // Load service type to calculate cost
                var service = await _context.ServiceTypes.FindAsync(shipment.ServiceTypeId);

                if (service != null)
                {
                    shipment.ShippingCost = service.BasePrice + (shipment.Weight * service.PricePerKg);
                }
                else
                {
                    shipment.ShippingCost = 0;
                }

                _context.Shipments.Add(shipment);
                await _context.SaveChangesAsync();

                // Auto-create initial tracking history
                var history = new DeliveryHistory
                {
                    ShipmentId = shipment.ShipmentId,
                    StatusId = shipment.CurrentStatusId,
                    ChangedAt = DateTime.Now,
                    Notes = $"Created. Cost: ${shipment.ShippingCost}"
                };
                _context.DeliveryHistories.Add(history);

                await _context.SaveChangesAsync();

                return CreatedAtAction("GetShipment", new { id = shipment.ShipmentId }, shipment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error creating shipment: {ex.Message}");
            }
        }


        // DELETE: api/Shipments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteShipment(int id)
        {
            var shipment = await _context.Shipments.FindAsync(id);
            if (shipment == null)
            {
                return NotFound();
            }

            _context.Shipments.Remove(shipment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // --- NEW METHOD: Get History for a specific Shipment ---
        // GET: api/Shipments/5/History
        [HttpGet("{id}/History")]
        public async Task<ActionResult<IEnumerable<object>>> GetShipmentHistory(int id)
        {
            var history = await _context.DeliveryHistories
                .Where(h => h.ShipmentId == id)
                .Include(h => h.Status) // Include Status to get the name
                .OrderByDescending(h => h.ChangedAt) // Newest first
                .Select(h => new
                {
                    h.HistoryId,
                    StatusName = h.Status.StatusName,
                    h.ChangedAt,
                    h.Notes
                })
                .ToListAsync();

            return history;
        }

        private bool ShipmentExists(int id)
        {
            return _context.Shipments.Any(e => e.ShipmentId == id);
        }
    }
}