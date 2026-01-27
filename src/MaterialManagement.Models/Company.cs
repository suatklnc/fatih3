using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace MaterialManagement.Models;

[Table("companies")]
public class Company : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }
    
    [Column("name")]
    public string Name { get; set; } = string.Empty;
    
    [Column("tax_number")]
    public string? TaxNumber { get; set; }
    
    [Column("address")]
    public string? Address { get; set; }
    
    [Column("phone")]
    public string? Phone { get; set; }
    
    [Column("email")]
    public string? Email { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
