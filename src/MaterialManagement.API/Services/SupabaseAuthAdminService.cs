using System.Text.Json;

namespace MaterialManagement.API.Services;

/// <summary>
/// Supabase Auth Admin API çağrıları (service_role key gerekir).
/// Giriş yapmış/kayıt olmuş tüm auth kullanıcılarını listeler.
/// </summary>
public class SupabaseAuthAdminService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SupabaseAuthAdminService> _logger;

    public SupabaseAuthAdminService(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<SupabaseAuthAdminService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Auth'taki tüm kullanıcıları listeler (sayfalanmış, tüm sayfalar birleştirilir).
    /// Service_role key gerekir; yoksa boş liste döner.
    /// </summary>
    public async Task<List<AuthUserDto>> ListAuthUsersAsync()
    {
        var baseUrl = (_configuration["Supabase:Url"] ?? Environment.GetEnvironmentVariable("SUPABASE_URL"))?.TrimEnd('/');
        var key = _configuration["Supabase:Key"] ?? Environment.GetEnvironmentVariable("SUPABASE_KEY");
        if (string.IsNullOrEmpty(baseUrl) || string.IsNullOrEmpty(key))
            return new List<AuthUserDto>();

        var list = new List<AuthUserDto>();
        var page = 1;
        const int perPage = 1000;

        using var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("apikey", key);
        client.DefaultRequestHeaders.Add("Authorization", "Bearer " + key);

        while (true)
        {
            var url = $"{baseUrl}/auth/v1/admin/users?page={page}&per_page={perPage}";
            try
            {
                var response = await client.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                        _logger.LogWarning("Supabase Auth Admin API: service_role key gerekir (401). Auth kullanıcıları listelenemiyor.");
                    else
                        _logger.LogWarning("Supabase Auth Admin API hatası: {StatusCode}", response.StatusCode);
                    break;
                }

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                if (!root.TryGetProperty("users", out var usersArr))
                    break;

                foreach (var u in usersArr.EnumerateArray())
                {
                    var id = u.TryGetProperty("id", out var idEl) ? idEl.GetString() : null;
                    var email = u.TryGetProperty("email", out var emailEl) ? emailEl.GetString() : null;
                    if (string.IsNullOrEmpty(email)) continue; // anonim vb. atla
                    var createdAt = u.TryGetProperty("created_at", out var createdAtEl) ? createdAtEl.GetString() : null;
                    var meta = u.TryGetProperty("user_metadata", out var metaEl) ? metaEl : (JsonElement?)null;
                    var fullName = meta.HasValue && meta.Value.TryGetProperty("full_name", out var fn) ? fn.GetString() : null;
                    if (string.IsNullOrEmpty(fullName) && meta.HasValue && meta.Value.TryGetProperty("name", out var nameEl))
                        fullName = nameEl.GetString();

                    list.Add(new AuthUserDto
                    {
                        AuthUserId = id,
                        Email = email ?? "",
                        FullName = fullName,
                        CreatedAt = createdAt
                    });
                }

                if (usersArr.GetArrayLength() < perPage)
                    break;
                page++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Auth kullanıcıları listelenirken hata");
                break;
            }
        }

        return list;
    }
}

public class AuthUserDto
{
    public string? AuthUserId { get; set; }
    public string Email { get; set; } = "";
    public string? FullName { get; set; }
    public string? CreatedAt { get; set; }
}
