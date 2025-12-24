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
    public class FoldersController : ControllerBase
    {
        private readonly LogisticsDbContext _context;

        public FoldersController(LogisticsDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // ✅ Most important change here: (GetFolders)
        // Now we require UserId and filter the results accordingly
        // ============================================================
        // GET: api/Folders?userId=1
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Folder>>> GetFolders([FromQuery] int userId)
        {
            // Validate that UserId is provided
            if (userId <= 0)
            {
                return BadRequest(new { message = "User ID is required to fetch folders." });
            }

            // Retrieve folders belonging to this user only
            return await _context.Folders
                .Where(f => f.UserId == userId) // <--- This line prevents duplication
                .ToListAsync();
        }

        // GET: api/Folders/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Folder>> GetFolder(int id)
        {
            var folder = await _context.Folders.FindAsync(id);

            if (folder == null)
            {
                return NotFound();
            }

            return folder;
        }

        // PUT: api/Folders/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutFolder(int id, Folder folder)
        {
            if (id != folder.FolderId)
            {
                return BadRequest();
            }

            _context.Entry(folder).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!FolderExists(id))
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

        // POST: api/Folders
        [HttpPost]
        public async Task<ActionResult<Folder>> PostFolder(Folder folder)
        {
            _context.Folders.Add(folder);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetFolder", new { id = folder.FolderId }, folder);
        }

        // DELETE: api/Folders/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFolder(int id)
        {
            var folder = await _context.Folders.FindAsync(id);
            if (folder == null)
            {
                return NotFound();
            }

            _context.Folders.Remove(folder);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool FolderExists(int id)
        {
            return _context.Folders.Any(e => e.FolderId == id);
        }
    }
}
