using System.Globalization;
using ClosedXML.Excel;
using MaterialManagement.Models;
using Microsoft.Extensions.Logging;

namespace MaterialManagement.Services;

public class MaterialImportService : IMaterialImportService
{
    private readonly IMaterialService _materialService;
    private readonly ILogger<MaterialImportService> _logger;

    public MaterialImportService(IMaterialService materialService, ILogger<MaterialImportService> logger)
    {
        _materialService = materialService;
        _logger = logger;
    }

    public async Task<MaterialImportResult> ImportFromExcelAsync(Stream excelStream)
    {
        var result = new MaterialImportResult();
        using var workbook = new XLWorkbook(excelStream);
        var worksheet = workbook.Worksheet(1);
        var lastRow = worksheet.LastRowUsed()?.RowNumber() ?? 0;
        if (lastRow < 2)
        {
            result.Errors.Add("Excel dosyasında veri satırı bulunamadı.");
            return result;
        }

        var headerRow = worksheet.Row(1);
        var colMap = GetColumnMap(headerRow, worksheet);

        for (var rowNum = 2; rowNum <= lastRow; rowNum++)
        {
            var row = worksheet.Row(rowNum);
            if (row.IsEmpty()) continue;

            try
            {
                var code = GetCellString(row, colMap.Code);
                var name = GetCellString(row, colMap.Name);
                if (string.IsNullOrWhiteSpace(code) && string.IsNullOrWhiteSpace(name))
                {
                    result.Skipped++;
                    continue;
                }
                if (string.IsNullOrWhiteSpace(code)) code = name ?? $"MAL-{rowNum}";
                if (string.IsNullOrWhiteSpace(name)) name = code ?? $"Malzeme {rowNum}";
                code = code ?? "MAL";
                name = name ?? "Malzeme";

                var material = new Material
                {
                    Id = Guid.Empty,
                    Code = code.Trim(),
                    Name = name.Trim(),
                    Description = GetCellString(row, colMap.Description)?.Trim(),
                    Unit = GetCellString(row, colMap.Unit)?.Trim() ?? "Adet",
                    Category = GetCellString(row, colMap.Category)?.Trim(),
                    StockQuantity = GetCellDecimal(row, colMap.StockQuantity),
                    MinStockLevel = GetCellDecimal(row, colMap.MinStockLevel)
                };

                await _materialService.CreateMaterialAsync(material);
                result.Imported++;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Satır {Row} atlandı.", rowNum);
                result.Errors.Add($"Satır {rowNum}: {ex.Message}");
                result.Skipped++;
            }
        }

        return result;
    }

    private static (int? Code, int? Name, int? Unit, int? Description, int? Category, int? StockQuantity, int? MinStockLevel) GetColumnMap(IXLRow headerRow, IXLWorksheet ws)
    {
        int? code = null, name = null, unit = null, desc = null, category = null, stock = null, minStock = null;
        var lastCol = ws.LastColumnUsed()?.ColumnNumber() ?? 0;
        for (var c = 1; c <= lastCol; c++)
        {
            var val = headerRow.Cell(c).GetString().Trim();
            if (string.IsNullOrEmpty(val)) continue;
            var lower = val.ToLowerInvariant();
            if (lower is "kod" or "code" or "malzeme kodu") code = c;
            else if (lower is "ad" or "name" or "malzeme adı" or "malzeme adi" or "malzeme") name = c;
            else if (lower is "birim" or "unit") unit = c;
            else if (lower is "açıklama" or "aciklama" or "description" or "açiklama") desc = c;
            else if (lower is "kategori" or "category") category = c;
            else if (lower is "stok" or "stock" or "miktar" or "quantity" or "stok miktarı" or "stok miktari") stock = c;
            else if (lower is "min stok" or "min stock" or "minimum stok" or "min. stok") minStock = c;
        }
        return (code, name, unit, desc, category, stock, minStock);
    }

    private static string? GetCellString(IXLRow row, int? col)
    {
        if (col == null) return null;
        var v = row.Cell(col.Value).GetString();
        return string.IsNullOrWhiteSpace(v) ? null : v;
    }

    private static decimal GetCellDecimal(IXLRow row, int? col)
    {
        if (col == null) return 0;
        var cell = row.Cell(col.Value);
        if (cell.TryGetValue(out double d)) return (decimal)d;
        var s = cell.GetString();
        if (string.IsNullOrWhiteSpace(s)) return 0;
        return decimal.TryParse(s.Replace(",", "."), NumberStyles.Any, CultureInfo.InvariantCulture, out var dec) ? dec : 0;
    }
}
