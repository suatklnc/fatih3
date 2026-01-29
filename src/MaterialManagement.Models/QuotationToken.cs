using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace MaterialManagement.Models;

[Table("quotation_tokens")]
public class QuotationToken : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }
    
    [Column("token")]
    public string Token { get; set; } = string.Empty;
    
    [Column("request_id")]
    public Guid RequestId { get; set; }
    
    [Column("supplier_id")]
    public Guid SupplierId { get; set; }
    
    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }
    
    [Column("used_at")]
    public DateTime? UsedAt { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}
