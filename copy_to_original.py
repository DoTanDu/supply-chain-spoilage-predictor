# -*- coding: utf-8 -*-
"""
Script hỗ trợ ghi đè file gốc khi bạn đã đóng file Word:
'Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.docx'
"""
import shutil
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

SRC = "Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor (Ban Hoan Thien Wireframe & Persona).docx"
DEST_1 = "Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor (Ban Cap Nhat Theo Y Thay).docx"
DEST_2 = "Dac Ta He Thong Quan Ly Chuoi Cung Ung Chong Lang Phi - Supply Chain Spoilage Predictor.docx"

if not os.path.exists(SRC):
    print(f"Lỗi: Không tìm thấy file nguồn {SRC}")
    exit(1)

for dest in [DEST_1, DEST_2]:
    try:
        shutil.copyfile(SRC, dest)
        print(f"Thành công! Đã cập nhật file: {dest}")
    except PermissionError:
        print(f"Cảnh báo: File '{dest}' đang được mở bởi Microsoft Word.")
        print("Vui lòng đóng file Word lại rồi chạy lại: py copy_to_original.py")
