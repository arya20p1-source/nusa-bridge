/**
 * Script sekali-pakai: menambahkan 10 jenis kopi baru (dengan gambar asli
 * baru kopi-11..20) ke katalog 120 produk, jadi total 130 produk.
 * Pelajari struktur objeknya untuk menambah produk sendiri di kemudian hari!
 * Jalankan:  node scripts/add-coffee-products.cjs   (dari folder frontend/)
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', 'data', 'products.js');

const NEW_COFFEES = [
  {
    id: 'prod_kopi_131',
    name: 'Kopi Luwak Sulawesi Toraja (Roasted)',
    category: 'kopi',
    price: 260.0,
    unit: 'Kg',
    moq: 5,
    origin: 'Tana Toraja, Sulawesi Selatan',
    hsCode: '0901.21.20',
    image: '/assets/products/kopi-11.webp',
    desc: 'Kopi luwak autentik hasil seleksi biji dari civet liar Toraja, difermentasi alami dalam saluran pencernaan, dibilas bersih lalu disangrai medium. Aroma cokelat gelap, hint tanaman liar, dan body creamy tanpa rasa pahit kasar.',
    specs: [
      { k: 'Tipe Proses', v: 'Natural Civet Fermentation (Wild Collection)' },
      { k: 'SCA Score', v: '88.0' },
      { k: 'Kadar Air', v: '11.0% - 11.5%' },
      { k: 'Roast Profile', v: 'Medium Roast (Full City)' },
    ],
    certs: ['USDA Organic', 'Wild Collection Certificate', 'Halal BPJPH', 'Lab Test Certificate'],
    shipping: 'FOB Pelabuhan Makassar',
    verifiedExporter: true,
  },
  {
    id: 'prod_kopi_132',
    name: 'Kopi Arabika Malabar Pangalengan (Green Beans)',
    category: 'kopi',
    price: 8.4,
    unit: 'Kg',
    moq: 500,
    origin: 'Pangalengan, Bandung Selatan',
    hsCode: '0901.11.10',
    image: '/assets/products/kopi-12.webp',
    desc: 'Green beans dari kebun Malabar ketinggian 1.400-1.600 mdpl, dikebun rakyat di antara tegakan pinus. Profil jeruk mandarin, gula aren, dan aftertaste floral yang khas dataran tinggi Bandung selatan.',
    specs: [
      { k: 'Tipe Proses', v: 'Green Beans' },
      { k: 'SCA Score', v: '84.0' },
      { k: 'Kadar Air', v: '11.5% - 12.0%' },
      { k: 'Roast Profile', v: 'Unroasted Green' },
    ],
    certs: ['USDA Organic', 'EU Organic', 'Halal BPJPH', 'Lab Test Certificate'],
    shipping: 'FOB Pelabuhan Tanjung Priok',
    verifiedExporter: true,
  },
  {
    id: 'prod_kopi_133',
    name: 'Kopi Robusta Merapi Bantul Natural (Roasted)',
    category: 'kopi',
    price: 6.2,
    unit: 'Kg',
    moq: 1000,
    origin: 'Kaliurang Sleman & Imogiri Bantul, D.I. Yogyakarta',
    hsCode: '0901.21.10',
    image: '/assets/products/kopi-13.webp',
    desc: 'Robusta vulkanik lereng Merapi dengan proses natural full sun-dried. Body tebal, aroma cokelat susu dan kacang panggang, kafein pekat — favorit industri espresso blend dan kopi susu kekinian.',
    specs: [
      { k: 'Tipe Proses', v: 'Natural Process Roasted' },
      { k: 'SCA Score', v: '81.5' },
      { k: 'Kadar Air', v: '11.0% - 11.5%' },
      { k: 'Roast Profile', v: 'Dark Roast (Vienna)' },
    ],
    certs: ['Halal BPJPH', 'Lab Test Certificate', 'Phytosanitary'],
    shipping: 'FOB Pelabuhan Tanjung Priok',
    verifiedExporter: true,
  },
  {
    id: 'prod_kopi_134',
    name: 'Kopi Arabika Sanani Konawe (Green Beans)',
    category: 'kopi',
    price: 10.6,
    unit: 'Kg',
    moq: 300,
    origin: 'Konawe, Sulawesi Tenggara',
    hsCode: '0901.11.10',
    image: '/assets/products/kopi-14.webp',
    desc: 'Sanani adalah varietas lokal paling tua di Sulawesi Tenggara, ditanam sejak era kolonial di ketinggian 900-1.200 mdpl. Cita rasa herbal ringan, cokelat susu, dan keasaman rendah yang ramah di lidah pasar Asia.',
    specs: [
      { k: 'Tipe Proses', v: 'Green Beans' },
      { k: 'SCA Score', v: '83.0' },
      { k: 'Kadar Air', v: '11.5% - 12.0%' },
      { k: 'Roast Profile', v: 'Unroasted Green' },
    ],
    certs: ['EU Organic', 'Halal BPJPH', 'Lab Test Certificate', 'Phytosanitary'],
    shipping: 'FOB Pelabuhan Kendari',
    verifiedExporter: true,
  },
  {
    id: 'prod_kopi_135',
    name: 'Kopi Robusta Pinang Belanda Jambi (Green Beans)',
    category: 'kopi',
    price: 5.8,
    unit: 'Kg',
    moq: 1000,
    origin: 'Muaro Jambi & Kerinci, Jambi',
    hsCode: '0901.11.10',
    image: '/assets/products/kopi-15.webp',
    desc: 'Varietas Pinang Belanda peninggalan sejarah perkebunan Jambi, tumbuh liar di sekitar reruntuhan kota tua Jambi. Rasa nutty manis dengan hint rempah, kafein lebih rendah dibanding robusta umumnya.',
    specs: [
      { k: 'Tipe Proses', v: 'Green Beans' },
      { k: 'SCA Score', v: '82.0' },
      { k: 'Kadar Air', v: '11.5% - 12.0%' },
      { k: 'Roast Profile', v: 'Unroasted Green' },
    ],
    certs: ['Halal BPJPH', 'Lab Test Certificate', 'Phytosanitary'],
    shipping: 'FOB Pelabuhan Palembang',
    verifiedExporter: true,
  },
  {
    id: 'prod_kopi_136',
    name: 'Kopi Arabika Surya Bajo Lombok (Roasted)',
    category: 'kopi',
    price: 9.1,
    unit: 'Kg',
    moq: 200,
    origin: 'Pujut, Lombok Tengah, Nusa Tenggara Barat',
    hsCode: '0901.21.10',
    image: '/assets/products/kopi-16.webp',
    desc: 'Arabika Surya Bajo tumbuh di ketinggian 900-1.300 mdpl menghadap Selat Alas. Profil rasa yang eksotis: kelapa bakar, jeruk keprok, dan cokelat susu dengan keasaman cerah khas iklim kering NTB.',
    specs: [
      { k: 'Tipe Proses', v: 'Washed Roasted' },
      { k: 'SCA Score', v: '84.5' },
      { k: 'Kadar Air', v: '11.0% - 11.5%' },
      { k: 'Roast Profile', v: 'Medium-Light Roast' },
    ],
    certs: ['USDA Organic', 'Halal BPJPH', 'Lab Test Certificate', 'Phytosanitary'],
    shipping: 'FOB Pelabuhan Lembar',
    verifiedExporter: true,
  },
  {
    id: 'prod_kopi_137',
    name: 'Kopi Arabika Lintong Nihuta Toba (Green Beans)',
    category: 'kopi',
    price: 9.5,
    unit: 'Kg',
    moq: 400,
    origin: 'Lintong Nihuta, Samosir, Sumatera Utara',
    hsCode: '0901.11.10',
    image: '/assets/products/kopi-17.webp',
    desc: 'Arabika Sigararutang dari tanah vulkanik berkapur di tepi Danau Toba, ketinggian 1.400 mdpl. Cita rasa herbal, jeruk mandarin, dan cokelat hitam — komoditas ekspor premium favorit roastery Jepang.',
    specs: [
      { k: 'Tipe Proses', v: 'Green Beans' },
      { k: 'SCA Score', v: '85.0' },
      { k: 'Kadar Air', v: '11.0% - 11.5%' },
      { k: 'Roast Profile', v: 'Unroasted Green' },
    ],
    certs: ['EU Organic', 'Halal BPJPH', 'Lab Test Certificate', 'Phytosanitary'],
    shipping: 'FOB Pelabuhan Belawan',
    verifiedExporter: true,
  },
  {
    id: 'prod_kopi_138',
    name: 'Kopi Robusta Petungkriyono Pekalongan (Roasted)',
    category: 'kopi',
    price: 6.9,
    unit: 'Kg',
    moq: 800,
    origin: 'Petungkriyono, Pekalongan, Jawa Tengah',
    hsCode: '0901.21.10',
    image: '/assets/products/kopi-18.webp',
    desc: 'Robusta premium hutan rakyat Petungkriyono ketinggian 1.200 mdpl dengan naungan pohon pinus. Fermentation 36 jam memberi rasa cokelat gelap, karamel, dan sedikit rasa kayu manis alami.',
    specs: [
      { k: 'Tipe Proses', v: 'Semi-Washed (Giling Basah 36 Jam) Roasted' },
      { k: 'SCA Score', v: '82.5' },
      { k: 'Kadar Air', v: '11.0% - 11.5%' },
      { k: 'Roast Profile', v: 'Full City Roast' },
    ],
    certs: ['Halal BPJPH', 'Lab Test Certificate', 'Phytosanitary'],
    shipping: 'FOB Pelabuhan Tanjung Priok',
    verifiedExporter: true,
  },
  {
    id: 'prod_kopi_139',
    name: 'Kopi Arabika Kalibaru Banyuwangi (Roasted)',
    category: 'kopi',
    price: 8.8,
    unit: 'Kg',
    moq: 300,
    origin: 'Kalibaru & Glenmore, Banyuwangi, Jawa Timur',
    hsCode: '0901.21.10',
    image: '/assets/products/kopi-19.webp',
    desc: 'Arabika dari kebun tua pesisir timur Jawa yang menghadap Gunung Ijen. Rasa cokelat susu, jeruk keprok, dan madu ringan dengan body lembut — cocok untuk single origin manual brew maupun retail kemasan.',
    specs: [
      { k: 'Tipe Proses', v: 'Washed Roasted' },
      { k: 'SCA Score', v: '83.5' },
      { k: 'Kadar Air', v: '11.0% - 11.5%' },
      { k: 'Roast Profile', v: 'Medium Roast' },
    ],
    certs: ['Halal BPJPH', 'Lab Test Certificate', 'Phytosanitary'],
    shipping: 'FOB Pelabuhan Tanjung Perak',
    verifiedExporter: true,
  },
  {
    id: 'prod_kopi_140',
    name: 'Kopi Arabika Gayo Wine Process (Roasted)',
    category: 'kopi',
    price: 18.5,
    unit: 'Kg',
    moq: 50,
    origin: 'Bintang & Bener Meriah, Aceh Tengah',
    hsCode: '0901.21.10',
    image: '/assets/products/kopi-20.webp',
    desc: 'Kopi Gayo kelas premium dengan proses anaerobic wine 96 jam tertutup — fermentasi menghasilkan aroma anggur merah, buah tropis, dan rasa manis seperti wine yang sangat dicari specialty roaster Eropa dan Jepang.',
    specs: [
      { k: 'Tipe Proses', v: 'Anaerobic Wine Fermentation 96 Jam (Roasted)' },
      { k: 'SCA Score', v: '89.0' },
      { k: 'Kadar Air', v: '10.5% - 11.0%' },
      { k: 'Roast Profile', v: 'Medium-Light Roast' },
    ],
    certs: ['USDA Organic', 'EU Organic', 'Halal BPJPH', 'Lab Test Certificate'],
    shipping: 'FOB Pelabuhan Belawan',
    verifiedExporter: true,
  },
];

const src = fs.readFileSync(FILE, 'utf8');
const header = src.slice(0, src.indexOf('export const PRODUCTS_DATA'));
const replaced = src.replace('export const PRODUCTS_DATA', 'var PRODUCTS_DATA');
const PRODUCTS_DATA = new Function(`${replaced}; return PRODUCTS_DATA;`)();

const existingIds = new Set(PRODUCTS_DATA.map((p) => p.id));
const added = NEW_COFFEES.filter((p) => !existingIds.has(p.id));
PRODUCTS_DATA.push(...added);

fs.writeFileSync(FILE, `${header}export const PRODUCTS_DATA = ${JSON.stringify(PRODUCTS_DATA, null, 2)};\n`, 'utf8');

const kopiCount = PRODUCTS_DATA.filter((p) => p.category === 'kopi').length;
console.log(`Ditambahkan: ${added.length} produk kopi baru`);
console.log(`Total kopi: ${kopiCount}, total katalog: ${PRODUCTS_DATA.length}`);
