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
    public class ShipmentStatusController : ControllerBase
    {
        private readonly LogisticsDbContext _context;

        public ShipmentStatusController(LogisticsDbContext context)
        {
            _context = context;
        }

        // GET: api/ShipmentStatus
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ShipmentStatus>>> GetShipmentStatuses()
        {
            return await _context.ShipmentStatuses.ToListAsync();
        }

        // GET: api/ShipmentStatus/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ShipmentStatus>> GetShipmentStatus(int id)
        {
            var shipmentStatus = await _context.ShipmentStatuses.FindAsync(id);

            if (shipmentStatus == null)
            {
                return NotFound();
            }

            return shipmentStatus;
        }

        // PUT: api/ShipmentStatus/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutShipmentStatus(int id, ShipmentStatus shipmentStatus)
        {
            if (id != shipmentStatus.StatusId)
            {
                return BadRequest();
            }

            _context.Entry(shipmentStatus).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ShipmentStatusExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/ShipmentStatus
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<ShipmentStatus>> PostShipmentStatus(ShipmentStatus shipmentStatus)
        {
            _context.ShipmentStatuses.Add(shipmentStatus);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetShipmentStatus", new { id = shipmentStatus.StatusId }, shipmentStatus);
        }

        // DELETE: api/ShipmentStatus/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteShipmentStatus(int id)
        {
            var shipmentStatus = await _context.ShipmentStatuses.FindAsync(id);
            if (shipmentStatus == null)
            {
                return NotFound();
            }

            _context.ShipmentStatuses.Remove(shipmentStatus);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ShipmentStatusExists(int id)
        {
            return _context.ShipmentStatuses.Any(e => e.StatusId == id);
        }
    }
}
