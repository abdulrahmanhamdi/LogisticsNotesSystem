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
        [HttpPut("{id}")]
        public async Task<IActionResult> PutShipment(int id, Shipment shipment)
        {
            if (id != shipment.ShipmentId) return BadRequest();

            _context.Entry(shipment).State = EntityState.Modified;

            // --- Logic to auto-save history on update ---
            var history = new DeliveryHistory
            {
                ShipmentId = shipment.ShipmentId,
                StatusId = shipment.CurrentStatusId,
                ChangedAt = DateTime.Now,
                Notes = "Status updated via System"
            };
            _context.DeliveryHistories.Add(history);

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

        // POST: api/Shipments
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Shipment>> PostShipment(Shipment shipment)
        {
            _context.Shipments.Add(shipment);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetShipment", new { id = shipment.ShipmentId }, shipment);
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