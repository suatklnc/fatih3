# Coolify ile Deployment

Bu proje tek bir Docker imajı ile çalışır: backend (API) + frontend aynı konteynerde sunulur.

## Coolify’da Kurulum

1. **Yeni uygulama** oluştur, kaynak olarak **Git** seçin ve bu repoyu bağlayın.
2. **Build** tipi: **Dockerfile** seçin. Proje kökündeki `Dockerfile` kullanılacak.
3. **Port:** `8080` (Coolify genelde otomatik algılar; yoksa 8080 yazın).
4. **Domain:** Kendi domain’inizi ekleyin (örn. `malzeme.sirket.com`).

## Ortam Değişkenleri (Environment Variables)

Coolify panelinde **Environment Variables** bölümüne ekleyin:

| Değişken        | Zorunlu | Açıklama |
|-----------------|--------|----------|
| `SUPABASE_URL`  | Evet   | Supabase proje URL’i (örn. `https://xxx.supabase.co`) |
| `SUPABASE_KEY`  | Evet   | Supabase anon/public API key |
| `ASPNETCORE_ENVIRONMENT` | Hayır | `Production` (varsayılan) |

**SMTP (e-posta)** kullanacaksanız `appsettings.json`’daki değerleri ortam değişkeni ile override etmek için backend’e ek kod gerekir; şimdilik appsettings’te kalabilir veya ileride eklenebilir.

## Yerel Docker ile Test

```bash
# Proje kökünde
docker build -t malzeme-yonetim .
docker run -p 8080:8080 -e SUPABASE_URL="https://xxx.supabase.co" -e SUPABASE_KEY="your-key" malzeme-yonetim
```

Tarayıcıda: http://localhost:8080

## İsteğe Bağlı: Frontend Supabase (Build Args)

Farklı bir Supabase projesi kullanacaksanız, **Build Arguments** olarak ekleyin:

- `VITE_SUPABASE_URL` – Supabase proje URL’i  
- `VITE_SUPABASE_KEY` – Supabase anon key  

(Bunlar build sırasında frontend’e gömülür. Belirtmezseniz kod içindeki varsayılan değerler kullanılır.)

## Notlar

- Uygulama **8080** portunda dinler (Coolify ile uyumlu).
- Frontend `/api` ile backend’e istek atar; aynı origin olduğu için ek CORS ayarı gerekmez.
- Backend Supabase bilgisi için `SUPABASE_URL` ve `SUPABASE_KEY` ortam değişkenlerini Coolify’da tanımlayın; hassas veriyi repoda tutmayın.
