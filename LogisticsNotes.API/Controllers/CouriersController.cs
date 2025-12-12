using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LogisticsNotes.API.Models;

namespace LogisticsNotes.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CouriersController : ControllerBase
    {
        private readonly LogisticsDbContext _context;

        public CouriersController(LogisticsDbContext context)
        {
            _context = context;
        }

        // GET: api/Couriers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Courier>>> GetCouriers()
        {
            return await _context.Couriers
                .Include(c => c.User)
                .Include(c => c.Vehicle) 
                .Include(c => c.CurrentBranch)
                .ToListAsync();
        }

        // GET: api/Couriers/ByUserId/5 
        [HttpGet("ByUserId/{userId}")]
        public async Task<ActionResult<Courier>> GetCourierByUserId(int userId)
        {
            var courier = await _context.Couriers
                .Include(c => c.Vehicle)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (courier == null) return NoContent();

            return courier;
        }

        // POST: api/Couriers
        [HttpPost]
        public async Task<ActionResult<Courier>> UpsertCourier(Courier courier)
        {
            var existingCourier = await _context.Couriers
                .FirstOrDefaultAsync(c => c.UserId == courier.UserId);

            if (existingCourier != null)
            {
                existingCourier.LicenseNumber = courier.LicenseNumber;
                existingCourier.VehicleId = courier.VehicleId;
                existingCourier.ShiftStart = courier.ShiftStart;
                existingCourier.ShiftEnd = courier.ShiftEnd;
                existingCourier.CurrentBranchId = courier.CurrentBranchId;

                _context.Entry(existingCourier).State = EntityState.Modified;
            }
            else
            {
                courier.IsActive = true;

                _context.Couriers.Add(courier);
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                return BadRequest(new { message = ex.InnerException?.Message ?? ex.Message });
            }

            return Ok(courier);
        }
        // DELETE: api/Couriers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourier(int id)
        {
            var courier = await _context.Couriers.FindAsync(id);
            if (courier == null) return NotFound();

            _context.Couriers.Remove(courier);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}