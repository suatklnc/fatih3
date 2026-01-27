using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace MaterialManagement.Models;

[Table("notifications")]
public class Notification : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }
    
    [Column("user_id")]
    public Guid UserId { get; set; }
    
    [Column("type")]
    public string Type { get; set; } = string.Empty;
    
    [Column("title")]
    public string Title { get; set; } = string.Empty;
    
    [Column("message")]
    public string? Message { get; set; }
    
    [Column("related_entity_type")]
    public string? RelatedEntityType { get; set; }
    
    [Column("related_entity_id")]
    public Guid? RelatedEntityId { get; set; }
    
    [Column("is_read")]
    public bool IsRead { get; set; } = false;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}
