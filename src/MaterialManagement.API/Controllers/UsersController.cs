using Microsoft.AspNetCore.Mvc;
using MaterialManagement.Models;
using MaterialManagement.Services;

namespace MaterialManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
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

    [HttpGet("{id}")]
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

    [HttpPut("{id}")]
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

    [HttpDelete("{id}")]
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
