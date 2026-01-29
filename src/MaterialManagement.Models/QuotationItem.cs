using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using Newtonsoft.Json;

namespace MaterialManagement.Models;

[Table("quotation_items")]
public class QuotationItem : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }
    
    [Column("quotation_id")]
    public Guid QuotationId { get; set; }
    
    [Column("material_id")]
    public Guid MaterialId { get; set; }
    
    [Column("quantity")]
    public decimal Quantity { get; set; }
    
    [Column("unit_price")]
    public decimal UnitPrice { get; set; }
    
    [Column("total_price")]
    public decimal TotalPrice { get; set; }
    
    [Column("delivery_time")]
    public int? DeliveryTime { get; set; }
    
    [Column("notes")]
    public string? Notes { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    // Navigation property - not mapped to database
    [JsonIgnore]
    public Material? Material { get; set; }
}
