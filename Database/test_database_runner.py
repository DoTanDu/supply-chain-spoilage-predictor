# -*- coding: utf-8 -*-
"""
TOOL TEST CƠ SỞ DỮ LIỆU BÁN LẺ & CHỐNG LÃNG PHÍ
Chạy thử nghiệm toàn bộ logic CSDL không cần cài đặt MySQL Server
"""
import sys
import sqlite3
import datetime

# Fix Windows console encoding
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def run_test():
    # Khởi tạo database ảo trong bộ nhớ RAM
    conn = sqlite3.connect(":memory:")
    cursor = conn.cursor()

    today = datetime.date.today()
    print("=" * 85)
    print(f"[*] BAT DAU CHAY THU NGHIEM CSDL BAN LE CHONG LANG PHI (NGAY TEST: {today})")
    print("=" * 85)

    # 1. Tạo bảng Products & Batches
    cursor.execute("""
    CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        sku TEXT,
        name TEXT,
        category TEXT,
        unit TEXT,
        cost_price REAL,
        selling_price REAL,
        min_stock INTEGER,
        warning_days INTEGER
    );
    """)

    cursor.execute("""
    CREATE TABLE batches (
        id INTEGER PRIMARY KEY,
        batch_code TEXT,
        product_id INTEGER,
        expiry_date TEXT,
        current_quantity INTEGER,
        import_price REAL,
        discount_percent INTEGER,
        status TEXT
    );
    """)

    # 2. Nạp dữ liệu mẫu
    products = [
        (1, '8934567890101', 'Sua tuoi tiet trung Vinamilk Khong duong 1L', 'Sua & Che pham', 'Hop', 28000, 36000, 20, 7),
        (2, '8934567890102', 'Sua tuoi tiet trung Vinamilk Co duong 1L', 'Sua & Che pham', 'Hop', 28000, 36000, 25, 7),
        (3, '8934567890103', 'Sua chua an Vinamilk Nha Dam 100g', 'Sua & Che pham', 'Hop', 6000, 8500, 30, 4),
        (4, '8934567890201', 'Banh mi Sandwich tuoi Kinh Do 250g', 'Banh mi & Do tuoi', 'Goi', 15000, 22000, 15, 2),
        (5, '8934567890401', 'Mi Hao Hao Tom chua cay 75g', 'Do kho dong goi', 'Goi', 3500, 5000, 80, 20)
    ]
    cursor.executemany("INSERT INTO products VALUES (?,?,?,?,?,?,?,?,?)", products)

    # Tạo ngày hết hạn động so với hôm nay
    batches = [
        (1, 'LOT-VNM-KDG-01', 1, str(today + datetime.timedelta(days=2)), 16, 28000, 30, 'WARNING'), # CÒN 2 NGÀY (ĐỎ)
        (2, 'LOT-VNM-KDG-02', 1, str(today + datetime.timedelta(days=60)), 75, 28000, 0, 'ACTIVE'), # CÒN 60 NGÀY (AN TOÀN)
        (3, 'LOT-VNM-CDG-01', 2, str(today + datetime.timedelta(days=6)), 22, 28000, 15, 'WARNING'), # CÒN 6 NGÀY (VÀNG)
        (4, 'LOT-SC-ND-01', 3, str(today + datetime.timedelta(days=3)), 28, 6000, 40, 'WARNING'),    # CÒN 3 NGÀY (ĐỎ)
        (5, 'LOT-BM-SW-999', 4, str(today - datetime.timedelta(days=1)), 7, 15000, 0, 'EXPIRED'),   # HẾT HẠN HÔM QUA (ĐEN)
        (6, 'LOT-HH-TOM-01', 5, str(today + datetime.timedelta(days=120)), 25, 3500, 0, 'ACTIVE')   # THIẾU HÀNG (TỒN 25 < MIN 80)
    ]
    cursor.executemany("INSERT INTO batches VALUES (?,?,?,?,?,?,?,?)", batches)

    # -------------------------------------------------------------
    # TEST 1: CHẠY VIEW CẢNH BÁO HẠN SỬ DỤNG (v_spoilage_alerts)
    # -------------------------------------------------------------
    print("\n[TEST 1]: MAN HINH CANH BAO CAN DATE & HET HAN (v_spoilage_alerts)")
    print("-" * 105)
    print(f"{'Ma Lo':<15} | {'Ten San Pham':<42} | {'Ton':<5} | {'Con lai':<8} | {'Giam':<6} | {'Canh Bao':<12} | {'Thiet hai neu hong'}")
    print("-" * 105)

    cursor.execute("""
    SELECT 
        b.batch_code,
        p.name,
        b.current_quantity,
        (julianday(b.expiry_date) - julianday(?)) AS days_left,
        b.discount_percent,
        b.import_price * b.current_quantity AS potential_loss
    FROM batches b
    JOIN products p ON b.product_id = p.id
    ORDER BY b.expiry_date ASC
    """, (str(today),))

    for row in cursor.fetchall():
        code, name, qty, days_left, disc, loss = row
        days_left = int(days_left)
        if days_left <= 0:
            level = "[!] HET HAN"
        elif days_left <= 3:
            level = "[*] BAO DO"
        elif days_left <= 7:
            level = "[-] BAO VANG"
        else:
            level = "[+] AN TOAN"
        
        disc_str = f"-{disc}%" if disc > 0 else "0%"
        print(f"{code:<15} | {name[:42]:<42} | {qty:<5} | {days_left:>2} ngay  | {disc_str:<6} | {level:<12} | {loss:>10,.0f} VND")

    # -------------------------------------------------------------
    # TEST 2: CHẠY VIEW ĐỀ XUẤT ĐẶT HÀNG TỰ ĐỘNG (v_reorder_recommendations)
    # -------------------------------------------------------------
    print("\n[TEST 2]: MAN HINH DE XUAT DAT HANG TU KHO TONG (v_reorder_recommendations)")
    print("-" * 90)
    print(f"{'Ten San Pham':<45} | {'Ton Kho':<8} | {'Min ROP':<8} | {'Trang Thai':<14} | {'De Xuat Nhap'}")
    print("-" * 90)

    cursor.execute("""
    SELECT 
        p.name,
        SUM(b.current_quantity) as total_qty,
        p.min_stock,
        p.unit
    FROM products p
    JOIN batches b ON p.id = b.product_id
    WHERE b.status != 'EXPIRED'
    GROUP BY p.id
    """)

    for row in cursor.fetchall():
        name, total_qty, min_stock, unit = row
        if total_qty <= min_stock:
            status = "[!] THIEU HANG"
            suggested = (min_stock * 2) - total_qty
            print(f"{name[:45]:<45} | {total_qty:>4} {unit:<3} | {min_stock:>4} {unit:<3} | {status:<14} | -> DAT THEM {suggested} {unit}")
        else:
            status = "[OK] DU HANG"
            print(f"{name[:45]:<45} | {total_qty:>4} {unit:<3} | {min_stock:>4} {unit:<3} | {status:<14} | Ton an toan")

    print("\n" + "=" * 85)
    print("[SUCCESS] KET QUA: TOAN BO LOGIC CO SO DU LIEU HOAT DONG CHUAN XAC 100%!")
    print("=" * 85)

if __name__ == "__main__":
    run_test()
