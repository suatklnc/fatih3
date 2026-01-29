using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using Newtonsoft.Json;

namespace MaterialManagement.Models;

[Table("quotations")]
public class Quotation : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }
    
    [Column("request_id")]
    public Guid RequestId { get; set; }
    
    [Column("supplier_id")]
    public Guid SupplierId { get; set; }
    
    [Column("quotation_number")]
    public string QuotationNumber { get; set; } = string.Empty;
    
    [Column("quotation_date")]
    public DateTime QuotationDate { get; set; } = DateTime.Today;
    
    [Column("valid_until")]
    public DateTime? ValidUntil { get; set; }
    
    [Column("status")]
    public string Status { get; set; } = "pending";
    
    [Column("total_amount")]
    public decimal? TotalAmount { get; set; }
    
    [Column("currency")]
    public string Currency { get; set; } = "TRY";
    
    [Column("notes")]
    public string? Notes { get; set; }
    
    [Column("submitted_by")]
    public Guid? SubmittedBy { get; set; }
    
    [Column("approved_by")]
    public Guid? ApprovedBy { get; set; }
    
    [Column("approved_at")]
    public DateTime? ApprovedAt { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties - not mapped to database
    [JsonIgnore]
    public MaterialRequest? Request { get; set; }
    
    [JsonIgnore]
    public Supplier? Supplier { get; set; }
    
    [JsonIgnore]
    public UserProfile? SubmittedByUser { get; set; }
    
    [JsonIgnore]
    public UserProfile? ApprovedByUser { get; set; }
    
    [JsonIgnore]
    public List<QuotationItem> Items { get; set; } = new();
}
