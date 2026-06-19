#!/usr/bin/env python3
"""
Script tạo sequences trực tiếp vào database btl2
Chạy: python3 fix_sequences.py
"""
import sys
sys.path.insert(0, '/mnt/e/HN-QTDN-17-02-N5')

import odoo
from odoo.tools import config

config.parse_config(['-c', '/mnt/e/HN-QTDN-17-02-N5/odoo.conf', '-d', 'btl2'])

with odoo.registry('btl2').cursor() as cr:
    from odoo.api import Environment
    import odoo.modules.registry
    
    uid = odoo.SUPERUSER_ID
    env = Environment(cr, uid, {})
    
    sequences = [
        {
            'name': 'Đơn mượn tài sản',
            'code': 'don_muon_tai_san',
            'prefix': 'DMT',
            'padding': 5,
        },
        {
            'name': 'Phiếu mượn trả tài sản',
            'code': 'muon_tra_tai_san',
            'prefix': 'MTTS',
            'padding': 5,
        },
        {
            'name': 'Kiểm kê tài sản',
            'code': 'kiem_ke_tai_san',
            'prefix': 'KKTS',
            'padding': 5,
        },
        {
            'name': 'Luân chuyển tài sản',
            'code': 'luan_chuyen_tai_san',
            'prefix': 'LCTS',
            'padding': 5,
        },
        {
            'name': 'Thanh lý tài sản',
            'code': 'thanh_ly_tai_san',
            'prefix': 'TLTS',
            'padding': 5,
        },
    ]
    
    IrSeq = env['ir.sequence']
    for seq in sequences:
        existing = IrSeq.search([('code', '=', seq['code'])], limit=1)
        if not existing:
            IrSeq.create({
                'name': seq['name'],
                'code': seq['code'],
                'prefix': seq['prefix'],
                'padding': seq['padding'],
                'number_next': 1,
                'number_increment': 1,
            })
            print(f"✅ Tạo sequence: {seq['code']} ({seq['prefix']}XXXXX)")
        else:
            print(f"⚠️  Đã tồn tại: {seq['code']}")
    
    # Fix các đơn mượn đang có mã 'New' - đặt lại mã unique
    DonMuon = env['don_muon_tai_san']
    don_moi = DonMuon.search([('ma_don_muon', '=', 'New')])
    for i, don in enumerate(don_moi):
        new_ma = IrSeq.next_by_code('don_muon_tai_san') or f'DMT-FIX{i+1:03d}'
        don.write({'ma_don_muon': new_ma})
        print(f"🔧 Fix đơn mượn ID {don.id}: New → {new_ma}")
    
    cr.commit()
    print("\n✅ Hoàn tất! Tất cả sequences đã được tạo.")
