using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace MaterialManagement.Models;

[Table("suppliers")]
public class Supplier : BaseModel
{
    [PrimaryKey("id", false)] // ID backend'de değil client/guid ile oluşturuluyorsa false olması iyidir ama true da olur. Guid kullandığımız için biz veriyoruz.
    public Guid Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("tax_number")]
    public string? TaxNumber { get; set; }

    [Column("address")]
    public string? Address { get; set; }

    [Column("phone")]
    public string? Phone { get; set; }

    [Column("email")]
    public string? Email { get; set; }

    [Column("contact_person")]
    public string? ContactPerson { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
