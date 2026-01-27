using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace MaterialManagement.Models;

[Table("projects")]
public class Project : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }
    
    [Column("company_id")]
    public Guid CompanyId { get; set; }
    
    [Column("name")]
    public string Name { get; set; } = string.Empty;
    
    [Column("description")]
    public string? Description { get; set; }
    
    [Column("status")]
    public string Status { get; set; } = "active";
    
    [Column("start_date")]
    public DateTime? StartDate { get; set; }
    
    [Column("end_date")]
    public DateTime? EndDate { get; set; }
    
    [Column("created_by")]
    public Guid? CreatedBy { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
