const fs = require('fs');
const path = require('path');

const generate120Products = () => {
  const products = [];

  // 1. KOPI EKSPOR UNGGULAN (30 Produk)
  const coffeeOrigins = [
    { name: "Kopi Arabika Gayo Specialty Grade 1 (Green Beans)", origin: "Takengon, Aceh Tengah", type: "Green Beans", price: 9.8, moq: 1000, roast: "Unroasted Green", score: "85.5", img: "kopi-1.webp" },
    { name: "Kopi Arabika Gayo Peaberry Specialty (Roasted)", origin: "Bener Meriah, Aceh", type: "Roaster", price: 16.5, moq: 300, roast: "Medium Roast", score: "86.0", img: "kopi-2.webp" },
    { name: "Kopi Arabika Mandheling Triple Picked (Green Beans)", origin: "Mandailing Natal, Sumatera Utara", type: "Green Beans", price: 10.2, moq: 1000, roast: "Unroasted Green", score: "85.0", img: "kopi-3.webp" },
    { name: "Kopi Arabika Mandheling Dark Roast Signature", origin: "Lintong Nihuta, Sumatera Utara", type: "Roaster", price: 15.8, moq: 250, roast: "Dark Roast", score: "84.8", img: "kopi-4.webp" },
    { name: "Kopi Arabika Toraja Kalosi Grade 1 (Green Beans)", origin: "Tana Toraja, Sulawesi Selatan", type: "Green Beans", price: 10.5, moq: 1000, roast: "Unroasted Green", score: "86.2", img: "kopi-5.webp" },
    { name: "Kopi Arabika Toraja Sapan Specialty (Roasted)", origin: "Sapan, Toraja Utara", type: "Roaster", price: 17.0, moq: 300, roast: "Medium Light Roast", score: "87.0", img: "kopi-6.webp" },
    { name: "Kopi Arabika Kintamani Bali Washed (Green Beans)", origin: "Kintamani, Bangli, Bali", type: "Green Beans", price: 9.9, moq: 800, roast: "Unroasted Green", score: "85.2", img: "kopi-1.webp" },
    { name: "Kopi Arabika Kintamani Bali Citrus Notes (Roasted)", origin: "Kintamani, Bali", type: "Roaster", price: 16.0, moq: 200, roast: "Medium Roast", score: "85.5", img: "kopi-2.webp" },
    { name: "Kopi Arabika Java Ijen Honey Process (Green Beans)", origin: "Bondowoso, Jawa Timur", type: "Green Beans", price: 9.7, moq: 1000, roast: "Unroasted Green", score: "85.0", img: "kopi-3.webp" },
    { name: "Kopi Arabika Java Preanger Heritage (Roasted)", origin: "Gunung Puntang, Jawa Barat", type: "Roaster", price: 18.2, moq: 200, roast: "Medium Roast", score: "87.5", img: "kopi-4.webp" },
    { name: "Kopi Arabika Flores Bajawa Organic (Green Beans)", origin: "Ngada, Flores, NTT", type: "Green Beans", price: 10.4, moq: 1000, roast: "Unroasted Green", score: "86.0", img: "kopi-5.webp" },
    { name: "Kopi Arabika Flores Bajawa Chocolate Finish (Roasted)", origin: "Bajawa, NTT", type: "Roaster", price: 16.8, moq: 250, roast: "Medium Dark", score: "86.2", img: "kopi-6.webp" },
    { name: "Kopi Arabika Papua Wamena Highland Organic (Green)", origin: "Lembah Baliem, Papua", type: "Green Beans", price: 12.5, moq: 500, roast: "Unroasted Green", score: "88.0", img: "kopi-1.webp" },
    { name: "Kopi Arabika Papua Wamena Wild Forest (Roasted)", origin: "Wamena, Papua Pegunungan", type: "Roaster", price: 19.5, moq: 150, roast: "City Roast", score: "88.2", img: "kopi-2.webp" },
    { name: "Kopi Robusta Dampit Malang Fine Robusta (Green Beans)", origin: "Dampit, Malang, Jawa Timur", type: "Green Beans", price: 4.8, moq: 3000, roast: "Unroasted Green", score: "83.5", img: "kopi-3.webp" },
    { name: "Kopi Robusta Dampit Heavy Body Espresso (Roasted)", origin: "Malang Selatan, Jawa Timur", type: "Roaster", price: 9.5, moq: 500, roast: "Full City Roast", score: "83.8", img: "kopi-4.webp" },
    { name: "Kopi Robusta Temanggung Natural Fine (Green Beans)", origin: "Gunung Sindoro, Temanggung", type: "Green Beans", price: 5.1, moq: 2500, roast: "Unroasted Green", score: "84.0", img: "kopi-5.webp" },
    { name: "Kopi Robusta Temanggung Wine Process (Roasted)", origin: "Temanggung, Jawa Tengah", type: "Roaster", price: 12.0, moq: 300, roast: "Medium Roast", score: "84.5", img: "kopi-6.webp" },
    { name: "Kopi Arabika Sidikalang Grade 1 (Green Beans)", origin: "Dairi, Sumatera Utara", type: "Green Beans", price: 9.6, moq: 1000, roast: "Unroasted Green", score: "84.8", img: "kopi-1.webp" },
    { name: "Kopi Arabika Kerinci Barisan Honey Process (Green)", origin: "Kayu Aro, Kerinci, Jambi", type: "Green Beans", price: 10.8, moq: 800, roast: "Unroasted Green", score: "86.8", img: "kopi-2.webp" },
    { name: "Kopi Arabika Kerinci Cinnamon Roast (Roasted)", origin: "Gunung Kerinci, Jambi", type: "Roaster", price: 17.5, moq: 200, roast: "Cinnamon Roast", score: "87.0", img: "kopi-3.webp" },
    { name: "Kopi Arabika Solok Radjo Washed (Green Beans)", origin: "Solok, Sumatera Barat", type: "Green Beans", price: 9.8, moq: 1000, roast: "Unroasted Green", score: "85.3", img: "kopi-4.webp" },
    { name: "Kopi Arabika Argopuro Honey Micro-lot (Green Beans)", origin: "Gunung Argopuro, Jember", type: "Green Beans", price: 11.2, moq: 500, roast: "Unroasted Green", score: "86.5", img: "kopi-5.webp" },
    { name: "Kopi Arabika Manggarai Flores Specialty (Roasted)", origin: "Manggarai, Flores, NTT", type: "Roaster", price: 16.2, moq: 250, roast: "Medium Roast", score: "85.8", img: "kopi-6.webp" },
    { name: "Kopi Robusta Lampung Super Export Grade (Green Beans)", origin: "Tanggamus, Lampung", type: "Green Beans", price: 4.5, moq: 5000, roast: "Unroasted Green", score: "82.5", img: "kopi-1.webp" },
    { name: "Kopi Robusta Pagar Alam High Altitude (Green Beans)", origin: "Pagar Alam, Sumatera Selatan", type: "Green Beans", price: 4.7, moq: 3000, roast: "Unroasted Green", score: "83.0", img: "kopi-2.webp" },
    { name: "Kopi Arabika Enrekang Kalosi Special Selection (Roasted)", origin: "Enrekang, Sulawesi Selatan", type: "Roaster", price: 16.4, moq: 250, roast: "City Plus", score: "85.6", img: "kopi-3.webp" },
    { name: "Kopi Arabika Toba Lake Peaberry (Green Beans)", origin: "Pangururan, Samosir", type: "Green Beans", price: 11.0, moq: 500, roast: "Unroasted Green", score: "86.0", img: "kopi-4.webp" },
    { name: "Kopi Luwak Liar Gayo Autentik Ekspor (Roasted)", origin: "Gayo Lues, Aceh", type: "Roaster", price: 85.0, moq: 25, roast: "Medium Roast", score: "89.5", img: "kopi-5.webp" },
    { name: "Kopi Arabika Ciwidey Sweet Berries (Roasted)", origin: "Ciwidey, Bandung, Jabar", type: "Roaster", price: 17.8, moq: 200, roast: "Light Medium Roast", score: "86.9", img: "kopi-6.webp" }
  ];

  coffeeOrigins.forEach((c, idx) => {
    products.push({
      id: `prod_kopi_${String(idx + 1).padStart(3, '0')}`,
      name: c.name,
      category: "kopi",
      price: c.price,
      unit: "Kg",
      moq: c.moq,
      origin: c.origin,
      hsCode: c.type === "Green Beans" ? "0901.11.10" : "0901.21.10",
      image: `assets/products/${c.img}`,
      desc: `Komoditas ekspor varian ${c.type} berstandar internasional dengan SCA cupping score ${c.score}, kadar air terkontrol <12%, dan sistem sortasi defect ketat.`,
      specs: [
        { k: "Tipe Proses", v: c.type },
        { k: "SCA Score", v: c.score },
        { k: "Kadar Air", v: c.type === "Green Beans" ? "11.5% - 12.0%" : "<2.5%" },
        { k: "Roast Profile", v: c.roast }
      ],
      certs: ["USDA Organic", "EU Organic", "Rainforest Alliance", "Halal BPJPH"],
      shipping: c.origin.includes("Sumatera") || c.origin.includes("Aceh") ? "FOB Pelabuhan Belawan" : (c.origin.includes("Sulawesi") ? "FOB Pelabuhan Makassar" : "FOB Tanjung Priok / Perak"),
      verifiedExporter: true
    });
  });

  // 2. REMPAH-REMPAH & HASIL ALAM (30 Produk)
  const spiceList = [
    { name: "Cengkeh Lalpari Kering Maluku Grade Super", origin: "Ambon, Maluku", price: 12.5, moq: 1000, hs: "0907.10.00", img: "rempah-1.webp", desc: "Bunga cengkeh kering warna cokelat kemerahan cerah dengan kadar minyak atsiri >19% dan kadar air <11%." },
    { name: "Kayu Manis Korintji Cassia Stick Grade A", origin: "Kerinci, Jambi", price: 8.2, moq: 1500, hs: "0906.11.00", img: "rempah-2.webp", desc: "Kulit kayu manis kering gulung rapi panjang 8-10 cm, aroma pedas manis kuat dan bebas jamur." },
    { name: "Lada Putih Muntok Bangka Double Washed", origin: "Muntok, Bangka Belitung", price: 11.5, moq: 1000, hs: "0904.11.20", img: "rempah-3.webp", desc: "Biji lada putih Muntok terkenal di bursa dunia dengan kepedasan piperin tinggi dan aroma tajam bersih." },
    { name: "Lada Hitam Lampung ASTA Quality", origin: "Lampung Timur", price: 7.8, moq: 2000, hs: "0904.11.10", img: "rempah-4.webp", desc: "Lada hitam kualitas standar American Spice Trade Association (ASTA), kadar air <12% densitas 550g/l." },
    { name: "Vanila Planifolia Papua Gourmet Beans 18-20cm", origin: "Jayapura, Papua", price: 195.0, moq: 25, hs: "0905.10.00", img: "rempah-5.webp", desc: "Batang vanila gourmet berminyak lentur dengan kadar vanilin alami >2.2% dan aroma floral manis mewah." },
    { name: "Pala Banda Super ABCD Tanpa Cangkang", origin: "Kepulauan Banda, Maluku", price: 14.5, moq: 800, hs: "0908.11.00", img: "rempah-6.webp", desc: "Biji pala utuh bulat kualitas ekspor, aroma rempah khas kepulauan rempah legendaris Banda." },
    { name: "Fuli Pala (Mace) Banda Kering Grade 1", origin: "Banda Neira, Maluku", price: 28.0, moq: 300, hs: "0908.21.00", img: "rempah-1.webp", desc: "Selaput biji pala kering warna merah oranye keemasan, aroma intens dan rasa gurih rempah tinggi." },
    { name: "Minyak Nilam Aceh (Patchouli Oil PA >32%)", origin: "Aceh Barat Daya", price: 68.0, moq: 50, hs: "3301.29.90", img: "rempah-2.webp", desc: "Minyak atsiri hasil suling daun nilam tua dengan kandungan Patchouli Alcohol murni >32% untuk parfum global." },
    { name: "Jahe Merah Gajah Rajang Kering (Dried Ginger)", origin: "Temanggung, Jawa Tengah", price: 5.5, moq: 1500, hs: "0910.11.00", img: "rempah-3.webp", desc: "Irisan jahe merah kering oven higienis dengan kadar gingerol pekat dan aroma pedas hangat maksimal." },
    { name: "Kapulaga Putih Jawa Kering (White Cardamom)", origin: "Banyumas, Jawa Tengah", price: 18.5, moq: 500, hs: "0908.31.00", img: "rempah-4.webp", desc: "Polong kapulaga putih kering bersih tanpa pemutih kimia, aroma sitrus mint rempah khas jamu." },
    { name: "Kunyit Temulawak Ekstraksi Curcumin Alami", origin: "Sukoharjo, Jawa Tengah", price: 6.2, moq: 1500, hs: "0910.30.00", img: "rempah-5.webp", desc: "Rimpang kunyit dan temulawak kering kupas dengan kadar curcuminoid alami tinggi siap ekstraksi farmasi." },
    { name: "Bunga Lawang (Star Anise) Utuh Kering", origin: "Sumatera Utara", price: 13.5, moq: 800, hs: "0909.61.10", img: "rempah-6.webp", desc: "Bunga lawang bintang 8 utuh sempurna dengan aroma anethole manis kuat dan warna cokelat mengkilap." },
    { name: "Biji Ketumbar Organik Super Bersih", origin: "Lampung", price: 3.8, moq: 3000, hs: "0909.21.00", img: "rempah-1.webp", desc: "Biji ketumbar kering aroma sitrus lembut, sortasi mekanik bebas kotoran dan batu." },
    { name: "Minyak Serai Wangi (Citronella Oil Java Type)", origin: "Garut, Jawa Barat", price: 24.0, moq: 100, hs: "3301.29.10", img: "rempah-2.webp", desc: "Minyak atsiri serai wangi Java Type dengan kandungan Geraniol >85% dan Citronellal >35%." },
    { name: "Minyak Cengkeh Daun (Clove Leaf Oil Eugenol >80%)", origin: "Purwokerto, Jawa Tengah", price: 21.5, moq: 100, hs: "3301.29.90", img: "rempah-3.webp", desc: "Minyak sulingan daun cengkeh murni untuk bahan baku industri aroma kimia dan farmasi dunia." },
    { name: "Kayu Manis Bubuk Organik (Ground Cassia)", origin: "Padang, Sumatera Barat", price: 7.5, moq: 1000, hs: "0906.20.00", img: "rempah-4.webp", desc: "Bubuk kayu manis halus 80-100 mesh beraroma tajam manis untuk kebutuhan bakery dan bumbu internasional." },
    { name: "Vanila Tahitensis Alor Ekspor Grade", origin: "Alor, NTT", price: 180.0, moq: 30, hs: "0905.10.00", img: "rempah-5.webp", desc: "Batang vanila jenis Tahitensis beraroma fruity floral unik khas kepulauan Alor NTT." },
    { name: "Andaliman Kering Batak Pepper (Wild Zanthoxylum)", origin: "Samosir, Sumatera Utara", price: 32.0, moq: 100, hs: "0910.99.90", img: "rempah-6.webp", desc: "Merica liar khas Danau Toba dengan sensasi getar lidah sitrus aromatik yang diburu chef Michelin dunia." },
    { name: "Kemiri Bulat Kupas Super (Candlenut)", origin: "Flores, NTT", price: 4.8, moq: 2000, hs: "1207.99.90", img: "rempah-1.webp", desc: "Biji kemiri kupas bulat utuh warna putih krem dengan kadar minyak nabati tinggi." },
    { name: "Kayu Secang Rajang NTT (Sappan Wood)", origin: "Sumba, NTT", price: 4.2, moq: 1500, hs: "1404.90.90", img: "rempah-2.webp", desc: "Serutan kayu secang alami penghasil warna merah alami dan antioksidan brazilin tinggi." },
    { name: "Minyak Kayu Putih Asli Pulau Buru (Cajuput Oil)", origin: "Namlea, Pulau Buru, Maluku", price: 35.0, moq: 100, hs: "3301.29.90", img: "rempah-3.webp", desc: "Minyak kayu putih distilasi tradisional daun gelam liar pulau Buru dengan cineol alami >60%." },
    { name: "Cabe Jamu Kering (Long Pepper / Piper Retrofractum)", origin: "Madura, Jawa Timur", price: 8.9, moq: 1000, hs: "0904.11.90", img: "rempah-4.webp", desc: "Lada panjang kering Madura kaya piperin berkhasiat herbal tinggi untuk pasar jamu Jerman & Tiongkok." },
    { name: "Asam Kandis Iris Kering Alami", origin: "Pariaman, Sumatera Barat", price: 3.5, moq: 2000, hs: "0813.40.00", img: "rempah-5.webp", desc: "Irisan buah asam kandis kering matahari beraroma asam pekat untuk bumbu kuliner Asia Tenggara." },
    { name: "Lengkuas Merah Kering Iris (Dried Galangal)", origin: "Purbalingga, Jawa Tengah", price: 4.5, moq: 1500, hs: "0910.99.10", img: "rempah-6.webp", desc: "Rimpang lengkuas merah kering iris higienis bebas jamur untuk industri bumbu dan jamu ekspor." },
    { name: "Kencur Putih Tuban Kering Rajang", origin: "Tuban, Jawa Timur", price: 6.8, moq: 1000, hs: "0910.99.90", img: "rempah-1.webp", desc: "Kencur putih kering iris dengan aroma khas etil p-metoksisinamat pekat." },
    { name: "Minyak Pala Atsiri Murni (Nutmeg Essential Oil)", origin: "Minahasa, Sulawesi Utara", price: 72.0, moq: 50, hs: "3301.29.90", img: "rempah-2.webp", desc: "Minyak atsiri hasil suling biji pala pilihan dengan komponen myristicin dan safrole berstandar ekspor." },
    { name: "Kayu Gaharu Alami Kalimantan (Agarwood Chips)", origin: "Malinau, Kalimantan Utara", price: 450.0, moq: 10, hs: "1211.90.99", img: "rempah-3.webp", desc: "Serpihan kayu gaharu super aroma manis balsam pekat untuk dupa dan aromaterapi Timur Tengah." },
    { name: "Cengkeh Tangkai Kering (Clove Stems)", origin: "Manado, Sulawesi Utara", price: 3.2, moq: 5000, hs: "0907.20.00", img: "rempah-4.webp", desc: "Tangkai bunga cengkeh kering pilihan untuk bahan baku ekstraksi minyak eugenol industri." },
    { name: "Bawang Goreng Sumenep Grade Ekspor", origin: "Sumenep, Madura", price: 7.8, moq: 500, hs: "2005.99.90", img: "rempah-5.webp", desc: "Bawang merah goreng renyah tanpa campuran tepung berlebihan, aroma harum manis tahan lama." },
    { name: "Kayu Cendana Kupang Scented Chips", origin: "Kupang, NTT", price: 210.0, moq: 15, hs: "1211.90.98", img: "rempah-6.webp", desc: "Serpihan kayu cendana merah Kupang kaya santalol alami beraroma wangi kayu abadi." }
  ];

  spiceList.forEach((s, idx) => {
    products.push({
      id: `prod_rempah_${String(idx + 1).padStart(3, '0')}`,
      name: s.name,
      category: "rempah",
      price: s.price,
      unit: s.name.includes("Minyak") ? "Liter" : "Kg",
      moq: s.moq,
      origin: s.origin,
      hsCode: s.hs,
      image: `assets/products/${s.img}`,
      desc: s.desc,
      specs: [
        { k: "Kadar Air", v: s.name.includes("Minyak") ? "Anhydrous" : "<11.5%" },
        { k: "Kadar Kemurnian", v: "99.2% Pure Natural" },
        { k: "Standar Ekspor", v: "ASTA / ISO 9001 Compliant" },
        { k: "Kemasan", v: s.name.includes("Minyak") ? "Aluminium Drum 25/200L" : "Gunny Bag 50Kg / Karton" }
      ],
      certs: ["Phytosanitary Karantina", "FDA Facility Registered", "Halal BPJPH", "Sucofindo CoA"],
      shipping: s.origin.includes("Maluku") || s.origin.includes("Sulawesi") ? "FOB Pelabuhan Makassar" : (s.origin.includes("Sumatera") ? "FOB Belawan / Teluk Bayur" : "FOB Tanjung Priok / Perak"),
      verifiedExporter: true
    });
  });

  // 3. KRIYA & KERAJINAN TANGAN (30 Produk)
  const craftList = [
    { name: "Kursi Rotan Alami Cirebon Lounge Chair", origin: "Cirebon, Jawa Barat", price: 78.0, moq: 40, hs: "9401.52.00", img: "kriya-1.webp", desc: "Kursi santai anyaman rotan alam kelas ekspor dengan rangka kayu solid, finishing non-toxic ramah lingkungan." },
    { name: "Keranjang Laundry Eceng Gondok Kulon Progo", origin: "Kulon Progo, Yogyakarta", price: 18.5, moq: 150, hs: "4602.19.00", img: "kriya-2.webp", desc: "Keranjang pakaian serat eceng gondok kering anti jamur dengan rangka besi kokoh dan pegangan ergonomis." },
    { name: "Mangkuk Batok Kelapa Bali Food-Grade Polished", origin: "Gianyar, Bali", price: 2.8, moq: 500, hs: "4419.90.00", img: "kriya-3.webp", desc: "Mangkuk ramah lingkungan batok kelapa poles minyak kelapa murni tanpa pernis sintetis, aman untuk makanan." },
    { name: "Piring & Mangkok Kayu Jati Jepara Hand-Carved", origin: "Jepara, Jawa Tengah", price: 8.5, moq: 200, hs: "4419.19.00", img: "kriya-4.webp", desc: "Set peralatan makan kayu jati TPK perhutani legal bersertifikat SVLK dengan pola serat alami mewah." },
    { name: "Nampan Saji Kayu Mahoni Solid Eco-Finish", origin: "Klaten, Jawa Tengah", price: 11.2, moq: 150, hs: "4419.90.00", img: "kriya-5.webp", desc: "Nampan saji kayu mahoni kering oven MC <12% dengan lapisan beeswax food-grade tahan air." },
    { name: "Gerabah Terakota Kasongan Vas Dekorasi", origin: "Kasongan, Bantul, Yogyakarta", price: 14.0, moq: 100, hs: "6913.90.00", img: "kriya-6.webp", desc: "Vas bunga kerajinan tanah liat terakota Kasongan teknik pembakaran tradisional tahan cuaca." },
    { name: "Lampu Gantung Anyaman Bambu Tasikmalaya Modern", origin: "Tasikmalaya, Jawa Barat", price: 22.5, moq: 80, hs: "9405.19.00", img: "kriya-1.webp", desc: "Kap lampu gantung interior anyaman serat bambu halus dengan fitting listrik standar CE / UL." },
    { name: "Cermin Dinding Lingkar Kerang Pantai Papua", origin: "Biak, Papua", price: 42.0, moq: 50, hs: "7009.92.00", img: "kriya-2.webp", desc: "Cermin dekorasi dinding kombinasi kerang simping alami laut tropis dengan backing kayu kokoh." },
    { name: "Karpet Area Serat Daun Pandan Kebumen Eco-Rug", origin: "Kebumen, Jawa Tengah", price: 26.0, moq: 60, hs: "5702.20.00", img: "kriya-3.webp", desc: "Karpet lantai anyaman tangan serat daun pandan laut tahan lama, sejuk, dan biodegradable." },
    { name: "Kotak Tisu Anyaman Pelepah Pisang Klaten", origin: "Klaten, Jawa Tengah", price: 6.5, moq: 250, hs: "4602.19.00", img: "kriya-4.webp", desc: "Kotak tisu estetik ramah lingkungan dari serat pelepah pisang abaka kering dengan pelapis anti-rayap." },
    { name: "Set Sendok Garpu Kayu Sawo Halus 5-in-1", origin: "Wonosari, Gunungkidul", price: 3.5, moq: 400, hs: "4419.90.00", img: "kriya-5.webp", desc: "Set sendok garpu kayu sawo warna merah bata natural tanpa pewarna kimia berstandar food contact FDA." },
    { name: "Vas Bunga Keramik Porselen Singkawang Oriental", origin: "Singkawang, Kalimantan Barat", price: 35.0, moq: 60, hs: "6911.10.00", img: "kriya-6.webp", desc: "Vas keramik glasir tungku naga legendaris Singkawang dengan motif naga timbul artistik." },
    { name: "Hiasan Dinding Rotan Cirebon Wall Hanging Mandala", origin: "Cirebon, Jawa Barat", price: 16.5, moq: 100, hs: "4602.12.00", img: "kriya-1.webp", desc: "Dekorasi dinding bohemian motif mandala lingkaran dari rotan manau dan kubu grey natural." },
    { name: "Placemat Meja Makan Serat Rami Mendong Alami", origin: "Tasikmalaya, Jawa Barat", price: 2.2, moq: 600, hs: "4602.19.00", img: "kriya-2.webp", desc: "Tatakan piring meja makan bundar diameter 38 cm anyaman serat mendong tahan panas." },
    { name: "Kursi Malas Rotan Sintetis All-Weather Outdoor", origin: "Cirebon, Jawa Barat", price: 92.0, moq: 30, hs: "9401.79.00", img: "kriya-3.webp", desc: "Kursi santai taman rotan sintetis PE anyaman tangan tahan sinar UV matahari dan air hujan." },
    { name: "Topeng Kayu Batik Tradisional Yogyakarta Ukir", origin: "Bantul, Yogyakarta", price: 19.5, moq: 80, hs: "4420.19.00", img: "kriya-4.webp", desc: "Topeng kayu sengon ukir tangan motif batik klasik Panji Asmorobangun bernilai koleksi tinggi." },
    { name: "Keranjang Buah Anyaman Daun Lontar Rote NTT", origin: "Rote Ndao, NTT", price: 8.5, moq: 200, hs: "4602.19.00", img: "kriya-5.webp", desc: "Keranjang multifungsi anyaman daun lontar kering tahan air tradisi turun-temurun pulau Rote." },
    { name: "Mangkuk Salad Kayu Trembesi Suar Wood Besar", origin: "Sukoharjo, Jawa Tengah", price: 15.0, moq: 120, hs: "4419.19.00", img: "kriya-6.webp", desc: "Mangkuk salad kayu trembesi solid tanpa sambungan dengan alur corak kayu kontras alami." },
    { name: "Tempat Lilin Batok Kelapa Carving Etnik", origin: "Ubud, Bali", price: 4.2, moq: 300, hs: "4420.90.00", img: "kriya-1.webp", desc: "Lampu aromaterapi batok kelapa ukir motif bunga teratai yang memancarkan pendar cahaya indah." },
    { name: "Patung Kayu Jati Relief Budaya Jawa Pahat", origin: "Blora, Jawa Tengah", price: 58.0, moq: 20, hs: "4420.19.00", img: "kriya-2.webp", desc: "Karya seni pahat kayu jati bekas rel kereta kuno berseni tinggi tahan ratusan tahun." },
    { name: "Lampu Meja Anyaman Akar Bambu Artistik", origin: "Magelang, Jawa Tengah", price: 27.5, moq: 60, hs: "9405.29.00", img: "kriya-3.webp", desc: "Lampu meja tidur eksotis dari bonggol akar bambu hutan kering dengan kap kain linen alami." },
    { name: "Coaster Cangkir Kayu Mahoni Laser-Engraved 6-Pcs", origin: "Yogyakarta", price: 6.8, moq: 250, hs: "4419.90.00", img: "kriya-4.webp", desc: "Set tatakan gelas kayu mahoni ukir laser motif geometris batik nusantara lengkap dengan holder." },
    { name: "Tudung Saji Anyaman Bambu Motif Modern Geometris", origin: "Boyolali, Jawa Tengah", price: 12.0, moq: 150, hs: "4602.19.00", img: "kriya-5.webp", desc: "Tudung saji penutup makanan anyaman bambu rapat bebas lalat dan serangga, mudah dibersihkan." },
    { name: "Kotak Perhiasan Cukli Kerang Mutiara Lombok", origin: "Sekarbela, Mataram, NTB", price: 29.0, moq: 70, hs: "4420.90.00", img: "kriya-6.webp", desc: "Kotak perhiasan kayu bertatahkan kerang mutiara teknik cukli khas suku Sasak Lombok." },
    { name: "Hiasan Dinding Makrame Serat Kapas Alami Boho", origin: "Denpasar, Bali", price: 18.0, moq: 100, hs: "6304.99.00", img: "kriya-1.webp", desc: "Dekorasi makrame dinding tali katun unbleached 4mm gaya bohemian dengan gantungan kayu apung." },
    { name: "Sandal Rumah Anyaman Serat Goni Ramah Lingkungan", origin: "Majalengka, Jawa Barat", price: 4.5, moq: 400, hs: "6405.90.00", img: "kriya-2.webp", desc: "Sandal kamar hotel & spa berbahan anyaman serat rami goni dengan sol karet anti slip." },
    { name: "Patung Asmat Kayu Besi Besi Papua Ukir Tangan", origin: "Agats, Asmat, Papua Selatan", price: 120.0, moq: 10, hs: "4420.19.00", img: "kriya-3.webp", desc: "Karya seni ukir magis suku Asmat kayu besi asli bersertifikat kurasi budaya Dinas Kebudayaan." },
    { name: "Keranjang Parcel Anyaman Mendong Tasikmalaya", origin: "Tasikmalaya, Jawa Barat", price: 9.5, moq: 200, hs: "4602.19.00", img: "kriya-4.webp", desc: "Keranjang hampers anyaman mendong kombinasi kulit sintetis premium untuk kemasan gift global." },
    { name: "Nampan Saji Kayu Sonokeling Rosewood Eksotis", origin: "Jepara, Jawa Tengah", price: 21.0, moq: 80, hs: "4419.90.00", img: "kriya-5.webp", desc: "Nampan kayu sonokeling langka warna cokelat gelap keunguan dengan corak serat legendaris." },
    { name: "Miniatur Kapal Pinisi Kayu Jati Kerajinan Makassar", origin: "Bulukumba, Sulawesi Selatan", price: 48.0, moq: 30, hs: "9503.00.00", img: "kriya-6.webp", desc: "Miniatur kapal layar Pinisi warisan maritim dunia UNESCO berbahan kayu jati detail presisi." }
  ];

  craftList.forEach((c, idx) => {
    products.push({
      id: `prod_kriya_${String(idx + 1).padStart(3, '0')}`,
      name: c.name,
      category: "kriya",
      price: c.price,
      unit: "Pcs",
      moq: c.moq,
      origin: c.origin,
      hsCode: c.hs,
      image: `assets/products/${c.img}`,
      desc: c.desc,
      specs: [
        { k: "Material", v: "Eco-Friendly Natural Fibers / Wood" },
        { k: "Sertifikasi Kayu", v: "V-Legal / SVLK Kemenhut" },
        { k: "Finishing", v: "Non-Toxic Food Grade / Water-based" },
        { k: "Fumigasi", v: "ISPM 15 Methyl Bromide Certified" }
      ],
      certs: ["SVLK V-Legal", "Fumigasi ISPM 15", "ISO 9001", "Verifikasi NIB OSS"],
      shipping: c.origin.includes("Bali") ? "FOB Pelabuhan Benoa / Surabaya" : (c.origin.includes("Sulawesi") ? "FOB Makassar" : "FOB Tanjung Priok / Tanjung Perak"),
      verifiedExporter: true
    });
  });

  // 4. TEKSTIL & WASTRA NUSANTARA (30 Produk)
  const textileList = [
    { name: "Batik Tulis Sutra Solo Motif Parang Rusak Barong", origin: "Solo, Jawa Tengah", price: 165.0, moq: 10, hs: "5208.51.00", img: "tekstil-1.webp", desc: "Kain batik tulis canting tembaga di atas sutra alam ATBM 100% dengan malam lebah tradisional." },
    { name: "Batik Tulis Pekalongan Pesisir Buketan Pewarna Alami", origin: "Pekalongan, Jawa Tengah", price: 110.0, moq: 15, hs: "5208.52.00", img: "tekstil-2.webp", desc: "Batik tulis halus ragam hias buket bunga eropa warna alami ekstrak daun indigofera dan kayu tinggi." },
    { name: "Batik Cap Garutan Katun Primissima Warna Pastel", origin: "Garut, Jawa Barat", price: 24.5, moq: 50, hs: "5208.59.00", img: "tekstil-3.webp", desc: "Kain batik cap tembaga presisi warna pastel cerah khas Garutan di atas katun primissima mori." },
    { name: "Batik Tulis Lasem Tiga Negeri Sutra Katun", origin: "Lasem, Rembang, Jawa Tengah", price: 135.0, moq: 12, hs: "5208.51.00", img: "tekstil-4.webp", desc: "Batik legendaris akulturasi Jawa Tionghoa dengan 3 tahap celup warna merah darah ayam, biru, dan sogan." },
    { name: "Batik Tulis Madura Gentongan Warna Berani Klasik", origin: "Tanjungbumi, Bangkalan, Madura", price: 85.0, moq: 20, hs: "5208.52.00", img: "tekstil-5.webp", desc: "Batik celup gentong tanah liat berbulan-bulan dengan warna merah dan biru elektrik tahan puluhan tahun." },
    { name: "Tenun Ikat Troso Jepara Tradisional Benang Katun", origin: "Troso, Jepara, Jawa Tengah", price: 19.5, moq: 60, hs: "5208.42.00", img: "tekstil-6.webp", desc: "Kain tenun pakan ikat ATBM motif etnik nusantara untuk pakaian fashion dan dekorasi interior modern." },
    { name: "Tenun Ikat Sumba NTT Motif Kuda & Rusa Pewarna Alami", origin: "Sumba Timur, NTT", price: 240.0, moq: 8, hs: "5208.41.00", img: "tekstil-1.webp", desc: "Kain tenun sakral motif kuda kepahlawanan tenun tangan 8 bulan dengan akar mengkudu dan lumpur hitam." },
    { name: "Tenun Ikat Flores Ende Tradisional Warna Cokelat", origin: "Ende, Flores, NTT", price: 95.0, moq: 15, hs: "5208.49.00", img: "tekstil-2.webp", desc: "Kain tenun ikat motif geometris khas suku Lio Ende berbahan benang katun pintal tangan lembut." },
    { name: "Songket Palembang Motif Limar Benang Emas 24K", origin: "Palembang, Sumatera Selatan", price: 290.0, moq: 5, hs: "5007.20.00", img: "tekstil-3.webp", desc: "Ratu kain wastra nusantara kombinasi sutra tenun ATBM dan pakan benang emas murni berkilau anggun." },
    { name: "Songket Pandai Sikek Minangkabau Benang Perak", origin: "Pandai Sikek, Tanah Datar, Sumbar", price: 185.0, moq: 10, hs: "5007.90.00", img: "tekstil-4.webp", desc: "Kain songket tenun tangan motif pucuak rabuang dan saik galamai warisan leluhur Minangkabau." },
    { name: "Ulos Batak Toba Ragidup Handwoven Asli", origin: "Tarutung, Tapanuli Utara", price: 145.0, moq: 10, hs: "5208.49.00", img: "tekstil-5.webp", desc: "Kain ulos derajat tertinggi adat Batak dengan 3 panel tenun rumit pembawa doa keberkahan hidup." },
    { name: "Ulos Sadum Batak Karo Warna Cerah Manik-manik", origin: "Kabanjahe, Karo, Sumut", price: 75.0, moq: 20, hs: "5208.42.00", img: "tekstil-6.webp", desc: "Kain ulos ceria penuh warna dengan hiasan benang emas dan ronce manik untuk pesta budaya." },
    { name: "Sasirangan Kalimantan Selatan Katun Sutra Bayam Raja", origin: "Banjarmasin, Kalimantan Selatan", price: 38.0, moq: 40, hs: "5208.52.00", img: "tekstil-1.webp", desc: "Kain jelujur ikat celup khas suku Banjar motif bayam raja warna kuning kunyit dan ungu alami." },
    { name: "Kain Tapis Lampung Sulam Pucuk Rebung Benang Emas", origin: "Bandar Lampung, Lampung", price: 210.0, moq: 8, hs: "5208.41.00", img: "tekstil-2.webp", desc: "Kain tenun katun berhiaskan sulaman benang emas teknik cucuk rapat lambang kehormatan Lampung." },
    { name: "Endek Bali Sutra Tenun ATBM Tradisional Motif Rangrang", origin: "Klungkung, Bali", price: 65.0, moq: 25, hs: "5007.20.00", img: "tekstil-3.webp", desc: "Kain endek sutra ikat pakan Bali motif geometris cerah untuk busana formal dan jas internasional." },
    { name: "Tenun Toraja Tradisional Pulu Motif Pa'tedong", origin: "Kete Kesu, Tana Toraja", price: 125.0, moq: 12, hs: "5208.49.00", img: "tekstil-4.webp", desc: "Kain tenun tebal motif kepala kerbau Pa'tedong lambang kemakmuran dan status terhormat Toraja." },
    { name: "Tenun Gendong Baduy Banten Motif Suwat Songket", origin: "Kanekes, Baduy, Banten", price: 55.0, moq: 30, hs: "5208.41.00", img: "tekstil-5.webp", desc: "Kain tenun alat gendong tradisional Baduy Luar berbahan kapas hutan bebas pestisida dan kimia." },
    { name: "Tenun Sambas Kalimantan Barat Pakan Emas Benang Lunggi", origin: "Sambas, Kalimantan Barat", price: 175.0, moq: 10, hs: "5007.90.00", img: "tekstil-6.webp", desc: "Kain tenun songket melayu Sambas benang lunggi emas motif pucuk rebung kebanggaan Kalbar." },
    { name: "Batik Tulis Cirebon Motif Mega Mendung Biru Klasik", origin: "Trusmi, Cirebon, Jawa Barat", price: 95.0, moq: 15, hs: "5208.51.00", img: "tekstil-1.webp", desc: "Batik motif awan Mega Mendung legendaris dengan 7 gradasi gradien biru laut yang menenangkan." },
    { name: "Tenun Lurik ATBM Klaten Garis Klasik Katun Halus", origin: "Pedan, Klaten, Jawa Tengah", price: 14.5, moq: 80, hs: "5208.42.00", img: "tekstil-2.webp", desc: "Kain tenun lurik garis tradisional Jawa benang katun 100% adem untuk kemeja dan kimono casual." },
    { name: "Batik Tulis Yogyakarta Motif Kawung Prabu Sogan Alami", origin: "Giriloyo, Imogiri, Yogyakarta", price: 120.0, moq: 12, hs: "5208.51.00", img: "tekstil-3.webp", desc: "Batik tulis klasik keraton motif kawung warna sogan kulit pohon tingi dan jambal sakral." },
    { name: "Kain Jumputan Palembang Sutra Alam Pelangi", origin: "Palembang, Sumatera Selatan", price: 42.0, moq: 35, hs: "5007.20.00", img: "tekstil-4.webp", desc: "Kain sutra teknik ikat celup jumputan titik tujuh aneka warna cerah anggun khas Palembang." },
    { name: "Sarung Tenun Goyor Pemalang Ekspor Timur Tengah", origin: "Pemalang, Jawa Tengah", price: 28.0, moq: 50, hs: "5208.43.00", img: "tekstil-5.webp", desc: "Sarung tenun ATBM benang rayon dingin goyor yang sangat diminati di Yaman, Oman, dan Arab Saudi." },
    { name: "Tenun Ikat Alor Flores NTT Pewarna Akar Mengkudu", origin: "Alor, NTT", price: 110.0, moq: 15, hs: "5208.49.00", img: "tekstil-6.webp", desc: "Kain tenun ikat motif kepulauan Alor warna terakota cokelat alami dari rebusan akar mengkudu." },
    { name: "Tenun Buna NTT Motif Tradisional Belu Bertekstur Timbul", origin: "Atambua, Belu, NTT", price: 130.0, moq: 10, hs: "5208.41.00", img: "tekstil-1.webp", desc: "Kain tenun teknik buna mirip sulaman timbul di permukaan kain yang unik dan tahan lama." },
    { name: "Batik Tulis Papua Motif Burung Cendrawasih Asmat", origin: "Jayapura, Papua", price: 105.0, moq: 15, hs: "5208.52.00", img: "tekstil-2.webp", desc: "Kain batik katun motif eksotis burung cendrawasih surga Papua dan tameng perang suku Asmat." },
    { name: "Selendang Songket Silungkang Sawahlunto Benang Tembaga", origin: "Silungkang, Sumatera Barat", price: 78.0, moq: 25, hs: "5208.41.00", img: "tekstil-3.webp", desc: "Selendang songket tenun tangan benang tembaga berkilau hangat khas kota tambang warisan UNESCO." },
    { name: "Kain Tenun Cual Bangka Belitung Tenun Asli Bangka", origin: "Muntok, Bangka Barat", price: 195.0, moq: 8, hs: "5007.90.00", img: "tekstil-4.webp", desc: "Kain cual perpaduan tenun ikat dan songket melayu kuno Bangka berumur ratusan tahun." },
    { name: "Batik Tulis Bakaran Pati Motif Juwana Lautan", origin: "Bakaran, Juwana, Pati, Jateng", price: 72.0, moq: 20, hs: "5208.52.00", img: "tekstil-5.webp", desc: "Batik tulis pesisir Pati motif gandrung laut dengan latar remekan khas yang unik." },
    { name: "Tenun Doyo Kutai Kalimantan Serat Daun Alami", origin: "Kutai Barat, Kalimantan Timur", price: 155.0, moq: 10, hs: "5308.90.00", img: "tekstil-6.webp", desc: "Kain tenun langka dari serat daun tanaman ulap doyo khas suku Dayak Benuaq warna alam." }
  ];

  textileList.forEach((t, idx) => {
    products.push({
      id: `prod_tekstil_${String(idx + 1).padStart(3, '0')}`,
      name: t.name,
      category: "tekstil",
      price: t.price,
      unit: "Meter / Pcs",
      moq: t.moq,
      origin: t.origin,
      hsCode: t.hs,
      image: `assets/products/${t.img}`,
      desc: t.desc,
      specs: [
        { k: "Teknik Pembuatan", v: "100% Handcrafted ATBM / Canting Tulis" },
        { k: "Material Benang", v: "Silk / 100% Mercerized Cotton" },
        { k: "Zat Pewarna", v: "Natural Plant Extract / Eco-Reactive Safe" },
        { k: "Dimensi Standar", v: "220 cm x 115 cm per lembar" }
      ],
      certs: ["Batik Mark Indonesia", "OEKO-TEX Standard 100", "Indonesian Heritage Certified", "Verifikasi NIB OSS"],
      shipping: t.origin.includes("Sumatera") ? "FOB Belawan / Teluk Bayur" : (t.origin.includes("Bali") || t.origin.includes("NTT") ? "FOB Benoa / Surabaya" : "FOB Tanjung Priok / Perak"),
      verifiedExporter: true
    });
  });

  return products;
};

const fullProducts = generate120Products();
console.log(`Generated ${fullProducts.length} products.`);

// Tulis ke database/products.json
fs.writeFileSync('e:/nusa-bridge/database/products.json', JSON.stringify(fullProducts, null, 2), 'utf-8');
console.log('Saved to e:/nusa-bridge/database/products.json');

// Tulis ke frontend/js/products-data.js dan js/products-data.js
const jsContent = `/**
 * NUSABRIDGE - 120 PRODUK KOMODITAS EKSPOR TERVERIFIKASI KYC HUB
 * Kategori: Kopi Ekspor (30), Rempah & Hasil Alam (30), Kriya (30), Tekstil (30)
 */
const PRODUCTS_DATA = ${JSON.stringify(fullProducts, null, 2)};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PRODUCTS_DATA;
}
`;

fs.writeFileSync('e:/nusa-bridge/frontend/js/products-data.js', jsContent, 'utf-8');
fs.writeFileSync('e:/nusa-bridge/js/products-data.js', jsContent, 'utf-8');
console.log('Saved to frontend/js/products-data.js and js/products-data.js');
