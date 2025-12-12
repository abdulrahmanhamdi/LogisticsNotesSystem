using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LogisticsNotes.API.Models;

namespace LogisticsNotes.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ShipmentStatusesController : ControllerBase
    {
        private readonly LogisticsDbContext _context;

        public ShipmentStatusesController(LogisticsDbContext context)
        {
            _context = context;
        }

        // GET: api/ShipmentStatuses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ShipmentStatus>>> GetShipmentStatuses()
        {
            return await _context.ShipmentStatuses.ToListAsync();
        }
    }
}