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
    public class NotesController : ControllerBase
    {
        private readonly LogisticsDbContext _context;

        public NotesController(LogisticsDbContext context)
        {
            _context = context;
        }

        public class NoteInputModel
        {
            public int NoteId { get; set; }
            public int UserId { get; set; }
            public string Title { get; set; }
            public string Content { get; set; }
            public int? CategoryId { get; set; }
            public int? FolderId { get; set; }
            public List<int> TagIds { get; set; } = new List<int>(); 
        }

        // GET: api/Notes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Note>>> GetNotes()
        {
            return await _context.Notes
                .Include(n => n.Category)
                .Include(n => n.Folder)
                .Include(n => n.Tags)
                .ToListAsync();
        }

        // GET: api/Notes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Note>> GetNote(int id)
        {
            var note = await _context.Notes
                .Include(n => n.Category)
                .Include(n => n.Folder)
                .Include(n => n.Tags)
                .FirstOrDefaultAsync(n => n.NoteId == id);

            if (note == null) return NotFound();

            return note;
        }

        // POST: api/Notes
        [HttpPost]
        public async Task<ActionResult<Note>> PostNote(NoteInputModel input)
        {
            var note = new Note
            {
                UserId = input.UserId,
                Title = input.Title,
                Content = input.Content,
                CategoryId = input.CategoryId,
                FolderId = input.FolderId,
                CreatedAt = DateTime.Now
            };

            if (input.TagIds != null && input.TagIds.Any())
            {
                foreach (var tagId in input.TagIds)
                {
                    var tag = await _context.Tags.FindAsync(tagId);
                    if (tag != null) note.Tags.Add(tag);
                }
            }

            _context.Notes.Add(note);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetNote", new { id = note.NoteId }, note);
        }

        // PUT: api/Notes/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutNote(int id, NoteInputModel input)
        {
            if (id != input.NoteId) return BadRequest();

            var existingNote = await _context.Notes
                .Include(n => n.Tags)
                .FirstOrDefaultAsync(n => n.NoteId == id);

            if (existingNote == null) return NotFound();

            existingNote.Title = input.Title;
            existingNote.Content = input.Content;
            existingNote.CategoryId = input.CategoryId;
            existingNote.FolderId = input.FolderId;
            existingNote.ModifiedAt = DateTime.Now;

            existingNote.Tags.Clear();
            if (input.TagIds != null && input.TagIds.Any())
            {
                foreach (var tagId in input.TagIds)
                {
                    var tag = await _context.Tags.FindAsync(tagId);
                    if (tag != null) existingNote.Tags.Add(tag);
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                throw;
            }

            return NoContent();
        }

        // DELETE: api/Notes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNote(int id)
        {
            var note = await _context.Notes.FindAsync(id);
            if (note == null) return NotFound();

            _context.Notes.Remove(note);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}