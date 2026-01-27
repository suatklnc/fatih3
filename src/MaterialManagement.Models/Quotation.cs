using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

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
    
    public MaterialRequest? Request { get; set; }
    public Supplier? Supplier { get; set; }
    public UserProfile? SubmittedByUser { get; set; }
    public UserProfile? ApprovedByUser { get; set; }
    public List<QuotationItem> Items { get; set; } = new();
}
