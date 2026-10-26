-- =============================================================================
-- SaMaa'S Collection - Seed Data (Dusty Rose + Burgundy Fashion Edition)
-- 60 Unique Products (10 per category) with 60 DISTINCT, NON-REPEATING image URLs
-- Location: Kolhapur, Maharashtra, India
-- Budget-Friendly Pricing (₹199 - ₹1,499)
-- =============================================================================

USE `samaas_collection`;

-- Clear existing products to ensure clean seed
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM `order_items` WHERE product_id IS NOT NULL;
DELETE FROM `cart_items`;
DELETE FROM `products`;
ALTER TABLE `products` AUTO_INCREMENT = 1;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO `products` (`id`, `name`, `description`, `category`, `price`, `stock_quantity`, `image_url`, `is_featured`, `is_active`, `rating`) VALUES

-- =============================================================================
-- 1. ETHNIC WEAR (10 Items, Prices: ₹699 - ₹1,499)
-- =============================================================================
(
  1,
  'Dusty Rose Georgette Anarkali Suit',
  'Graceful flared Anarkali in soft dusty rose with delicate silver and rose-gold sequin embroidery along the yoke, paired with matching dupatta and pants.',
  'Ethnic Wear',
  1199.00,
  25,
  'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.9
),
(
  2,
  'Deep Burgundy Banarasi Silk Saree',
  'Rich wine-burgundy Banarasi art silk saree woven with antique gold floral motifs and an opulent zari border. Perfect for festive celebrations.',
  'Ethnic Wear',
  1299.00,
  20,
  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.8
),
(
  3,
  'Blush Pink Chanderi Straight Kurta Set',
  'Lightweight breathable Chanderi cotton-silk straight kurta with subtle mirror-work neckline and comfortable flared palazzos.',
  'Ethnic Wear',
  899.00,
  28,
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.7
),
(
  4,
  'Wine Red Embroidered Peplum Sharara',
  'Contemporary party silhouette featuring an embroidered peplum tunic in deep wine with a flared tiered sharara.',
  'Ethnic Wear',
  1399.00,
  15,
  'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.8
),
(
  5,
  'Rose Dust Floral Organza Saree',
  'Delicate semi-sheer organza saree adorned with romantic dusty rose floral digital prints and scalloped embroidered border.',
  'Ethnic Wear',
  1099.00,
  22,
  'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.7
),
(
  6,
  'Daily Wear Cotton Kurti in Berry Rose',
  '100% pure breathable slub cotton everyday kurti with wooden button detail, side slits, and 3/4 sleeves. Ideal for college and work.',
  'Ethnic Wear',
  699.00,
  35,
  'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.6
),
(
  7,
  'Mulmul Angrakha Style Flared Kurta',
  'Traditional crossover Angrakha neckline with handmade tassel ties, tiered flared skirt, and delicate floral motifs on pure mulmul.',
  'Ethnic Wear',
  799.00,
  30,
  'https://images.unsplash.com/photo-1596783049166-5e5d36c1c876?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.7
),
(
  8,
  'Lucknowi Chikankari Kurta in Rose Quartz',
  'Authentic modal Chikankari straight kurta with intricate handmade white shadow threadwork and crochet lace hems.',
  'Ethnic Wear',
  1149.00,
  18,
  'https://images.unsplash.com/photo-1607344645866-009c320b5ab8?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.9
),
(
  9,
  'Plum Wine Bandhani Print Kurta Set',
  'Festive Bandhani printed rayon kurta set in rich plum with ankle-length cigarette pants and chiffon dupatta.',
  'Ethnic Wear',
  999.00,
  24,
  'https://images.unsplash.com/photo-1619086303291-0ef759ab8037?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.6
),
(
  10,
  'Burgundy Velvet Trim Festive Kurti',
  'Lustrous velvet-trimmed festive kurti with zari thread borders and embellished neckline in royal deep maroon-burgundy.',
  'Ethnic Wear',
  1499.00,
  16,
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.8
),

-- =============================================================================
-- 2. WESTERN WEAR (10 Items, Prices: ₹499 - ₹1,299)
-- =============================================================================
(
  11,
  'Dusty Rose Tiered Smocked Midi Dress',
  'Breezy warm-weather midi dress crafted from soft cotton voile with a stretchy smocked bodice, flutter sleeves, and tiered skirt.',
  'Western Wear',
  899.00,
  26,
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.8
),
(
  12,
  'Tailored Burgundy Oversized Blazer',
  'Modern single-breasted blazer in deep burgundy twill with notched lapels and tortoiseshell buttons. Elevates any day-to-night look.',
  'Western Wear',
  1299.00,
  18,
  'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.8
),
(
  13,
  'Wine Satin Wrap Flutter Dress',
  'Flattering wrap silhouette in rich wine red satin featuring a self-tie sash belt, V-neckline, and flutter hem.',
  'Western Wear',
  949.00,
  22,
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.9
),
(
  14,
  'Ribbed Knit Sleeveless Top in Rose Blush',
  'Comfortable stretch-ribbed high-neck tank top in soft rose blush. Perfect for layering under blazers and jackets.',
  'Western Wear',
  499.00,
  40,
  'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.5
),
(
  15,
  'High-Waist Wide Leg Trousers in Maroon',
  'Pleated front formal trousers with deep side pockets and an elasticated back waistband in deep maroon-burgundy.',
  'Western Wear',
  899.00,
  20,
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.7
),
(
  16,
  'Floral Puff Sleeve Peasant Crop Top',
  'Charming square-neck crop blouse with smocked back and elasticized puff sleeves in vintage dusty rose florals.',
  'Western Wear',
  599.00,
  30,
  'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.6
),
(
  17,
  'Bohemian Tiered Ruffle Maxi Dress',
  'Romantic floor-length maxi dress with adjustable tie straps, ruffled tiers, and soft breathable inner lining in dusty pink.',
  'Western Wear',
  1099.00,
  18,
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.9
),
(
  18,
  'Burgundy Belted Utility Jumpsuit',
  'Chic safari-inspired jumpsuit in structured cotton twill with button-down front, lapel collar, and matching fabric belt.',
  'Western Wear',
  1199.00,
  15,
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.7
),
(
  19,
  'A-Line Satin Slip Midi Skirt in Plum',
  'Fluid bias-cut satin skirt with a hidden elastic waistband. Drapes effortlessly and catches the light gracefully.',
  'Western Wear',
  799.00,
  24,
  'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.7
),
(
  20,
  'Relaxed Linen-Blend Shirt in Rose Dust',
  'Classic button-up casual shirt in breathable linen-viscose with drop shoulders and a chest patch pocket.',
  'Western Wear',
  749.00,
  32,
  'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.8
),

-- =============================================================================
-- 3. HANDBAGS (10 Items, Prices: ₹299 - ₹1,199)
-- =============================================================================
(
  21,
  'Quilted Dusty Rose Crossbody Bag',
  'Diamond-quilted premium vegan leather bag with pale gold hardware and an adjustable chain strap. Dual interior compartments.',
  'Handbags',
  799.00,
  28,
  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.9
),
(
  22,
  'Structured Burgundy Top-Handle Handbag',
  'Polished top-handle satchel in rich burgundy pebble-grain finish with gold twist clasp and detachable crossbody strap.',
  'Handbags',
  999.00,
  20,
  'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.8
),
(
  23,
  'Woven Straw Summer Beach & Market Tote',
  'Handwoven natural straw tote accented with rose-hued faux leather handles and an inner drawstring cotton lining.',
  'Handbags',
  699.00,
  32,
  'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.6
),
(
  24,
  'Burgundy Envelope Evening Clutch',
  'Sleek magnetic flap clutch purse with card organizer slots and a detachable gold serpentine shoulder chain.',
  'Handbags',
  549.00,
  35,
  'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.6
),
(
  25,
  'Minimalist 90s Baguette Shoulder Bag',
  'Y2K inspired slim baguette purse in warm rose leather with smooth metal zipper and comfortable curved underarm strap.',
  'Handbags',
  599.00,
  30,
  'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.7
),
(
  26,
  'Slouchy Burgundy Hobo Shoulder Bag',
  'Spacious everyday hobo bag in buttery vegan leather with magnetic closure and comfortable wide strap.',
  'Handbags',
  849.00,
  20,
  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.7
),
(
  27,
  'Croc-Embossed Mini Box Handbag',
  'Glossy crocodile-embossed structured mini bag in deep wine with gold hardware and top grab handle.',
  'Handbags',
  749.00,
  25,
  'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.8
),
(
  28,
  'Casual Heavy Canvas Shoulder Tote',
  'Durable heavy cotton canvas tote with botanical rose motif print and reinforced shoulder straps. Great for books & shopping.',
  'Handbags',
  399.00,
  50,
  'https://images.unsplash.com/photo-1575032617751-6ddec2089882?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.5
),
(
  29,
  'Executive College & Laptop Tote in Wine',
  'Dual-tone burgundy and cream laptop tote fitting up to 14-inch laptops, with padded sleeve and dual zippered compartments.',
  'Handbags',
  1199.00,
  16,
  'https://images.unsplash.com/photo-1564495584622-0a56cb33e6ea?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.9
),
(
  30,
  'Mini Rose Coin & Earphone Pouch',
  'Adorable circular mini accessory pouch crafted in textured faux leather with gold snap hook for keychains.',
  'Handbags',
  299.00,
  45,
  'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.4
),

-- =============================================================================
-- 4. JEWELLERY (10 Items, Prices: ₹249 - ₹899)
-- =============================================================================
(
  31,
  'Freshwater Pearl & Rose Gold Drop Earrings',
  'Natural teardrop baroque pearls hanging from 18k rose-gold plated sterling silver huggie hoops. Hypoallergenic and lightweight.',
  'Jewellery',
  449.00,
  35,
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.9
),
(
  32,
  'Burgundy Meenakari & Kundan Choker Set',
  'Artisanal bridal and festive choker with uncut Kundan stones, rich maroon meenakari detailing, and matching jhumkas.',
  'Jewellery',
  899.00,
  18,
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.8
),
(
  33,
  'Set of 4 Textured Rose Gold Stacking Rings',
  'Assorted minimalist finger rings including twisted rope, hammered band, and smooth midi rings. Adjustable sizing.',
  'Jewellery',
  299.00,
  60,
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.6
),
(
  34,
  'Minimalist Double-Layer Gold Chain Necklace',
  'Dainty layered necklace set with a flat herringbone snake chain and a delicate beaded chain with tiny coin pendant.',
  'Jewellery',
  399.00,
  40,
  'https://images.unsplash.com/photo-1611591475879-c5c76db6e246?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.8
),
(
  35,
  'Rose Quartz Crystal Pendant Necklace',
  'Polished raw rose quartz natural crystal wrapped in dainty wire on a tarnish-resistant stainless steel chain.',
  'Jewellery',
  499.00,
  25,
  'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.7
),
(
  36,
  'Pearl Cluster Floral Stud Earrings',
  'Delicate floral stud earrings crafted with micro ivory pearls surrounding a sparkling burgundy crystal centerpiece.',
  'Jewellery',
  249.00,
  45,
  'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.5
),
(
  37,
  'Garnet Wine Drop Dangle Earrings',
  'Faceted wine-red garnet teardrop stones suspended from delicate hypoallergenic fishhook ear wires.',
  'Jewellery',
  349.00,
  38,
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.7
),
(
  38,
  'Chunky Hollow Lightweight Gold Hoops',
  'Polished lightweight tube hoops in warm gold finish. The quintessential chic everyday earring.',
  'Jewellery',
  349.00,
  45,
  'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.8
),
(
  39,
  'Traditional Kundan Pearl Maang Tikka',
  'Handcrafted forehead jewellery piece with pearl string and floral Kundan pendant, suitable for weddings and festivities.',
  'Jewellery',
  399.00,
  22,
  'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.8
),
(
  40,
  'Beaded Dusty Rose & Pearl Anklet Pair',
  'Pair of bohemian anklets strung with tiny rose seed beads, genuine mother-of-pearl chips, and lobster clasp closure.',
  'Jewellery',
  299.00,
  40,
  'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.6
),

-- =============================================================================
-- 5. FOOTWEAR (10 Items, Prices: ₹549 - ₹1,199)
-- =============================================================================
(
  41,
  'Rose Gold Zari Embroidered Leather Juttis',
  'Handcrafted pure leather mojari juttis padded with double memory foam for comfort. Hand-embroidered with dabka, beads, and sequins.',
  'Footwear',
  899.00,
  26,
  'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.9
),
(
  42,
  'Dusty Rose Sculpted Block Heel Mules',
  'Minimalist slip-on mules featuring buttery faux leather straps, squared open toe, and a comfortable 2-inch block heel.',
  'Footwear',
  949.00,
  20,
  'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.7
),
(
  43,
  'Braided Strap Flat Slide Sandals in Blush',
  'Everyday casual slip-on slides with intricately woven faux leather straps and cushioned footbed in warm blush.',
  'Footwear',
  599.00,
  35,
  'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.6
),
(
  44,
  'Authentic Kolhapuri Chappals with Gold Tassel',
  'Traditional handcrafted pure leather Kolhapuri flat slippers with braided toe loop, anti-slip sole, and metallic gold tassel.',
  'Footwear',
  649.00,
  30,
  'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.8
),
(
  45,
  'Strappy Lace-Up Gladiator Flats in Wine',
  'Chic tie-up flat sandals with soft burgundy straps that wrap comfortably around the ankle.',
  'Footwear',
  699.00,
  22,
  'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.5
),
(
  46,
  'Pointed Toe Slingback Flats in Rose Nude',
  'Elegant Parisian-style pointed toe flats with elasticated slingback strap and cushioned insole. Perfect for formal and office wear.',
  'Footwear',
  849.00,
  18,
  'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.8
),
(
  47,
  'Burgundy Velvet Festive Mojaris',
  'Plush maroon-burgundy velvet slip-ons accented with ghungroo bells and subtle zari work. Padded inner sole prevents shoe bites.',
  'Footwear',
  799.00,
  24,
  'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.7
),
(
  48,
  'Platform Jute Espadrille Sandals',
  'Natural braided jute flatform sole with soft rose canvas upper strap and adjustable buckle closure.',
  'Footwear',
  899.00,
  17,
  'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.6
),
(
  49,
  'Dual-Strap Ergonomic Buckle Slides',
  'Cork-textured ergonomic footbed slides with dual adjustable matte berry straps for all-day walking ease.',
  'Footwear',
  749.00,
  28,
  'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.5
),
(
  50,
  'Burgundy Suede Kitten Heel Pumps',
  'Sleek 1.75-inch kitten heel sandals with rich wine suede finish and delicate crisscross toe straps.',
  'Footwear',
  1099.00,
  14,
  'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.8
),

-- =============================================================================
-- 6. ACCESSORIES (10 Items, Prices: ₹199 - ₹699)
-- =============================================================================
(
  51,
  'Cashmere-Touch Reversible Shawl in Rose & Wine',
  'Ultra-soft fine wool and cashmere blend wrap with understated jacquard motifs and eyelash fringe trims.',
  'Accessories',
  699.00,
  35,
  'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.9
),
(
  52,
  'Pure Mulberry Silk Scrunchies (Pack of 3)',
  'Zero-friction 100% pure silk hair scrunchies in shades of dusty rose, deep burgundy, and warm pearl. Prevents hair breakage.',
  'Accessories',
  299.00,
  60,
  'https://images.unsplash.com/photo-1584297091622-af8e5bd80b13?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.9
),
(
  53,
  'Vintage Tortoiseshell Cat-Eye Sunglasses',
  'Chic retro sunglasses with UV400 protective polarized lenses in amber-tortoise with subtle rose-gold accents.',
  'Accessories',
  499.00,
  40,
  'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.7
),
(
  54,
  'Slim Leather Waist Belt with Gold Buckle',
  'Slim 1.5 cm smooth vegan leather belt in burgundy with polished gold horseshoe buckle. Fits waist 26 to 36 inches.',
  'Accessories',
  349.00,
  45,
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.6
),
(
  55,
  'Printed Chiffon Neck Scarf / Bandana',
  'Square 60x60 cm silky chiffon scarf with romantic botanical floral illustrations. Style around neck, hair, or handbag handle.',
  'Accessories',
  249.00,
  55,
  'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.8
),
(
  56,
  'Padded Velvet Headband in Deep Burgundy',
  'Elevated padded hairband wrapped in soft deep wine velvet. Provides a comfortable, pinch-free fit all day.',
  'Accessories',
  299.00,
  40,
  'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.7
),
(
  57,
  'Embroidered Velvet Potli Bag with Pearl Handle',
  'Traditional drawstring festive potli pouch with pearl beaded handle and delicate golden sequin work on burgundy velvet.',
  'Accessories',
  499.00,
  30,
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  1,
  1,
  4.8
),
(
  58,
  'Pastel Rose Hair Claw Clips (Set of 2)',
  'Matte finish non-slip acetate claw clips with strong spring grip for thick and medium hair in dusty rose and cream.',
  'Accessories',
  199.00,
  65,
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.6
),
(
  59,
  'Woven Straw Sun Hat with Burgundy Ribbon',
  'Foldable wide-brim natural straw sun hat with UPF 50+ sun protection and a delicate wine ribbon tie.',
  'Accessories',
  599.00,
  20,
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.5
),
(
  60,
  'Botanical Scented Wardrobe Sachet Set',
  'Pack of 3 natural linen sachets infused with dried French rose petals, sandalwood, and lavender essential oils.',
  'Accessories',
  249.00,
  50,
  'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80',
  0,
  1,
  4.9
);
