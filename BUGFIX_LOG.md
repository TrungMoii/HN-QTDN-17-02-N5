# 🔧 BUGFIX LOG - ODOO 15 COMPATIBILITY

**Ngày fix**: 19/06/2026
**Trạng thái**: ✅ Đã fix các lỗi cốt lõi

---

## ✅ CÁC LỖI ĐÃ FIX

### 1. `_unknown object has no attribute 'id'` (CRITICAL)
**File**: `addons/quan_ly_tai_san/models/phan_bo_tai_san.py`
**Nguyên nhân**: `@api.onchange` gán `computed field` (phong_ban_hien_tai_id) của nhân viên vào
Many2one field. Khi Odoo serialize onchange result, computed field chưa được commit có thể là `_unknown`.
**Fix**: Đọc trực tiếp từ `lich_su_cong_tac_ids` và chỉ gán khi `phong_ban.id` tồn tại (integer, không phải NewId).

```python
# TRƯỚC (lỗi):
self.phong_ban_id = self.nhan_vien_su_dung_id.phong_ban_hien_tai_id

# SAU (đúng):
phong_ban = latest[0].phong_ban_id
if phong_ban and phong_ban.id:
    self.phong_ban_id = phong_ban.id
```

---

### 2. `tracking=True` trên model không có `mail.thread` (CRASH)
**Files**:
- `addons/quan_ly_tai_san/models/phan_bo_tai_san.py` → `tinh_trang` field
- `addons/quan_ly_tai_san/models/don_muon_tai_san_line.py` → `trang_thai_line` field

**Fix**: Bỏ `tracking=True` trên các fields của model không inherit `mail.thread`.

---

### 3. Duplicate model class `muon_tra_tai_san_line` (CRASH)
**Files**:
- `muon_tra_tai_san.py` — class đầy đủ (ĐÚNG)
- `muon_tra_tai_san_line.py` — class đơn giản (TRÙNG)

**Fix**: Xóa nội dung `muon_tra_tai_san_line.py`, chỉ giữ comment.

---

### 4. Field sai `nguyen_gia` → `gia_tri_ban_dau` (CRASH)
**File**: `addons/quan_ly_tai_chinh/models/dashboard_tai_chinh.py`
```python
# TRƯỚC: sum(tai_san_records.mapped('nguyen_gia'))
# SAU:   sum(tai_san_records.mapped('gia_tri_ban_dau'))
```

---

### 5. Selection value sai `trang_thai` trên `phe_duyet_mua_tai_san` (WRONG DATA)
**File**: `addons/quan_ly_tai_chinh/models/dashboard_tai_chinh.py`
```python
# TRƯỚC: p.trang_thai in ['approved', 'done']
# SAU:   p.state in ['approved', 'done']
```

---

### 6. Selection value sai `trang_thai_thanh_ly = 'dang_su_dung'` (NO RESULTS)
**File**: `addons/q_trang_chu/models/chatbot.py`
```python
# TRƯỚC: ('trang_thai_thanh_ly', '=', 'dang_su_dung')
# SAU:   ('trang_thai_thanh_ly', 'in', ['da_phan_bo', 'chua_phan_bo'])
```

---

### 7. Field sai `nhan_vien_id` → `nhan_vien_su_dung_id` trên `phan_bo_tai_san` (NO RESULTS)
**File**: `addons/q_trang_chu/models/chatbot.py`
```python
# TRƯỚC: ('nhan_vien_id', '=', user_employee.id)
# SAU:   ('nhan_vien_su_dung_id', '=', user_employee.id)
```

---

### 8. Field sai `nhan_vien.name` → `nhan_vien.ho_ten` (ATTRIBUTEERROR)
**File**: `addons/q_trang_chu/models/chatbot.py`
```python
# TRƯỚC: nhan_vien.name, nhan_vien.phong_ban_id
# SAU:   nhan_vien.ho_ten, nhan_vien.phong_ban_hien_tai_id
```

---

### 9. Field sai `danh_muc_id` → `danh_muc_ts_id` (CRASH)
**File**: `addons/q_trang_chu/models/dashboard.py`
```python
# TRƯỚC: TaiSan.search_count([('danh_muc_id', '=', dm.id)])
#        dm.ten_danh_muc
# SAU:   TaiSan.search_count([('danh_muc_ts_id', '=', dm.id)])
#        dm.ten_danh_muc_ts
```

---

### 10. Xóa `ngay_het_bao_hanh` field không tồn tại (ATTRIBUTEERROR)
**File**: `addons/q_trang_chu/models/chatbot.py`
**Fix**: Bỏ logic bảo hành vì field `ngay_het_bao_hanh` không có trong model `tai_san`.

---

### 11. `import inspect` trong method `write()` (PERFORMANCE)
**File**: `addons/quan_ly_tai_san/models/de_xuat_mua_tai_san.py`
**Fix**: Bỏ `import inspect` và logic kiểm tra caller, thay bằng context check đơn giản hơn.

---

### 12. Duplicate `action_reset_to_draft` method (LOGIC ERROR)
**File**: `addons/quan_ly_tai_san/models/de_xuat_mua_tai_san.py`
**Fix**: Hợp nhất thành một method duy nhất với logic đúng.

---

### 13. `dashboard.department.distribution.department_id` là `hr.department` nhưng data dùng `phong_ban` (TYPE MISMATCH)
**File**: `addons/quan_ly_tai_chinh/models/dashboard_tai_chinh.py`
**Fix**: Đổi field thành `phong_ban_id = Many2one('phong_ban')`.

**View fix**: `addons/quan_ly_tai_chinh/views/dashboard_tai_chinh_views.xml`
```xml
<!-- TRƯỚC: <field name="department_id"/> -->
<!-- SAU:   <field name="phong_ban_id"/> -->
```

---

### 14. `widget="monetary"` với `currency_field='don_vi_tien_te'` (CRASH)
**Files**:
- `addons/quan_ly_tai_san/views/de_xuat_mua_tai_san_views.xml`
- `addons/quan_ly_tai_chinh/views/phe_duyet_mua_tai_san_views.xml`

**Nguyên nhân**: `don_vi_tien_te` là `Selection` field, không phải `Many2one` đến `res.currency`.
**Fix**: Bỏ `widget="monetary"` và `options="{'currency_field': 'don_vi_tien_te'}"`.

---

### 15. `widget="monetary"` trên `bao_cao_tai_chinh` không có `currency_id` (CRASH)
**File**: `addons/quan_ly_tai_chinh/views/bao_cao_tai_chinh_views.xml`
**Fix**: Bỏ `widget="monetary"`.

---

### 16. Selection value sai trong `dashboard.py` asset dashboard (NO RESULTS)
**File**: `addons/quan_ly_tai_san/models/dashboard.py`
```python
# TRƯỚC: ('trang_thai', '=', 'dang-muon'), ('trang_thai', '=', 'da-tra')
# SAU:   ('trang_thai', '=', 'dang_muon'), ('trang_thai', '=', 'da_tra')

# TRƯỚC: don_muon_tai_san ('trang_thai', '=', 'dang-cho')
# SAU:   don_muon_tai_san ('trang_thai', '=', 'cho_duyet')
```

---

### 17. `@api.depends` thiếu trên computed fields `kiem_ke_history_ids`, `luan_chuyen_ids` (STALE DATA)
**File**: `addons/quan_ly_tai_san/models/tai_san.py`
**Fix**: Thêm `@api.depends('phong_ban_su_dung_ids')`.

---

### 18. Security CSV prefix không nhất quán (WARNING)
**File**: `addons/quan_ly_tai_chinh/security/ir.model.access.csv`
**Fix**: Bỏ prefix `quan_ly_tai_chinh.` để dùng format `model_*` nhất quán.

---

## 📋 FILES ĐÃ THAY ĐỔI

| File | Loại thay đổi |
|------|--------------|
| `quan_ly_tai_san/models/phan_bo_tai_san.py` | Fix onchange _unknown |
| `quan_ly_tai_san/models/don_muon_tai_san_line.py` | Bỏ tracking=True |
| `quan_ly_tai_san/models/muon_tra_tai_san_line.py` | Xóa duplicate class |
| `quan_ly_tai_san/models/de_xuat_mua_tai_san.py` | Fix import inspect, duplicate method |
| `quan_ly_tai_san/models/tai_san.py` | Thêm @api.depends |
| `quan_ly_tai_san/models/dashboard.py` | Fix selection values |
| `quan_ly_tai_san/views/de_xuat_mua_tai_san_views.xml` | Bỏ currency_field sai |
| `quan_ly_tai_chinh/models/dashboard_tai_chinh.py` | Fix nguyen_gia, trang_thai→state, phong_ban |
| `quan_ly_tai_chinh/models/phe_duyet_mua_tai_san.py` | Không thay đổi |
| `quan_ly_tai_chinh/views/dashboard_tai_chinh_views.xml` | Fix department_id→phong_ban_id |
| `quan_ly_tai_chinh/views/bao_cao_tai_chinh_views.xml` | Bỏ widget monetary sai |
| `quan_ly_tai_chinh/views/phe_duyet_mua_tai_san_views.xml` | Bỏ currency_field sai |
| `quan_ly_tai_chinh/security/ir.model.access.csv` | Fix prefix |
| `q_trang_chu/models/chatbot.py` | Fix nhiều field names |
| `q_trang_chu/models/dashboard.py` | Fix danh_muc_id, ten_danh_muc |

---

## 🚀 HƯỚNG DẪN APPLY

```bash
# 1. Restart Odoo
python odoo-bin -c odoo.conf -d your_db --dev=all

# 2. Upgrade modules theo thứ tự
Apps → nhan_su → Upgrade
Apps → quan_ly_tai_san → Upgrade
Apps → quan_ly_tai_chinh → Upgrade
Apps → q_trang_chu → Upgrade

# 3. Nếu lỗi database:
python odoo-bin -c odoo.conf -d your_db -u all --dev=all
```

---

## ⚠️ LƯU Ý

1. Nếu còn lỗi, hãy paste **traceback đầy đủ** để fix tiếp
2. Một số lỗi chỉ xuất hiện khi có data thực (cần test với dữ liệu)
3. Module `quan_ly_tai_chinh` phụ thuộc vào `quan_ly_tai_san` — cài đúng thứ tự
