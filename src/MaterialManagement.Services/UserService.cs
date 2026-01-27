using Microsoft.Extensions.Logging;
using MaterialManagement.Models;

namespace MaterialManagement.Services;

public interface IUserService
{
    Task<List<UserProfile>> GetAllUsersAsync();
    Task<UserProfile?> GetUserByIdAsync(Guid id);
    Task<UserProfile> CreateUserAsync(UserProfile user);
    Task<UserProfile> UpdateUserAsync(Guid id, UserProfile user);
    Task<bool> DeleteUserAsync(Guid id);
    Task<List<Role>> GetAllRolesAsync();
}

public class UserService : IUserService
{
    private readonly SupabaseService _supabaseService;
    private readonly ILogger<UserService> _logger;

    public UserService(SupabaseService supabaseService, ILogger<UserService> logger)
    {
        _supabaseService = supabaseService;
        _logger = logger;
    }

    public async Task<List<UserProfile>> GetAllUsersAsync()
    {
        try
        {
            var response = await _supabaseService.Client
                .From<UserProfile>()
                .Order("full_name", Supabase.Postgrest.Constants.Ordering.Ascending)
                .Get();
            
            return response.Models;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all users");
            throw;
        }
    }

    public async Task<UserProfile?> GetUserByIdAsync(Guid id)
    {
        try
        {
            var response = await _supabaseService.Client
                .From<UserProfile>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Single();
            
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by id: {Id}", id);
            return null;
        }
    }

    public async Task<UserProfile> CreateUserAsync(UserProfile user)
    {
        try
        {
            if (user.Id == Guid.Empty)
            {
                user.Id = Guid.NewGuid();
            }
            
            user.CreatedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            
            var response = await _supabaseService.Client
                .From<UserProfile>()
                .Insert(user);
            
            return response.Models.First();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user: {Message}", ex.Message);
            throw;
        }
    }

    public async Task<UserProfile> UpdateUserAsync(Guid id, UserProfile user)
    {
        try
        {
            user.Id = id;
            user.UpdatedAt = DateTime.UtcNow;
            
            var response = await _supabaseService.Client
                .From<UserProfile>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Update(user);
            
            return response.Models.First();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user: {Id}", id);
            throw;
        }
    }

    public async Task<bool> DeleteUserAsync(Guid id)
    {
        try
        {
            await _supabaseService.Client
                .From<UserProfile>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Delete();
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user: {Id}", id);
            return false;
        }
    }

    public async Task<List<Role>> GetAllRolesAsync()
    {
        try
        {
            var response = await _supabaseService.Client
                .From<Role>()
                .Order("name", Supabase.Postgrest.Constants.Ordering.Ascending)
                .Get();
            
            return response.Models;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all roles");
            throw;
        }
    }
}
