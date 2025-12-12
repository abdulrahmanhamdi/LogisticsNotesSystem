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
    public class SharedNotesController : ControllerBase
    {
        private readonly LogisticsDbContext _context;

        public SharedNotesController(LogisticsDbContext context)
        {
            _context = context;
        }

        // POST: api/SharedNotes 
        [HttpPost]
        public async Task<ActionResult<SharedNote>> ShareNote(SharedNote sharedNote)
        {
            var exists = await _context.SharedNotes
                .AnyAsync(s => s.NoteId == sharedNote.NoteId && s.SharedWithUserId == sharedNote.SharedWithUserId);

            if (exists) return Conflict(new { message = "Note is already shared with this user." });

            _context.SharedNotes.Add(sharedNote);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetSharedNote", new { id = sharedNote.ShareId }, sharedNote);
        }

        // GET: api/SharedNotes/5 
        [HttpGet("{id}")]
        public async Task<ActionResult<SharedNote>> GetSharedNote(int id)
        {
            var sharedNote = await _context.SharedNotes.FindAsync(id);
            if (sharedNote == null) return NotFound();
            return sharedNote;
        }

        // DELETE: api/SharedNotes/5 
        [HttpDelete("{id}")]
        public async Task<IActionResult> UnshareNote(int id)
        {
            var sharedNote = await _context.SharedNotes.FindAsync(id);
            if (sharedNote == null) return NotFound();

            _context.SharedNotes.Remove(sharedNote);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}