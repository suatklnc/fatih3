using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using Newtonsoft.Json;

namespace MaterialManagement.Models;

[Table("material_requests")]
public class MaterialRequest : BaseModel
{
    [PrimaryKey("id", true)]
    public Guid Id { get; set; }
    
    [Column("project_id")]
    public Guid ProjectId { get; set; }
    
    [Column("requested_by")]
    public Guid RequestedBy { get; set; }
    
    [Column("request_number")]
    public string RequestNumber { get; set; } = string.Empty;
    
    [Column("status")]
    public string Status { get; set; } = "pending";
    
    [Column("priority")]
    public string Priority { get; set; } = "normal";
    
    [Column("request_date")]
    public DateTime RequestDate { get; set; } = DateTime.Today;
    
    [Column("required_date")]
    public DateTime? RequiredDate { get; set; }
    
    [Column("notes")]
    public string? Notes { get; set; }
    
    [Column("approved_by")]
    public Guid? ApprovedBy { get; set; }
    
    [Column("approved_at")]
    public DateTime? ApprovedAt { get; set; }
    
    [Column("sent_to_purchasing_at")]
    public DateTime? SentToPurchasingAt { get; set; }
    
    [Column("sent_to_purchasing_by")]
    public Guid? SentToPurchasingBy { get; set; }
    
    [Column("sent_to_suppliers_at")]
    public DateTime? SentToSuppliersAt { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties - not stored in database
    [JsonIgnore]
    public Project? Project { get; set; }
    
    [JsonIgnore]
    public UserProfile? RequestedByUser { get; set; }
    
    [JsonIgnore]
    public UserProfile? ApprovedByUser { get; set; }
    
    [JsonIgnore]
    public List<MaterialRequestItem> Items { get; set; } = new();
}


