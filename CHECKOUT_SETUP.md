# Dokumentasi Setup CheckoutProduk.jsx

## File yang Dibuat
- `frontend/src/pages/CheckoutProduk.jsx` - Halaman checkout untuk pembelian produk dengan uang

## Perubahan di App.jsx

### 1. Import CheckoutProduk (di bagian imports)
Tambahkan setelah import ProdukDetail:

```jsx
import CheckoutProduk from './pages/CheckoutProduk';
```

**Lokasi**: Setelah baris `import ProdukDetail from './pages/ProdukDetail';`

### 2. Tambahkan Route (di bagian routes)
Tambahkan route setelah route `/produk/:id`:

```jsx
<Route path="/checkout/:id" element={<ProtectedRoute requiredRole="user"><CheckoutProduk /></ProtectedRoute>} />
```

**Lokasi**: Setelah baris `<Route path="/produk/:id" element={<Layout><ProdukDetail /></Layout>} />`

## Fitur Halaman Checkout

### A. Load Data
- Ambil ID produk dari URL parameter `:id`
- Fetch detail produk dari `GET /products/:id`
- Fetch profil user dari localStorage (user harus login)
- Auto-redirect ke `/signin` jika belum login

### B. Tampilan Produk Summary
- Gambar/thumbnail produk
- Judul produk
- Kategori produk
- Nama penulis/penulis
- Harga (dengan diskon jika ada)
- Total pembayaran

### C. Pilihan Metode Pembayaran
Tiga metode pembayaran yang tersedia:

1. **Transfer Bank (Virtual Account)**
   - Menampilkan nomor VA
   - Button copy ke clipboard
   - Batas waktu pembayaran dengan countdown

2. **E-Wallet (GoPay / OVO / Dana)**
   - Pilihan pembayaran instan
   - Bisa link ke payment gateway

3. **QRIS**
   - QR Code untuk di-scan
   - Bisa digunakan di semua e-wallet

### D. Proses Pembayaran
- Button "Bayar Sekarang" memanggil `POST /orders`
- Payload: `{ product_id, payment_method }`
- Response handling:
  - Jika ada `redirect_url`: redirect ke payment gateway
  - Jika ada `payment_instruction`: tampilkan instruksi bayar dengan countdown
  - Jika error: tampilkan pesan error

### E. Instruksi Pembayaran
Jika API mengembalikan payment instruction, halaman menampilkan:
- Nomor Virtual Account (dengan copy button)
- QR Code QRIS (jika ada)
- Link ke halaman pembayaran (jika ada)
- Countdown batas waktu pembayaran (10 menit)
- Pesan info tentang batas waktu

### F. State & Loading
- Loading state saat fetch data produk
- Loading state saat proses pembayaran (button disabled)
- Error handling dengan pesan yang jelas

## Struktur API yang Diharapkan

### GET /products/:id
**Response:**
```json
{
  "id": 1,
  "title": "Buku Template AMDAL",
  "category": "book",
  "price": 50000,
  "discount_price": 40000,
  "image_url": "https://...",
  "author": "Nama Penulis",
  "publisher": "Penerbit",
  "expert": {
    "id": 1,
    "name": "Nama Ahli",
    "institution": "Institusi"
  }
}
```

### POST /orders
**Request:**
```json
{
  "product_id": 1,
  "payment_method": "bank_transfer" // atau "ewallet", "qris"
}
```

**Response (Redirect Case):**
```json
{
  "redirect_url": "https://payment-gateway.com/pay/123"
}
```

**Response (Payment Instruction Case):**
```json
{
  "payment_instruction": {
    "va_number": "1234567890",
    "bank_name": "BCA",
    "amount": 40000,
    "qr_code": "https://...",
    "payment_url": "https://..."
  }
}
```

## Integrasi dari ProdukDetail.jsx
User bisa sampai ke halaman checkout dengan:

1. Dari halaman detail produk (ProdukDetail.jsx)
2. Klik tombol "Bayar Sekarang" atau "Beli dengan Uang"
3. Akan navigate ke `/checkout/:id`

**Code di ProdukDetail.jsx (sudah ada):**
```jsx
const handleBuyWithMoney = (productId) => {
  if (!user) {
    navigate('/signin');
    return;
  }
  navigate(`/checkout/${productId}`);
};
```

## Styling & Design
- Background: `#FAFBF9` (light gray)
- Primary color: `#008A62` (hijau) dengan hover `#00704F`, `#007352`
- Card: white rounded-3xl border border-gray-200/90 shadow-sm
- Font: Bahasa Indonesia
- Icon: Google Material Symbols Outlined
- Currency: Rupiah (IDR) dengan format Intl.NumberFormat

## Pola Kode yang Mengikuti Project
- Menggunakan `useState`, `useEffect` untuk state management
- Arrow function untuk handlers
- Try-catch-finally untuk API calls
- Conditional rendering dengan ternary operator
- Tailwind CSS untuk styling
- Material Symbols untuk icons
- Format rupiah dengan Intl.NumberFormat

## Testing Checklist
- [ ] Halaman load dengan benar saat belum login (redirect ke `/signin`)
- [ ] Menampilkan detail produk dengan benar
- [ ] Metode pembayaran bisa dipilih dengan radio button
- [ ] Button "Bayar Sekarang" disabled saat processing
- [ ] API call ke `/orders` bekerja
- [ ] Redirect ke payment gateway bekerja
- [ ] Tampilan instruksi pembayaran dengan VA/QRIS
- [ ] Countdown timer berfungsi
- [ ] Copy nomor VA bekerja
- [ ] Button "Kembali" bekerja
- [ ] Error handling menampilkan pesan error dengan baik

## File yang Dimodifikasi
1. `frontend/src/App.jsx` - Tambah import & route
2. `frontend/src/pages/CheckoutProduk.jsx` - File baru (sudah dibuat)

## Build Status
✅ Frontend builds successfully - semua import dan route sudah disiapkan
