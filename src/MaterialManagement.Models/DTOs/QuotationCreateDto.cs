namespace MaterialManagement.Models.DTOs;

public class QuotationCreateDto
{
    public Guid RequestId { get; set; }
    public Guid SupplierId { get; set; }
    public DateTime? ValidUntil { get; set; }
    public string Currency { get; set; } = "TRY";
    public string? Notes { get; set; }
    public List<QuotationItemDto> Items { get; set; } = new();
}

public class QuotationItemDto
{
    public Guid MaterialId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public int? DeliveryTime { get; set; }
    public string? Notes { get; set; }
}
