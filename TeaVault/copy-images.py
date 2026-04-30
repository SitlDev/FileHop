#!/usr/bin/env python3
"""
TeaVault — Image Copy Script
Run from your own Terminal (not Antigravity):
  python3 /Users/amn/Documents/GitHub/Claude/TeaVault/copy-images.py
"""
import os, shutil

B = "/Users/amn/.gemini/antigravity/brain/1b11ecb9-0200-4698-b03a-9342c5a91438"
D = "/Users/amn/Documents/GitHub/Claude/TeaVault/images"
os.makedirs(D, exist_ok=True)

files = [
    ("hero_tea_garden_1775633055581.png",            "hero.png"),
    ("tea_gyokuro_1775633069580.png",                "tea-gyokuro.png"),
    ("tea_dancong_1775633083422.png",                "tea-dancong.png"),
    ("tea_darjeeling_1775633193493.png",             "tea-darjeeling.png"),
    ("gallery_uji_garden_1775633208050.png",         "gallery-uji.png"),
    ("gallery_gongfu_ceremony_1775633225716.png",    "gallery-gongfu.png"),
    ("gallery_darjeeling_harvest_1775633253513.png", "gallery-darjeeling.png"),
    ("gallery_yixing_clay_1775633270209.png",        "gallery-yixing.png"),
    ("gallery_moroccan_atay_1775633285534.png",      "gallery-morocco.png"),
    ("gallery_japanese_ceremony_1775633312266.png",  "gallery-japan-ceremony.png"),
    ("gallery_taiwan_garden_1775633327947.png",      "gallery-taiwan.png"),
    ("gallery_turkish_cay_1775633343061.png",        "gallery-turkey.png"),
    ("gallery_kenya_estate_1775633371878.png",        "gallery-kenya.png"),
    ("gallery_teapot_market_1775633388418.png",       "gallery-teapot-market.png"),
    ("culture_chado_1775633403446.png",               "culture-japan.png"),
    ("culture_gongfu_1775633435039.png",              "culture-china.png"),
    ("culture_indian_chai_1775633449945.png",         "culture-india.png"),
]

print("📷 Copying TeaVault images into images/ ...")
ok = fail = 0
for src_name, dst_name in files:
    src = os.path.join(B, src_name)
    dst = os.path.join(D, dst_name)
    try:
        shutil.copy2(src, dst)
        size = os.path.getsize(dst) // 1024
        print(f"  ✅ {dst_name}  ({size}KB)")
        ok += 1
    except Exception as e:
        print(f"  ❌ {dst_name}: {e}")
        fail += 1

print(f"\n{'='*50}")
print(f"Done: {ok} copied, {fail} failed")
print(f"Images folder: {D}")
if fail == 0:
    print("\n🎉 Open http://localhost:8765 to see TeaVault with all photos!")
