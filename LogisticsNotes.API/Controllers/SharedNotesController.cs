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
    public class SharedNotesController : ControllerBase
    {
        private readonly LogisticsDbContext _context;

        public SharedNotesController(LogisticsDbContext context)
        {
            _context = context;
        }

        // GET: api/SharedNotes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SharedNote>>> GetSharedNotes()
        {
            return await _context.SharedNotes.ToListAsync();
        }

        // GET: api/SharedNotes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<SharedNote>> GetSharedNote(int id)
        {
            var sharedNote = await _context.SharedNotes.FindAsync(id);

            if (sharedNote == null)
            {
                return NotFound();
            }

            return sharedNote;
        }

        // PUT: api/SharedNotes/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSharedNote(int id, SharedNote sharedNote)
        {
            if (id != sharedNote.ShareId)
            {
                return BadRequest();
            }

            _context.Entry(sharedNote).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SharedNoteExists(id))
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

        // POST: api/SharedNotes
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<SharedNote>> PostSharedNote(SharedNote sharedNote)
        {
            _context.SharedNotes.Add(sharedNote);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetSharedNote", new { id = sharedNote.ShareId }, sharedNote);
        }

        // DELETE: api/SharedNotes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSharedNote(int id)
        {
            var sharedNote = await _context.SharedNotes.FindAsync(id);
            if (sharedNote == null)
            {
                return NotFound();
            }

            _context.SharedNotes.Remove(sharedNote);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool SharedNoteExists(int id)
        {
            return _context.SharedNotes.Any(e => e.ShareId == id);
        }
    }
}
