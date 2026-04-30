#!/bin/bash
# TeaVault — One-time image copy script
# Run this once in your terminal to move the generated images into place:
#   bash /Users/amn/Documents/GitHub/Claude/TeaVault/copy-images.sh

B="/Users/amn/.gemini/antigravity/brain/1b11ecb9-0200-4698-b03a-9342c5a91438"
D="/Users/amn/Documents/GitHub/Claude/TeaVault/images"
mkdir -p "$D"

declare -A files=(
  ["hero_tea_garden_1775633055581.png"]="hero.png"
  ["tea_gyokuro_1775633069580.png"]="tea-gyokuro.png"
  ["tea_dancong_1775633083422.png"]="tea-dancong.png"
  ["tea_darjeeling_1775633193493.png"]="tea-darjeeling.png"
  ["gallery_uji_garden_1775633208050.png"]="gallery-uji.png"
  ["gallery_gongfu_ceremony_1775633225716.png"]="gallery-gongfu.png"
  ["gallery_darjeeling_harvest_1775633253513.png"]="gallery-darjeeling.png"
  ["gallery_yixing_clay_1775633270209.png"]="gallery-yixing.png"
  ["gallery_moroccan_atay_1775633285534.png"]="gallery-morocco.png"
  ["gallery_japanese_ceremony_1775633312266.png"]="gallery-japan-ceremony.png"
  ["gallery_taiwan_garden_1775633327947.png"]="gallery-taiwan.png"
  ["gallery_turkish_cay_1775633343061.png"]="gallery-turkey.png"
  ["gallery_kenya_estate_1775633371878.png"]="gallery-kenya.png"
  ["gallery_teapot_market_1775633388418.png"]="gallery-teapot-market.png"
  ["culture_chado_1775633403446.png"]="culture-japan.png"
  ["culture_gongfu_1775633435039.png"]="culture-china.png"
  ["culture_indian_chai_1775633449945.png"]="culture-india.png"
)

echo "📷 Copying TeaVault images..."
for src in "${!files[@]}"; do
  dst="${files[$src]}"
  if cp "$B/$src" "$D/$dst" 2>/dev/null; then
    echo "  ✅ $dst"
  else
    echo "  ❌ Failed: $dst (source: $src)"
  fi
done
echo ""
echo "Done! Images in: $D"
ls "$D"
