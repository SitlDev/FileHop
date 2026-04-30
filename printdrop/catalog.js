/* ═══════════════════════════════════════════════════════════════
   PRINTDROP — PRODUCT CATALOG
   fulfillment: array of providers that carry this item
   ⚠️  = NO THIRD-PARTY FULFILLMENT — must source/ship yourself
   mockupColors: hex swatches available for this product
   basePrice: retail price
   margin: approximate gross margin %
═══════════════════════════════════════════════════════════════ */

const CATALOG = {

  /* ──────────────────────────────────────────
     APPAREL — TOPS
  ────────────────────────────────────────── */
  tee: {
    id: 'tee', label: 'Unisex T-Shirt', category: 'apparel', icon: 'T',
    basePrice: 29.99, margin: 55,
    fulfillment: ['printful','printify','gelato'],
    mapping: {
      essential: 'Gildan 5000',
      retail: 'Bella+Canvas 3001',
      heavyweight: 'Comfort Colors 1717'
    },
    sizes: ['XS','S','M','L','XL','2XL','3XL','4XL'],
    mockupColors: [
      {name:'White',    hex:'#ffffff'}, {name:'Black',     hex:'#111111'},
      {name:'Navy',     hex:'#1d3461'}, {name:'Red',       hex:'#c0392b'},
      {name:'Forest',   hex:'#27ae60'}, {name:'Purple',    hex:'#8e44ad'},
      {name:'Gold',     hex:'#f39c12'}, {name:'Gray',      hex:'#95a5a6'},
      {name:'Sand',     hex:'#e8c4a0'}, {name:'Charcoal',  hex:'#2c3e50'},
      {name:'Sky Blue', hex:'#7ec8e3'}, {name:'Maroon',    hex:'#800020'},
    ],
    printAreas: ['front','back','sleeve'],
    desc: 'Premium 100% cotton unisex tee. Runs true to size.',
  },

  hoodie: {
    id: 'hoodie', label: 'Pullover Hoodie', category: 'apparel', icon: 'H',
    basePrice: 54.99, margin: 51,
    fulfillment: ['printful','printify','gelato'],
    mapping: {
      essential: 'Gildan 18500',
      retail: 'Lane 7 Premium',
      heavyweight: 'Independent Trading Co.'
    },
    sizes: ['XS','S','M','L','XL','2XL','3XL'],
    mockupColors: [
      {name:'Black',    hex:'#111111'}, {name:'White',    hex:'#ffffff'},
      {name:'Navy',     hex:'#1d3461'}, {name:'Gray',     hex:'#95a5a6'},
      {name:'Forest',   hex:'#1a4731'}, {name:'Maroon',   hex:'#800020'},
      {name:'Charcoal', hex:'#2c3e50'}, {name:'Dusty Rose',hex:'#c9a0a0'},
    ],
    printAreas: ['front','back','pocket'],
    desc: '80% cotton / 20% polyester blend. Kangaroo pocket.',
  },

  longsleeve: {
    id: 'longsleeve', label: 'Long Sleeve Tee', category: 'apparel', icon: 'L',
    basePrice: 39.99, margin: 54,
    fulfillment: ['printful','printify','gelato'],
    sizes: ['XS','S','M','L','XL','2XL','3XL'],
    mockupColors: [
      {name:'White',   hex:'#ffffff'}, {name:'Black',   hex:'#111111'},
      {name:'Navy',    hex:'#1d3461'}, {name:'Red',     hex:'#c0392b'},
      {name:'Gray',    hex:'#95a5a6'}, {name:'Forest',  hex:'#27ae60'},
    ],
    printAreas: ['front','back','sleeve'],
    desc: 'Classic long-sleeve in 100% ringspun cotton.',
  },

  croptee: {
    id: 'croptee', label: 'Crop Top Tee', category: 'apparel', icon: 'C',
    basePrice: 32.99, margin: 52,
    fulfillment: ['printful','printify'],
    sizes: ['XS','S','M','L','XL'],
    mockupColors: [
      {name:'White',    hex:'#ffffff'}, {name:'Black',   hex:'#111111'},
      {name:'Pink',     hex:'#f4a0b5'}, {name:'Lavender',hex:'#b39ddb'},
      {name:'Sky',      hex:'#90caf9'}, {name:'Sage',    hex:'#a8d5a2'},
      {name:'Butter',   hex:'#fff59d'},
    ],
    printAreas: ['front'],
    desc: 'Relaxed crop fit. Great for lifestyle and streetwear designs.',
  },

  tanktop: {
    id: 'tanktop', label: 'Tank Top', category: 'apparel', icon: 'TK',
    basePrice: 26.99, margin: 53,
    fulfillment: ['printful','printify'],
    sizes: ['XS','S','M','L','XL','2XL'],
    mockupColors: [
      {name:'White',  hex:'#ffffff'}, {name:'Black',  hex:'#111111'},
      {name:'Navy',   hex:'#1d3461'}, {name:'Red',    hex:'#c0392b'},
      {name:'Gray',   hex:'#95a5a6'},
    ],
    printAreas: ['front','back'],
    desc: 'Lightweight jersey tank. Ideal for gym and summer designs.',
  },

  raglan: {
    id: 'raglan', label: 'Baseball Raglan', category: 'apparel', icon: 'R',
    basePrice: 36.99, margin: 52,
    fulfillment: ['printful','printify'],
    sizes: ['XS','S','M','L','XL','2XL'],
    mockupColors: [
      {name:'White/Black',  hex:'#ffffff', sleeveHex:'#111111'},
      {name:'White/Navy',   hex:'#ffffff', sleeveHex:'#1d3461'},
      {name:'White/Red',    hex:'#ffffff', sleeveHex:'#c0392b'},
      {name:'White/Forest', hex:'#ffffff', sleeveHex:'#27ae60'},
    ],
    printAreas: ['front','back'],
    desc: '3/4 sleeve raglan. Perfect for vintage and sports designs.',
  },

  polo: {
    id: 'polo', label: 'Polo Shirt', category: 'apparel', icon: 'P',
    basePrice: 44.99, margin: 50,
    fulfillment: ['printful','printify'],
    sizes: ['S','M','L','XL','2XL','3XL'],
    mockupColors: [
      {name:'White',    hex:'#ffffff'}, {name:'Black',    hex:'#111111'},
      {name:'Navy',     hex:'#1d3461'}, {name:'Gray',     hex:'#95a5a6'},
      {name:'Red',      hex:'#c0392b'}, {name:'Forest',   hex:'#27ae60'},
    ],
    printAreas: ['left-chest','back'],
    desc: 'Pique cotton polo. Left-chest embroidery recommended.',
  },

  youth_tee: {
    id: 'youth_tee', label: 'Youth T-Shirt', category: 'apparel', icon: 'Y',
    basePrice: 22.99, margin: 50,
    fulfillment: ['printful','printify'],
    sizes: ['XS(4)','S(6-8)','M(10-12)','L(14-16)','XL(18-20)'],
    mockupColors: [
      {name:'White',  hex:'#ffffff'}, {name:'Black',  hex:'#111111'},
      {name:'Red',    hex:'#c0392b'}, {name:'Navy',   hex:'#1d3461'},
      {name:'Royal',  hex:'#4169e1'}, {name:'Gold',   hex:'#f39c12'},
    ],
    printAreas: ['front','back'],
    desc: 'Soft 100% cotton for kids XS–XL.',
  },

  onesie: {
    id: 'onesie', label: 'Baby Onesie', category: 'apparel', icon: 'B',
    basePrice: 19.99, margin: 48,
    fulfillment: ['printful','printify'],
    sizes: ['6M','12M','18M','24M'],
    mockupColors: [
      {name:'White',  hex:'#ffffff'}, {name:'Pink',   hex:'#f4a0b5'},
      {name:'Blue',   hex:'#90caf9'}, {name:'Yellow', hex:'#fff59d'},
    ],
    printAreas: ['front'],
    desc: 'Soft cotton infant onesie. Snap closure.',
  },

  sweatpants: {
    id: 'sweatpants', label: 'Joggers / Sweatpants', category: 'apparel', icon: 'J',
    basePrice: 49.99, margin: 50,
    fulfillment: ['printful','printify'],
    sizes: ['XS','S','M','L','XL','2XL'],
    mockupColors: [
      {name:'Black',    hex:'#111111'}, {name:'Gray',     hex:'#95a5a6'},
      {name:'Navy',     hex:'#1d3461'}, {name:'Charcoal', hex:'#2c3e50'},
    ],
    printAreas: ['left-leg','right-leg','waistband'],
    desc: 'Fleece joggers with elastic waist and cuffs.',
  },

  compression: {
    id: 'compression', label: 'Athletic Compression Shirt', category: 'apparel', icon: 'AC',
    basePrice: 42.99, margin: 48,
    fulfillment: ['printful'],
    sizes: ['XS','S','M','L','XL','2XL'],
    mockupColors: [
      {name:'Black',   hex:'#111111'}, {name:'White',   hex:'#ffffff'},
      {name:'Navy',    hex:'#1d3461'}, {name:'Red',     hex:'#c0392b'},
    ],
    printAreas: ['front','back'],
    desc: 'Moisture-wicking performance fabric. All-over print supported.',
  },

  /* ──────────────────────────────────────────
     HEADWEAR
  ────────────────────────────────────────── */
  snapback: {
    id: 'snapback', label: 'Snapback Cap', category: 'headwear', icon: 'SC',
    basePrice: 34.99, margin: 55,
    fulfillment: ['printful','printify'],
    sizes: ['One Size'],
    mockupColors: [
      {name:'Black',        hex:'#111111'}, {name:'White',        hex:'#ffffff'},
      {name:'Navy',         hex:'#1d3461'}, {name:'Red',          hex:'#c0392b'},
      {name:'Camo',         hex:'#4a5240'}, {name:'Black/White',  hex:'#111111'},
    ],
    printAreas: ['front-panel','back'],
    note: 'Embroidery recommended for best durability. Patch print also available.',
    desc: 'Structured 6-panel cap with flat brim and snapback closure.',
  },

  dadhut: {
    id: 'dadhut', label: 'Dad Hat', category: 'headwear', icon: 'DH',
    basePrice: 29.99, margin: 57,
    fulfillment: ['printful','printify'],
    sizes: ['One Size'],
    mockupColors: [
      {name:'Black',   hex:'#111111'}, {name:'White',   hex:'#ffffff'},
      {name:'Khaki',   hex:'#c3a882'}, {name:'Navy',    hex:'#1d3461'},
      {name:'Pink',    hex:'#f4a0b5'}, {name:'Forest',  hex:'#27ae60'},
    ],
    printAreas: ['front-panel'],
    note: 'Embroidery only on most providers. DTG patch can be applied.',
    desc: 'Unstructured low-profile cap with curved brim. Adjustable strap.',
  },

  beanie: {
    id: 'beanie', label: 'Beanie', category: 'headwear', icon: 'BN',
    basePrice: 27.99, margin: 56,
    fulfillment: ['printful','printify'],
    sizes: ['One Size'],
    mockupColors: [
      {name:'Black',      hex:'#111111'}, {name:'Gray',       hex:'#95a5a6'},
      {name:'Navy',       hex:'#1d3461'}, {name:'Red',        hex:'#c0392b'},
      {name:'Forest',     hex:'#27ae60'}, {name:'Cream',      hex:'#f5f0e8'},
    ],
    printAreas: ['front-patch','all-over'],
    desc: 'Classic cuffed beanie in 100% soft acrylic.',
  },

  bucket_hat: {
    id: 'bucket_hat', label: 'Bucket Hat', category: 'headwear', icon: 'BH',
    basePrice: 32.99, margin: 54,
    fulfillment: ['printful','printify'],
    sizes: ['S/M','L/XL'],
    mockupColors: [
      {name:'Black',   hex:'#111111'}, {name:'White',   hex:'#ffffff'},
      {name:'Tan',     hex:'#c3a882'}, {name:'Navy',    hex:'#1d3461'},
      {name:'Camo',    hex:'#4a5240'}, {name:'Tie-Dye', hex:'#7c3aed'},
    ],
    printAreas: ['all-over','brim'],
    desc: 'Trendy all-over print bucket hat. Big with Gen Z streetwear.',
  },

  trucker_hat: {
    id: 'trucker_hat', label: 'Trucker Hat', category: 'headwear', icon: 'TH',
    basePrice: 31.99, margin: 55,
    fulfillment: ['printful','printify'],
    sizes: ['One Size'],
    mockupColors: [
      {name:'White/Black', hex:'#ffffff'}, {name:'Black/Black', hex:'#111111'},
      {name:'Camo/Black',  hex:'#4a5240'}, {name:'White/Red',   hex:'#ffffff'},
    ],
    printAreas: ['front-foam-panel'],
    desc: 'Foam front with mesh back. Snapback closure.',
  },

  /* ──────────────────────────────────────────
     BAGS & ACCESSORIES
  ────────────────────────────────────────── */
  tote_bag: {
    id: 'tote_bag', label: 'Canvas Tote Bag', category: 'bags', icon: 'TB',
    basePrice: 24.99, margin: 62,
    fulfillment: ['printful','printify','gelato'],
    sizes: ['One Size'],
    mockupColors: [
      {name:'Natural', hex:'#e8d5b7'}, {name:'Black',   hex:'#111111'},
      {name:'White',   hex:'#ffffff'}, {name:'Navy',    hex:'#1d3461'},
    ],
    printAreas: ['front','back'],
    desc: '100% cotton canvas tote. 15L capacity. Machine washable.',
  },

  drawstring: {
    id: 'drawstring', label: 'Drawstring Backpack', category: 'bags', icon: 'DB',
    basePrice: 28.99, margin: 58,
    fulfillment: ['printful','printify'],
    sizes: ['One Size'],
    mockupColors: [
      {name:'Black',   hex:'#111111'}, {name:'White',   hex:'#ffffff'},
      {name:'Navy',    hex:'#1d3461'}, {name:'Red',     hex:'#c0392b'},
    ],
    printAreas: ['front'],
    desc: 'Lightweight polyester drawstring bag. 10L.',
  },

  fanny_pack: {
    id: 'fanny_pack', label: 'Fanny Pack / Belt Bag', category: 'bags', icon: 'FP',
    basePrice: 34.99, margin: 57,
    fulfillment: ['printful','printify'],
    sizes: ['One Size'],
    mockupColors: [
      {name:'Black',   hex:'#111111'}, {name:'White',   hex:'#ffffff'},
      {name:'Tan',     hex:'#c3a882'}, {name:'Tie-Dye', hex:'#7c3aed'},
    ],
    printAreas: ['front'],
    desc: 'All-over print polyester fanny pack. Adjustable strap.',
  },

  backpack: {
    id: 'backpack', label: 'Canvas Backpack', category: 'bags', icon: 'BP',
    basePrice: 59.99, margin: 50,
    fulfillment: ['printful'],
    sizes: ['One Size'],
    mockupColors: [
      {name:'Black',   hex:'#111111'}, {name:'White',   hex:'#ffffff'},
      {name:'Gray',    hex:'#95a5a6'},
    ],
    printAreas: ['front-pocket','main-panel'],
    desc: 'Premium canvas backpack with padded laptop sleeve.',
  },

  /* ──────────────────────────────────────────
     HOME & LIVING
  ────────────────────────────────────────── */
  mug: {
    id: 'mug', label: 'Ceramic Mug', category: 'home', icon: 'MG',
    basePrice: 19.99, margin: 60,
    fulfillment: ['printful','printify','gelato'],
    sizes: ['11oz','15oz'],
    mockupColors: [
      {name:'White',     hex:'#ffffff'}, {name:'Black',     hex:'#111111'},
      {name:'Enamel',    hex:'#d4c5a9'},
    ],
    printAreas: ['wrap','handle-side'],
    desc: 'Dishwasher-safe ceramic mug. Vivid full-color print.',
  },

  travel_mug: {
    id: 'travel_mug', label: 'Travel Tumbler', category: 'home', icon: 'TM',
    basePrice: 34.99, margin: 55,
    fulfillment: ['printful','printify'],
    sizes: ['14oz','20oz'],
    mockupColors: [
      {name:'Black',    hex:'#111111'}, {name:'White',    hex:'#ffffff'},
      {name:'Silver',   hex:'#c0c0c0'}, {name:'Rose Gold', hex:'#b76e79'},
    ],
    printAreas: ['wrap'],
    desc: 'Double-wall insulated tumbler. Keeps drinks hot/cold 12hrs.',
  },

  water_bottle: {
    id: 'water_bottle', label: 'Water Bottle', category: 'home', icon: 'WB',
    basePrice: 29.99, margin: 56,
    fulfillment: ['printful','printify'],
    sizes: ['17oz','32oz'],
    mockupColors: [
      {name:'White',    hex:'#ffffff'}, {name:'Black',    hex:'#111111'},
      {name:'Sky Blue', hex:'#90caf9'},
    ],
    printAreas: ['wrap'],
    desc: 'BPA-free stainless steel. Leak-proof lid.',
  },

  pillow: {
    id: 'pillow', label: 'Throw Pillow', category: 'home', icon: 'PL',
    basePrice: 29.99, margin: 58,
    fulfillment: ['printful','printify'],
    sizes: ['14"x14"','16"x16"','18"x18"','20"x20"'],
    mockupColors: [
      {name:'White',   hex:'#ffffff'}, {name:'Black',   hex:'#111111'},
      {name:'Natural', hex:'#e8d5b7'},
    ],
    printAreas: ['front','both-sides'],
    desc: 'Spun polyester pillowcase. Poly-fill insert included.',
  },

  blanket: {
    id: 'blanket', label: 'Fleece Blanket', category: 'home', icon: 'BL',
    basePrice: 49.99, margin: 52,
    fulfillment: ['printful','printify'],
    sizes: ['50"x60"','60"x80"'],
    mockupColors: [{name:'Full Print', hex:'#cccccc'}],
    printAreas: ['full-surface'],
    desc: 'Super-soft fleece. Full-bleed all-over print.',
  },

  poster: {
    id: 'poster', label: 'Art Print / Poster', category: 'home', icon: 'AP',
    basePrice: 18.99, margin: 65,
    fulfillment: ['printful','printify','gelato'],
    sizes: ['8"x10"','11"x14"','16"x20"','18"x24"','24"x36"'],
    mockupColors: [{name:'Matte White', hex:'#f9f8f5'}],
    printAreas: ['full-surface'],
    desc: '200gsm matte paper. Vivid archival ink. Ships rolled.',
  },

  canvas_print: {
    id: 'canvas_print', label: 'Canvas Wall Art', category: 'home', icon: 'CW',
    basePrice: 44.99, margin: 58,
    fulfillment: ['printful','printify'],
    sizes: ['8"x10"','12"x16"','16"x20"','24"x36"'],
    mockupColors: [{name:'Gallery Wrap', hex:'#ffffff'}],
    printAreas: ['full-surface'],
    desc: 'Gallery-wrapped canvas on pine frame. Ready to hang.',
  },

  phone_case: {
    id: 'phone_case', label: 'Phone Case', category: 'tech', icon: 'PC',
    basePrice: 22.99, margin: 60,
    fulfillment: ['printful','printify'],
    sizes: ['iPhone 15','iPhone 15 Pro','iPhone 14','iPhone 14 Pro','iPhone 13',
            'Samsung S24','Samsung S23','Samsung S22','Samsung A54'],
    mockupColors: [
      {name:'Clear',  hex:'transparent'}, {name:'Matte Black', hex:'#111111'},
    ],
    printAreas: ['back-panel'],
    desc: 'Slim hard case or flexible TPU. Vivid direct-print.',
  },

  laptop_sleeve: {
    id: 'laptop_sleeve', label: 'Laptop Sleeve', category: 'tech', icon: 'LS',
    basePrice: 34.99, margin: 55,
    fulfillment: ['printful','printify'],
    sizes: ['13"','14"','15"','15.6"'],
    mockupColors: [
      {name:'Black',  hex:'#111111'}, {name:'White',  hex:'#ffffff'},
    ],
    printAreas: ['front','back'],
    desc: 'Neoprene sleeve with zipper. Padded inner lining.',
  },

  mousepad: {
    id: 'mousepad', label: 'Mouse Pad', category: 'tech', icon: 'MP',
    basePrice: 16.99, margin: 62,
    fulfillment: ['printful','printify'],
    sizes: ['9"x7"','12"x10"','Large Desk Mat'],
    mockupColors: [{name:'Full Print', hex:'#cccccc'}],
    printAreas: ['full-surface'],
    desc: 'Rubber-backed non-slip surface. Stitched edges.',
  },

  airpods_case: {
    id: 'airpods_case', label: 'AirPods Case', category: 'tech', icon: 'AC2',
    basePrice: 19.99, margin: 58,
    fulfillment: ['printify'],
    sizes: ['AirPods 1/2','AirPods 3','AirPods Pro','AirPods Pro 2'],
    mockupColors: [{name:'Glossy White', hex:'#ffffff'}],
    printAreas: ['full-wrap'],
    desc: 'Hard shell AirPods case. UV print on all surfaces.',
  },

  /* ──────────────────────────────────────────
     NICHE HIGH-MARGIN
  ────────────────────────────────────────── */
  socks: {
    id: 'socks', label: 'Custom Socks', category: 'niche', icon: 'SK',
    basePrice: 17.99, margin: 62,
    fulfillment: ['printful','printify'],
    sizes: ['S/M (US 4-8)','L/XL (US 8-13)'],
    mockupColors: [{name:'Full Print', hex:'#ffffff'}],
    printAreas: ['full-wrap'],
    desc: 'All-over knit print. 75% polyester, soft feel.',
  },

  face_mask: {
    id: 'face_mask', label: 'Face Mask / Gaiter', category: 'niche', icon: 'FM',
    basePrice: 14.99, margin: 60,
    fulfillment: ['printful','printify'],
    sizes: ['One Size'],
    mockupColors: [{name:'Full Print', hex:'#ffffff'}],
    printAreas: ['full-wrap'],
    desc: 'Neck gaiter / tube scarf. All-over sublimation print.',
  },

  apron: {
    id: 'apron', label: 'Custom Apron', category: 'niche', icon: 'AR',
    basePrice: 27.99, margin: 58,
    fulfillment: ['printful','printify'],
    sizes: ['One Size'],
    mockupColors: [
      {name:'White',   hex:'#ffffff'}, {name:'Black',   hex:'#111111'},
      {name:'Natural', hex:'#e8d5b7'},
    ],
    printAreas: ['full-front'],
    desc: 'Adjustable neck strap and waist ties. Great for foodie designs.',
  },

  sticker_sheet: {
    id: 'sticker_sheet', label: 'Sticker Sheet', category: 'niche', icon: 'SS',
    basePrice: 9.99, margin: 68,
    fulfillment: ['printful','printify'],
    sizes: ['4"x6" sheet','6"x6" sheet'],
    mockupColors: [{name:'Full Print', hex:'#ffffff'}],
    printAreas: ['full-sheet'],
    desc: 'Kiss-cut vinyl stickers. Weatherproof and scratch-resistant.',
  },

  greeting_card: {
    id: 'greeting_card', label: 'Greeting Card', category: 'niche', icon: 'GC',
    basePrice: 5.99, margin: 65,
    fulfillment: ['printful','gelato'],
    sizes: ['4"x6"','5"x7"','6"x8"'],
    mockupColors: [{name:'Matte White', hex:'#ffffff'}],
    printAreas: ['front','back','inside'],
    desc: 'Folded matte card with envelope. Inside printable.',
  },

  notebook: {
    id: 'notebook', label: 'Notebook / Journal', category: 'niche', icon: 'NB',
    basePrice: 19.99, margin: 57,
    fulfillment: ['printful','printify'],
    sizes: ['5"x7" (80 pages)','6"x9" (120 pages)'],
    mockupColors: [{name:'Full Cover Print', hex:'#ffffff'}],
    printAreas: ['cover'],
    desc: 'Softcover journal with lined or blank pages.',
  },



  pet_bandana: {
    id: 'pet_bandana', label: 'Pet Bandana', category: 'niche', icon: 'PB',
    basePrice: 16.99, margin: 60,
    fulfillment: ['printify'],
    sizes: ['S (cats/small dogs)','M (medium dogs)','L (large dogs)'],
    mockupColors: [{name:'Full Print', hex:'#ffffff'}],
    printAreas: ['full-surface'],
    desc: 'Sublimation print cotton bandana for pets.',
  },


  wrapping_paper: {
    id: 'wrapping_paper', label: 'Wrapping Paper', category: 'niche', icon: 'WP',
    basePrice: 14.99, margin: 62,
    fulfillment: ['printful'],
    sizes: ['30"x36"','30"x60"'],
    mockupColors: [{name:'Full Print', hex:'#ffffff'}],
    printAreas: ['full-surface'],
    desc: 'Matte finish wrapping paper. Rolled in sheet or roll formats.',
  },

  /* ──────────────────────────────────────────
     BUNDLES (virtual — fulfilled as individual items)
  ────────────────────────────────────────── */
  bundle_starter: {
    id: 'bundle_starter', label: 'Starter Bundle', category: 'bundle',
    icon: '◆', basePrice: 74.99, margin: 48,
    fulfillment: ['printful','printify','gelato'],
    includes: ['tee','tote_bag','sticker_sheet'],
    desc: 'Tee + Tote + Sticker Sheet. Best value intro bundle.',
    badge: 'Save $15',
  },

  bundle_lifestyle: {
    id: 'bundle_lifestyle', label: 'Lifestyle Bundle', category: 'bundle',
    icon: '◆', basePrice: 89.99, margin: 46,
    fulfillment: ['printful','printify'],
    includes: ['hoodie','mug','tote_bag'],
    desc: 'Hoodie + Mug + Tote. Gift-ready lifestyle set.',
    badge: 'Save $19',
  },

  bundle_desk: {
    id: 'bundle_desk', label: 'Desk Bundle', category: 'bundle',
    icon: '◆', basePrice: 69.99, margin: 50,
    fulfillment: ['printful','printify'],
    includes: ['mug','mousepad','notebook'],
    desc: 'Mug + Mouse Pad + Notebook. Perfect WFH gift.',
    badge: 'Save $17',
  },

};

// ── CATEGORY GROUPINGS ──
const PRODUCT_CATEGORIES = [
  { id: 'apparel',  label: 'Apparel',       icon: '◈', products: ['tee','hoodie','longsleeve','croptee','tanktop','raglan','polo','youth_tee','onesie','sweatpants','compression'] },
  { id: 'headwear', label: 'Headwear',       icon: '◇', products: ['snapback','dadhut','beanie','bucket_hat','trucker_hat'] },
  { id: 'bags',     label: 'Bags',           icon: '▣', products: ['tote_bag','drawstring','fanny_pack','backpack'] },
  { id: 'home',     label: 'Home & Living',  icon: '◉', products: ['mug','travel_mug','water_bottle','pillow','blanket','poster','canvas_print'] },
  { id: 'tech',     label: 'Tech',           icon: '□', products: ['phone_case','laptop_sleeve','mousepad','airpods_case'] },
  { id: 'niche',    label: 'Niche Items',    icon: '◆', products: ['socks','face_mask','apron','sticker_sheet','greeting_card','notebook','pet_bandana','wrapping_paper'] },
  { id: 'bundle',   label: 'Bundles',        icon: '✦', products: ['bundle_starter','bundle_lifestyle','bundle_desk'] },
];

// ── FULFILLMENT WARNINGS ──
// Items with empty fulfillment arrays must be sourced independently
const SELF_FULFILL_ITEMS = Object.values(CATALOG).filter(p => p.fulfillment && p.fulfillment.length === 0);

// Export
if (typeof module !== 'undefined') module.exports = { CATALOG, PRODUCT_CATEGORIES, SELF_FULFILL_ITEMS };
