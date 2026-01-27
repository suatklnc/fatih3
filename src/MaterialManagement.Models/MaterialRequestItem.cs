using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using Newtonsoft.Json;

namespace MaterialManagement.Models;

[Table("material_request_items")]
public class MaterialRequestItem : BaseModel
{
    [PrimaryKey("id", true)]
    public Guid Id { get; set; }
    
    [Column("request_id")]
    public Guid RequestId { get; set; }
    
    [Column("material_id")]
    public Guid MaterialId { get; set; }
    
    [Column("quantity")]
    public decimal Quantity { get; set; }
    
    [Column("unit_price")]
    public decimal? UnitPrice { get; set; }
    
    [Column("notes")]
    public string? Notes { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [JsonIgnore]
    public Material? Material { get; set; }
}
