# Chi Tiêu - Quản lý chi tiêu cá nhân

Ứng dụng web PWA quản lý chi tiêu cá nhân, xây dựng bằng Next.js 14 + TypeScript + Tailwind CSS + Supabase.

## Tính năng

- Đăng nhập / Đăng ký (Email + Google OAuth)
- Quản lý giao dịch thu chi (CRUD, lọc, tìm kiếm)
- Dashboard tổng quan với biểu đồ
- Quản lý danh mục (icon + màu sắc tùy chỉnh)
- Quản lý nhiều ví (tiền mặt, ngân hàng, ví điện tử)
- Ngân sách theo danh mục với cảnh báo vượt mức
- Báo cáo biểu đồ (tròn, cột, đường)
- Xuất dữ liệu CSV
- Dark mode
- PWA (cài đặt lên màn hình chính)
- Responsive mobile-first

## Cài đặt

### 1. Clone và cài dependencies

```bash
npm install
```

### 2. Thiết lập Supabase

1. Tạo project tại [supabase.com](https://supabase.com)
2. Chạy file SQL `supabase/migrations/001_initial_schema.sql` trong SQL Editor
3. Bật Google OAuth trong Authentication > Providers (tùy chọn)

### 3. Cấu hình environment

Sửa file `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Chạy development server

```bash
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (PostgreSQL + Auth + RLS)
- **Recharts** (biểu đồ)
- **date-fns** (xử lý ngày tháng)
- **react-hook-form** + **zod** (form validation)

## Cấu trúc thư mục

```
src/
├── app/          # Pages (App Router)
├── components/   # React components
├── hooks/        # Custom hooks
├── lib/          # Utilities, Supabase clients
└── types/        # TypeScript definitions
```
