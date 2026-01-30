using Microsoft.Extensions.Logging;
using MaterialManagement.Models;

namespace MaterialManagement.Services;

public interface IUserService
{
    Task<List<UserProfile>> GetAllUsersAsync();
    Task<UserProfile?> GetUserByIdAsync(Guid id);
    Task<UserProfile?> GetUserByEmailAsync(string email);
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

    private static readonly string[] SuperAdminEmails = { "suatkilinc0102@gmail.com", "ozbakanfatih@gmail.com" };

    public async Task<UserProfile?> GetUserByEmailAsync(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return null;
        try
        {
            var response = await _supabaseService.Client
                .From<UserProfile>()
                .Filter("email", Supabase.Postgrest.Constants.Operator.Equals, email.Trim())
                .Get();
            var existing = response.Models.FirstOrDefault();
            if (existing != null) return existing;

            var emailLower = email.Trim().ToLowerInvariant();
            if (!SuperAdminEmails.Any(e => e.Equals(emailLower, StringComparison.OrdinalIgnoreCase)))
                return null;

            await EnsureRolesExistAsync();
            var roles = await GetAllRolesAsync();
            var patronRole = roles.FirstOrDefault(r => r.Name == "Patron");
            if (patronRole == null) return null;

            var newProfile = new UserProfile
            {
                Id = Guid.NewGuid(),
                Email = email.Trim(),
                FullName = "Tam Yetkili Kullanıcı",
                RoleId = patronRole.Id,
                CompanyId = null,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            var insert = await _supabaseService.Client.From<UserProfile>().Insert(newProfile);
            return insert.Models.First();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting/creating user by email: {Email}", email);
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
            
            // Rol mantığı
            await EnsureRolesExistAsync();
            var roles = await GetAllRolesAsync();
            
            if (SuperAdminEmails.Any(e => e.Equals(user.Email?.Trim(), StringComparison.OrdinalIgnoreCase)))
            {
                var patronRole = roles.FirstOrDefault(r => r.Name == "Patron");
                if (patronRole != null) user.RoleId = patronRole.Id;
            }
            else
            {
                // Yeni kayıt / rol atanmamış: Personel (sıradan kullanıcı)
                if (!user.RoleId.HasValue || user.RoleId == Guid.Empty)
                {
                    var personelRole = roles.FirstOrDefault(r => r.Name == "Personel");
                    if (personelRole != null) user.RoleId = personelRole.Id;
                }
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

    private async Task EnsureRolesExistAsync()
    {
        try 
        {
            var roles = await GetAllRolesAsync();
            var requiredRoles = new[] { "Patron", "Yönetici", "Satın Alma", "Personel" };
            
            foreach (var roleName in requiredRoles)
            {
                if (!roles.Any(r => r.Name == roleName))
                {
                    var newRole = new Role
                    {
                        Id = Guid.NewGuid(),
                        Name = roleName,
                        Description = roleName == "Personel" ? "Standart kullanıcı" : "Yetkili kullanıcı",
                        CreatedAt = DateTime.UtcNow
                    };
                    await _supabaseService.Client.From<Role>().Insert(newRole);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking/seeding roles");
            // Devam et, belki roller vardır ama okuyamadık
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
