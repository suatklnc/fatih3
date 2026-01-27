using Supabase;
using Microsoft.Extensions.Logging;
using MaterialManagement.Models;

namespace MaterialManagement.Services;

public class SupabaseService
{
    private readonly Client _client;
    private readonly ILogger<SupabaseService> _logger;

    public SupabaseService(Client client, ILogger<SupabaseService> logger)
    {
        _client = client;
        _logger = logger;
    }

    public Client Client => _client;
}
