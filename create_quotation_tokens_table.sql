-- Quotation Tokens tablosu
-- Tedarikçilerin güvenli bir şekilde online teklif formuna erişimi için

CREATE TABLE IF NOT EXISTS quotation_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(64) UNIQUE NOT NULL,
    request_id UUID NOT NULL REFERENCES material_requests(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_quotation_tokens_token ON quotation_tokens(token);

-- RLS policies for public access via token
ALTER TABLE quotation_tokens ENABLE ROW LEVEL SECURITY;

-- Allow public read/update with token (for form submission)
DROP POLICY IF EXISTS "Allow public access" ON quotation_tokens;
CREATE POLICY "Allow public access" ON quotation_tokens FOR ALL USING (true) WITH CHECK (true);
