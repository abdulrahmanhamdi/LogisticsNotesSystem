using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LogisticsNotes.API.Models;

namespace LogisticsNotes.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly LogisticsDbContext _context;

        public UsersController(LogisticsDbContext context)
        {
            _context = context;
        }

        // POST: api/Users/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // Authenticate user by email and password hash
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.PasswordHash == request.Password);

            if (user == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            return Ok(user);
        }

        public class LoginRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            // Retrieve all users including their roles
            return await _context.Users
                .Include(u => u.Role)
                .ToListAsync();
        }

        // GET: api/Users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            // Retrieve a specific user by ID
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
            {
                return NotFound();
            }

            return user;
        }

        // POST: api/Users
        [HttpPost]
        public async Task<ActionResult<User>> PostUser(User user)
        {
            // 1. Check if the Manual ID already exists
            if (UserExists(user.UserId))
            {
                return Conflict(new { message = $"User ID {user.UserId} already exists!" });
            }

            // 2. Ensure Email uniqueness
            if (await _context.Users.AnyAsync(u => u.Email == user.Email))
            {
                return BadRequest(new { message = "Email already exists." });
            }

            // Set default creation date if not provided
            if (user.CreatedAt == null) user.CreatedAt = DateTime.Now;

            _context.Users.Add(user);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }

            // 3. SMART FOLDER INITIALIZATION: Check for existing folder names to prevent duplication
            var existingFolderNames = await _context.Folders
                .Where(f => f.UserId == user.UserId)
                .Select(f => f.FolderName.Trim().ToLower()) // Get normalized names
                .ToListAsync();

            var defaultFoldersToCreate = new List<Folder>();
            string[] defaultNames = { "My Orders", "Complaints", "Personal Notes" };
            string[] defaultColors = { "#FF5733", "#C70039", "#28A745" };

            for (int i = 0; i < defaultNames.Length; i++)
            {
                string normalizedName = defaultNames[i].Trim().ToLower();

                // Check if the normalized name already exists
                if (!existingFolderNames.Contains(normalizedName))
                {
                    defaultFoldersToCreate.Add(new Folder
                    {
                        UserId = user.UserId,
                        FolderName = defaultNames[i],
                        IsArchived = false,
                        ColorCode = defaultColors[i]
                    });
                }
            }

            if (defaultFoldersToCreate.Any())
            {
                _context.Folders.AddRange(defaultFoldersToCreate);
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetUser), new { id = user.UserId }, user);
        }

        // PUT: api/Users/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(int id, User user)
        {
            if (id != user.UserId)
            {
                return BadRequest();
            }

            _context.Entry(user).State = EntityState.Modified;

            // Protect CreatedAt field from being updated
            _context.Entry(user).Property(x => x.CreatedAt).IsModified = false;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserExists(id))
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

        // DELETE: api/Users/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // SAFE DELETE LOGIC: Handle dependencies before deleting the user
            var courier = await _context.Couriers.FirstOrDefaultAsync(c => c.UserId == id);
            if (courier != null)
            {
                // Unbind shipments from this courier to avoid Foreign Key conflicts
                var relatedShipments = await _context.Shipments
                    .Where(s => s.AssignedCourierId == courier.CourierId)
                    .ToListAsync();

                foreach (var shipment in relatedShipments)
                {
                    shipment.AssignedCourierId = null;
                }

                await _context.SaveChangesAsync();
            }

            // Notes, Folders, and Courier record will be deleted via SQL CASCADE
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool UserExists(int id)
        {
            return _context.Users.Any(e => e.UserId == id);
        }
    }
}