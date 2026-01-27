namespace MaterialManagement.Models.DTOs;

public class MaterialRequestCreateDto
{
    public Guid ProjectId { get; set; }
    public string Priority { get; set; } = "normal";
    public DateTime? RequiredDate { get; set; }
    public string? Notes { get; set; }
    public List<MaterialRequestItemDto> Items { get; set; } = new();
}

public class MaterialRequestItemDto
{
    public Guid MaterialId { get; set; }
    public decimal Quantity { get; set; }
    public string? Notes { get; set; }
}
