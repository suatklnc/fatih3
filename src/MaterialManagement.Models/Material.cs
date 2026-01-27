using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace MaterialManagement.Models;

[Table("materials")]
public class Material : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }
    
    [Column("code")]
    public string Code { get; set; } = string.Empty;
    
    [Column("name")]
    public string Name { get; set; } = string.Empty;
    
    [Column("description")]
    public string? Description { get; set; }
    
    [Column("unit")]
    public string Unit { get; set; } = string.Empty;
    
    [Column("category")]
    public string? Category { get; set; }
    
    [Column("stock_quantity")]
    public decimal StockQuantity { get; set; } = 0;
    
    [Column("min_stock_level")]
    public decimal MinStockLevel { get; set; } = 0;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
