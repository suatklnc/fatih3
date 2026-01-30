using Microsoft.AspNetCore.Mvc;
using MaterialManagement.Models;
using MaterialManagement.Services;
using MaterialManagement.API.Services;

namespace MaterialManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly SupabaseAuthAdminService _authAdminService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, SupabaseAuthAdminService authAdminService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _authAdminService = authAdminService;
        _logger = logger;
    }

    /// <summary>
    /// Tüm kullanıcıları getirir: user_profiles + Supabase Auth'ta giriş/kayıt olmuş ama henüz yetkisi atanmamış hesaplar.
    /// Tam yetkili kullanıcılar bu listeden yetki verebilir veya silebilir.
    /// </summary>
    [HttpGet("with-auth")]
    public async Task<ActionResult<object>> GetAllWithAuth()
    {
        try
        {
            var profiles = await _userService.GetAllUsersAsync();
            var roles = await _userService.GetAllRolesAsync();
            var authUsers = await _authAdminService.ListAuthUsersAsync();
            var profileByEmail = profiles
                .Where(p => !string.IsNullOrWhiteSpace(p.Email))
                .GroupBy(p => p.Email.Trim().ToLowerInvariant())
                .ToDictionary(g => g.Key, g => g.First());

            var result = new List<object>();
            var addedEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var auth in authUsers.OrderBy(a => a.Email, StringComparer.OrdinalIgnoreCase))
            {
                var emailKey = auth.Email.Trim().ToLowerInvariant();
                if (addedEmails.Contains(emailKey)) continue;
                addedEmails.Add(emailKey);

                if (profileByEmail.TryGetValue(emailKey, out var profile))
                {
                    result.Add(new
                    {
                        profile.Id,
                        AuthUserId = auth.AuthUserId,
                        profile.Email,
                        profile.FullName,
                        profile.RoleId,
                        RoleName = roles.FirstOrDefault(r => r.Id == profile.RoleId)?.Name,
                        profile.CompanyId,
                        profile.Phone,
                        profile.IsActive,
                        profile.CreatedAt,
                        profile.UpdatedAt,
                        HasProfile = true
                    });
                }
                else
                {
                    result.Add(new
                    {
                        Id = (Guid?)null,
                        AuthUserId = auth.AuthUserId,
                        Email = auth.Email,
                        FullName = auth.FullName ?? auth.Email,
                        RoleId = (Guid?)null,
                        RoleName = (string?)null,
                        CompanyId = (Guid?)null,
                        Phone = (string?)null,
                        IsActive = true,
                        CreatedAt = auth.CreatedAt,
                        UpdatedAt = (DateTime?)null,
                        HasProfile = false
                    });
                }
            }

            foreach (var profile in profiles.Where(p => !string.IsNullOrWhiteSpace(p.Email)))
            {
                var emailKey = profile.Email.Trim().ToLowerInvariant();
                if (addedEmails.Contains(emailKey)) continue;
                addedEmails.Add(emailKey);
                result.Add(new
                {
                    profile.Id,
                    AuthUserId = (string?)null,
                    profile.Email,
                    profile.FullName,
                    profile.RoleId,
                    RoleName = roles.FirstOrDefault(r => r.Id == profile.RoleId)?.Name,
                    profile.CompanyId,
                    profile.Phone,
                    profile.IsActive,
                    profile.CreatedAt,
                    profile.UpdatedAt,
                    HasProfile = true
                });
            }

            result = result.OrderBy(x =>
            {
                var el = System.Text.Json.JsonSerializer.SerializeToElement(x);
                return el.TryGetProperty("email", out var e) ? e.GetString() ?? "" : "";
            }, StringComparer.OrdinalIgnoreCase).ToList();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users with auth");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetAll()
    {
        try
        {
            var users = await _userService.GetAllUsersAsync();
            var roles = await _userService.GetAllRolesAsync();
            
            var result = users.Select(u => new
            {
                u.Id,
                u.Email,
                u.FullName,
                u.RoleId,
                RoleName = roles.FirstOrDefault(r => r.Id == u.RoleId)?.Name,
                u.CompanyId,
                u.Phone,
                u.IsActive,
                u.CreatedAt,
                u.UpdatedAt
            }).ToList();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all users");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("by-email")]
    public async Task<ActionResult<object>> GetByEmail([FromQuery(Name = "email")] string? emailParam)
    {
        var email = !string.IsNullOrWhiteSpace(emailParam)
            ? emailParam
            : (Request.Query["email"].ToString() ?? Request.Query["Email"].ToString());
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { message = "email gerekli" });
        try
        {
            var user = await _userService.GetUserByEmailAsync(email.Trim());
            if (user == null)
                return NotFound();
            var roles = await _userService.GetAllRolesAsync();
            return Ok(new
            {
                user.Id,
                user.Email,
                user.FullName,
                user.RoleId,
                RoleName = roles.FirstOrDefault(r => r.Id == user.RoleId)?.Name,
                user.CompanyId,
                user.Phone,
                user.IsActive,
                user.CreatedAt,
                user.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by email: {Email}", email);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<object>> GetById(Guid id)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
                return NotFound();
            
            var roles = await _userService.GetAllRolesAsync();
            
            return Ok(new
            {
                user.Id,
                user.Email,
                user.FullName,
                user.RoleId,
                RoleName = roles.FirstOrDefault(r => r.Id == user.RoleId)?.Name,
                user.CompanyId,
                user.Phone,
                user.IsActive,
                user.CreatedAt,
                user.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user: {Id}", id);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] UserProfile user)
    {
        try
        {
            var created = await _userService.CreateUserAsync(user);
            return Ok(new
            {
                created.Id,
                created.Email,
                created.FullName,
                created.RoleId,
                created.CompanyId,
                created.Phone,
                created.IsActive,
                created.CreatedAt,
                created.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user: {Message}", ex.Message);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<object>> Update(Guid id, [FromBody] UserProfile user)
    {
        try
        {
            var updated = await _userService.UpdateUserAsync(id, user);
            return Ok(new
            {
                updated.Id,
                updated.Email,
                updated.FullName,
                updated.RoleId,
                updated.CompanyId,
                updated.Phone,
                updated.IsActive,
                updated.CreatedAt,
                updated.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user: {Id}", id);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var result = await _userService.DeleteUserAsync(id);
            if (!result)
                return NotFound();
            
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user: {Id}", id);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("roles")]
    public async Task<ActionResult<object>> GetRoles()
    {
        try
        {
            var roles = await _userService.GetAllRolesAsync();
            var result = roles.Select(r => new
            {
                r.Id,
                r.Name,
                r.Description,
                r.CreatedAt
            }).ToList();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all roles");
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
