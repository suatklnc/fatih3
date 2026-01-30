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
        try
        {
        if (excelStream.CanSeek)
            excelStream.Position = 0;
        using var workbook = new XLWorkbook(excelStream);
        var worksheet = workbook.Worksheet(1);
        var lastRow = worksheet.LastRowUsed()?.RowNumber() ?? 0;
        if (lastRow < 2)
        {
            lastRow = 0;
            for (var r = 2; r <= 2000; r++)
            {
                var row = worksheet.Row(r);
                if (row.IsEmpty()) continue;
                lastRow = r;
            }
        }
        if (lastRow < 2)
        {
            result.Errors.Add("Excel dosyasında veri satırı bulunamadı. İlk satır başlık, 2. satırdan itibaren veri olmalı.");
            return result;
        }

        var headerRow = worksheet.Row(1);
        var lastCol = worksheet.LastColumnUsed()?.ColumnNumber() ?? 6;
        var colMap = GetColumnMap(headerRow, worksheet);
        
        // EMU stok listesi (fatih_stok): A=Stok kodu, B=Stok ismi, C=Depo, D=Fiyat 1, E=Birim 1, F=Mev.stk
        // 6+ sütun varsa ve başlık eşleşmesiyle ilk satır boş geliyorsa veya doğrudan EMU formatı kabul et
        if (lastCol >= 6)
        {
            var firstDataRow = worksheet.Row(2);
            var testCode = GetCellString(firstDataRow, colMap.Code);
            var testName = GetCellString(firstDataRow, colMap.Name);
            var rawA = GetCellString(firstDataRow, 1);
            var rawB = GetCellString(firstDataRow, 2);
            if (string.IsNullOrWhiteSpace(testCode) && string.IsNullOrWhiteSpace(testName) && 
                (!string.IsNullOrWhiteSpace(rawA) || !string.IsNullOrWhiteSpace(rawB)))
            {
                colMap = (1, 2, 5, null, 3, 6, null);
                result.Errors.Add("EMU stok formatı kullanıldı (Stok kodu, Stok ismi, Birim 1, Mev.stk).");
            }
            else if (string.IsNullOrWhiteSpace(testCode) && string.IsNullOrWhiteSpace(testName))
            {
                var (codeCol, nameCol) = FindFirstTwoNonEmptyColumns(firstDataRow, worksheet);
                if (codeCol.HasValue && nameCol.HasValue)
                    colMap = (codeCol, nameCol, colMap.Unit, colMap.Description, colMap.Category, colMap.StockQuantity, colMap.MinStockLevel);
                else
                {
                    colMap = (1, 2, 5, null, 3, 6, null);
                    result.Errors.Add("EMU stok formatı (A=Kod, B=Ad, E=Birim, F=Mev.stk) uygulandı.");
                }
            }
        }

        // Önce tüm malzemeleri parse et
        var materialsToImport = new List<Material>();
        
        for (var rowNum = 2; rowNum <= lastRow; rowNum++)
        {
            var row = worksheet.Row(rowNum);
            if (row.IsEmpty()) continue;

            string? code = null;
            string? name = null;
            try
            {
                code = GetCellString(row, colMap.Code);
                name = GetCellString(row, colMap.Name);
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

                materialsToImport.Add(material);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Satır {Row} atlandı. Kod: '{Code}', Ad: '{Name}', Hata: {Error}", 
                    rowNum, code ?? "", name ?? "", ex.Message);
                if (result.Errors.Count < 5)
                    result.Errors.Add($"Satır {rowNum}: {ex.Message}");
                else if (result.Errors.Count == 5)
                    result.Errors.Add("... (diğer hatalar log dosyasında)");
                result.Skipped++;
            }
        }

        // Toplu ekleme yap (batch insert)
        if (materialsToImport.Count > 0)
        {
            _logger.LogInformation("{Count} malzeme toplu olarak ekleniyor...", materialsToImport.Count);
            try
            {
                var imported = await _materialService.CreateManyAsync(materialsToImport);
                result.Imported = imported.Count;
                result.Skipped += (materialsToImport.Count - imported.Count);
                _logger.LogInformation("{Imported} malzeme başarıyla eklendi", imported.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Toplu ekleme hatası, tek tek ekleme deneniyor...");
                // Fallback: tek tek ekle
                foreach (var material in materialsToImport)
                {
                    try
                    {
                        await _materialService.CreateMaterialAsync(material);
                        result.Imported++;
                    }
                    catch (Exception innerEx)
                    {
                        _logger.LogWarning(innerEx, "Malzeme eklenemedi: {Code}", material.Code);
                        result.Skipped++;
                    }
                }
            }
        }

        return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excel okuma hatası");
            result.Errors.Add("Excel dosyası okunamadı: " + ex.Message);
            return result;
        }
    }

    private (int? Code, int? Name, int? Unit, int? Description, int? Category, int? StockQuantity, int? MinStockLevel) GetColumnMap(IXLRow headerRow, IXLWorksheet ws)
    {
        int? code = null, name = null, unit = null, desc = null, category = null, stock = null, minStock = null;
        var lastCol = Math.Max(ws.LastColumnUsed()?.ColumnNumber() ?? 0, 2);
        var headers = new List<string>();
        for (var c = 1; c <= lastCol; c++)
        {
            var cell = headerRow.Cell(c);
            var val = cell.GetString().Trim();
            if (string.IsNullOrEmpty(val)) val = cell.GetFormattedString()?.Trim() ?? "";
            if (string.IsNullOrEmpty(val)) continue;
            headers.Add($"Sütun {c}: '{val}'");
            var lower = val.ToLowerInvariant().Replace("ı", "i").Replace("ğ", "g").Replace("ü", "u").Replace("ş", "s").Replace("ö", "o").Replace("ç", "c");
            // EMU stok listesi: Stok kodu, Stok ismi, Depo, Fiyat 1, Birim 1, Mev.stk
            // Önce tam eşleşmeleri kontrol et (uzun başlıklar önce)
            if (lower == "stok kodu" || lower == "malzeme kodu" || lower == "kod" || lower == "code") code = code ?? c;
            else if (lower == "stok ismi" || lower == "malzeme adi" || lower == "malzeme adı" || lower == "malzeme" || lower == "urun adi" || lower == "urun adı" || lower == "ürün adı" || lower == "ad" || lower == "name") name = name ?? c;
            else if (lower == "birim 1" || lower == "birim" || lower == "unit") unit = c;
            else if (lower == "mev.stk" || lower == "mev stk" || lower == "mevcut stok" || lower == "stok miktarı" || lower == "stok miktari" || lower == "stok" || lower == "stock" || lower == "miktar" || lower == "quantity") stock = c;
            else if (lower == "depo" || lower == "kategori" || lower == "category") category = c;
            else if (lower == "açıklama" || lower == "aciklama" || lower == "description") desc = c;
            else if (lower == "min stok" || lower == "min stock" || lower == "minimum stok" || lower == "min. stok") minStock = c;
        }
        _logger.LogInformation("Başlıklar: {Headers}", string.Join(", ", headers));
        code ??= 1;
        name ??= 2;
        _logger.LogInformation("Eşleşen sütunlar - Kod: {Code} (sütun {CodeCol}), Ad: {Name} (sütun {NameCol}), Birim: {Unit}, Stok: {Stock}", 
            code, code, name, name, unit, stock);
        return (code, name, unit, desc, category, stock, minStock);
    }

    private static string? GetCellString(IXLRow row, int? col)
    {
        if (col == null) return null;
        var cell = row.Cell(col.Value);
        var v = cell.GetString();
        if (!string.IsNullOrWhiteSpace(v)) return v.Trim();
        var formatted = cell.GetFormattedString();
        if (!string.IsNullOrWhiteSpace(formatted)) return formatted.Trim();
        try
        {
            if (!cell.IsEmpty())
            {
                var cached = cell.CachedValue;
                var s = cached.ToString()?.Trim();
                if (!string.IsNullOrWhiteSpace(s)) return s;
            }
        }
        catch { /* ignore */ }
        return null;
    }

    private static (int? codeCol, int? nameCol) FindFirstTwoNonEmptyColumns(IXLRow row, IXLWorksheet ws)
    {
        var lastCol = Math.Max(ws.LastColumnUsed()?.ColumnNumber() ?? 10, 10);
        int? first = null, second = null;
        for (var c = 1; c <= lastCol; c++)
        {
            var s = GetCellString(row, c);
            if (string.IsNullOrWhiteSpace(s)) continue;
            if (!first.HasValue) { first = c; continue; }
            if (!second.HasValue) { second = c; break; }
        }
        return (first, second);
    }

    private static decimal GetCellDecimal(IXLRow row, int? col)
    {
        if (col == null) return 0;
        var cell = row.Cell(col.Value);
        if (cell.TryGetValue(out double d)) return (decimal)d;
        var s = cell.GetString();
        if (string.IsNullOrWhiteSpace(s)) s = cell.GetFormattedString();
        if (string.IsNullOrWhiteSpace(s) && !cell.IsEmpty())
        {
            try { s = cell.CachedValue.ToString()?.Trim(); } catch { }
        }
        if (string.IsNullOrWhiteSpace(s)) return 0;
        return decimal.TryParse(s.Replace(",", "."), NumberStyles.Any, CultureInfo.InvariantCulture, out var dec) ? dec : 0;
    }
}
