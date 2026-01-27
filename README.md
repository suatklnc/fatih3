# Malzeme Yönetim Sistemi

Mekanik firması için malzeme tedarik, takip ve teklif yönetim web uygulaması.

## Özellikler

- **Kullanıcı Rolleri**: Patron, Yönetici, Satın Alma Birimi
- **Proje Yönetimi**: Firma/Proje klasörleri oluşturma ve yönetme
- **Malzeme Havuzu**: Merkezi malzeme kataloğu
- **Talep Yönetimi**: Malzeme talebi oluşturma ve onay süreçleri
- **Teklif Yönetimi**: Tedarikçilerden gelen teklifleri karşılaştırma ve onaylama
- **Email Entegrasyonu**: Otomatik email gönderimi
- **Bildirim Sistemi**: Uygulama içi bildirimler

## Teknoloji Stack

- **Backend**: ASP.NET Core 8.0 Web API
- **Frontend**: React 18 + Vite
- **Veritabanı**: Supabase (PostgreSQL)
- **ORM**: Supabase C# Client

## Kurulum

### Gereksinimler

- .NET 8.0 SDK
- Node.js 18+ ve npm
- Supabase hesabı ve projesi

### Backend Kurulumu

1. Supabase API anahtarınızı alın ve `src/MaterialManagement.API/appsettings.json` dosyasına ekleyin:

```json
{
  "Supabase": {
    "Url": "https://your-project.supabase.co",
    "Key": "your-api-key"
  }
}
```

2. Email ayarlarını yapılandırın (opsiyonel):

```json
{
  "Email": {
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": "587",
    "SmtpUsername": "your-email@gmail.com",
    "SmtpPassword": "your-app-password",
    "FromEmail": "your-email@gmail.com"
  }
}
```

3. Projeyi çalıştırın:

```bash
cd src/MaterialManagement.API
dotnet restore
dotnet run
```

API `http://localhost:5000` adresinde çalışacaktır.

### Frontend Kurulumu

1. Bağımlılıkları yükleyin:

```bash
cd frontend
npm install
```

2. Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

Frontend `http://localhost:3000` adresinde çalışacaktır.

## Veritabanı Şeması

Veritabanı şeması Supabase migration ile oluşturulmuştur. Şema şu tabloları içerir:

- `roles` - Kullanıcı rolleri
- `companies` - Firmalar
- `projects` - Projeler
- `user_profiles` - Kullanıcı profilleri
- `materials` - Malzeme kataloğu
- `suppliers` - Tedarikçiler
- `material_requests` - Malzeme talepleri
- `material_request_items` - Talep detayları
- `quotations` - Teklifler
- `quotation_items` - Teklif detayları
- `notifications` - Bildirimler
- `email_logs` - Email gönderim geçmişi

## API Endpoints

### Materials
- `GET /api/materials` - Tüm malzemeleri listele
- `GET /api/materials/{id}` - Malzeme detayı
- `POST /api/materials` - Yeni malzeme ekle
- `PUT /api/materials/{id}` - Malzeme güncelle
- `DELETE /api/materials/{id}` - Malzeme sil

### Material Requests
- `GET /api/materialrequests` - Tüm talepleri listele
- `GET /api/materialrequests/{id}` - Talep detayı
- `POST /api/materialrequests` - Yeni talep oluştur
- `PUT /api/materialrequests/{id}/status` - Talep durumu güncelle
- `DELETE /api/materialrequests/{id}` - Talep sil

### Quotations
- `GET /api/quotations` - Tüm teklifleri listele
- `GET /api/quotations/{id}` - Teklif detayı
- `GET /api/quotations/request/{requestId}` - Talep için teklifleri listele
- `POST /api/quotations` - Yeni teklif oluştur
- `PUT /api/quotations/{id}/status` - Teklif durumu güncelle
- `DELETE /api/quotations/{id}` - Teklif sil

### Notifications
- `GET /api/notifications/user/{userId}` - Kullanıcı bildirimlerini listele
- `POST /api/notifications/{notificationId}/read` - Bildirimi okundu işaretle
- `POST /api/notifications/user/{userId}/read-all` - Tüm bildirimleri okundu işaretle

## Geliştirme

### Proje Yapısı

```
.
├── src/
│   ├── MaterialManagement.API/          # Web API projesi
│   ├── MaterialManagement.Models/       # Veri modelleri
│   └── MaterialManagement.Services/     # İş mantığı servisleri
├── frontend/                            # React frontend
│   ├── src/
│   │   ├── components/                  # React bileşenleri
│   │   ├── pages/                       # Sayfa bileşenleri
│   │   └── services/                    # API servisleri
│   └── package.json
└── README.md
```

## Notlar

- Supabase modelleri için `BaseModel` sınıfından türetilmesi gerekiyor (şu an basit modeller kullanılıyor, Supabase entegrasyonu için güncellenmeli)
- Authentication henüz tam olarak entegre edilmemiştir, placeholder user ID'ler kullanılıyor
- Email servisi SMTP ayarları gerektirir

## Lisans

Bu proje özel kullanım içindir.
