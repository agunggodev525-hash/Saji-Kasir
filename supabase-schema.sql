-- ============================================
-- SUPABASE SCHEMA - Aplikasi Kasir Toko Amanah
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================

-- Tabel: items (Data Barang)
CREATE TABLE IF NOT EXISTS public.items (
    id          BIGINT PRIMARY KEY,
    name        TEXT NOT NULL,
    category    TEXT,
    price       NUMERIC(15, 2) DEFAULT 0,
    "buyPrice"  NUMERIC(15, 2) DEFAULT 0,
    stock       INTEGER DEFAULT 0,
    barcode     TEXT,
    image       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel: transactions (Transaksi Penjualan)
CREATE TABLE IF NOT EXISTS public.transactions (
    id                  BIGINT PRIMARY KEY,
    nomor_transaksi     TEXT,
    items               JSONB,
    total               NUMERIC(15, 2) DEFAULT 0,
    payment             NUMERIC(15, 2) DEFAULT 0,
    change              NUMERIC(15, 2) DEFAULT 0,
    subtotal            NUMERIC(15, 2) DEFAULT 0,
    discount            NUMERIC(15, 2) DEFAULT 0,
    "paymentMethod"     TEXT DEFAULT 'cash',
    "customerId"        BIGINT,
    "customerName"      TEXT,
    "customerType"      TEXT,
    "transactionType"   TEXT DEFAULT 'SALE',
    note                TEXT,
    cashier             TEXT,
    date                TIMESTAMPTZ DEFAULT NOW(),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel: customers (Data Pelanggan)
CREATE TABLE IF NOT EXISTS public.customers (
    id          BIGINT PRIMARY KEY,
    name        TEXT NOT NULL,
    phone       TEXT,
    type        TEXT DEFAULT 'REGULAR',
    debt        NUMERIC(15, 2) DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers    ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES - Izinkan akses penuh (service_role)
-- Karena menggunakan service_role key, semua operasi diizinkan
-- ============================================

-- Items policies
CREATE POLICY "Allow all on items" ON public.items
    FOR ALL USING (true) WITH CHECK (true);

-- Transactions policies
CREATE POLICY "Allow all on transactions" ON public.transactions
    FOR ALL USING (true) WITH CHECK (true);

-- Customers policies
CREATE POLICY "Allow all on customers" ON public.customers
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- REALTIME - Aktifkan untuk semua tabel
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;

-- ============================================
-- SELESAI! Tabel siap digunakan.
-- ============================================
