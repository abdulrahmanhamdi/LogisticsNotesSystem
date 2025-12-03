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
    public class DeliveryHistoriesController : ControllerBase
    {
        private readonly LogisticsDbContext _context;

        public DeliveryHistoriesController(LogisticsDbContext context)
        {
            _context = context;
        }

        // GET: api/DeliveryHistories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DeliveryHistory>>> GetDeliveryHistories()
        {
            return await _context.DeliveryHistories.ToListAsync();
        }

        // GET: api/DeliveryHistories/5
        [HttpGet("{id}")]
        public async Task<ActionResult<DeliveryHistory>> GetDeliveryHistory(int id)
        {
            var deliveryHistory = await _context.DeliveryHistories.FindAsync(id);

            if (deliveryHistory == null)
            {
                return NotFound();
            }

            return deliveryHistory;
        }

        // PUT: api/DeliveryHistories/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDeliveryHistory(int id, DeliveryHistory deliveryHistory)
        {
            if (id != deliveryHistory.HistoryId)
            {
                return BadRequest();
            }

            _context.Entry(deliveryHistory).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!DeliveryHistoryExists(id))
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

        // POST: api/DeliveryHistories
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<DeliveryHistory>> PostDeliveryHistory(DeliveryHistory deliveryHistory)
        {
            _context.DeliveryHistories.Add(deliveryHistory);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetDeliveryHistory", new { id = deliveryHistory.HistoryId }, deliveryHistory);
        }

        // DELETE: api/DeliveryHistories/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDeliveryHistory(int id)
        {
            var deliveryHistory = await _context.DeliveryHistories.FindAsync(id);
            if (deliveryHistory == null)
            {
                return NotFound();
            }

            _context.DeliveryHistories.Remove(deliveryHistory);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool DeliveryHistoryExists(int id)
        {
            return _context.DeliveryHistories.Any(e => e.HistoryId == id);
        }
    }
}
