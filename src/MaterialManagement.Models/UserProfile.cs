using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace MaterialManagement.Models;

[Table("user_profiles")]
public class UserProfile : BaseModel
{
    [PrimaryKey("id", true)]
    public Guid Id { get; set; }
    
    [Column("email")]
    public string Email { get; set; } = string.Empty;
    
    [Column("full_name")]
    public string? FullName { get; set; }
    
    [Column("role_id")]
    public Guid? RoleId { get; set; }
    
    [Column("company_id")]
    public Guid? CompanyId { get; set; }
    
    [Column("phone")]
    public string? Phone { get; set; }
    
    [Column("is_active")]
    public bool IsActive { get; set; } = true;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
