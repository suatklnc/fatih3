namespace MaterialManagement.Services;

public interface IMaterialImportService
{
    Task<MaterialImportResult> ImportFromExcelAsync(Stream excelStream);
}

public class MaterialImportResult
{
    public int Imported { get; set; }
    public int Skipped { get; set; }
    public List<string> Errors { get; set; } = new();
}
