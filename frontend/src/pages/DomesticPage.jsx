import { useEffect, useMemo, useState } from 'react';

import { useApp } from '../context/AppContext.jsx';
import {
  CITIES,
  DOMESTIC_COMPLIANCE,
  DOMESTIC_STATUS_FLOW,
  PAYMENT_OPTIONS,
  PROVINCES,
  SHIPPING_OPTIONS,
  buildDomesticOffers,
  calcOrderTotals,
  formatIDR,
  getCity,
  makeEscrowStages,
  makeOrderNo,
  nextStatus,
  provinceName,
  statusTone,
} from '../data/domestic.js';
import { downloadHtmlFile } from '../utils/downloadHtmlFile.js';
import '../styles/domestic.css';

/**
 * ==========================================================================
 * NUSABRIDGE - HALAMAN PERDAGANGAN DOMESTIK UMKM
 * File: src/pages/DomesticPage.jsx
 *
 * Alur:
 * - Pembeli UMKM memilih produk lokal, memesan dalam IDR, memilih kurir
 *   lokal/antarpulau, lalu memantau escrow 4 fase dan dokumen domestik.
 * - Penjual UMKM mendaftarkan produknya agar tampil di katalog domestik.
 *
 * Data demo disimpan di localStorage. Saat Supabase aktif, tabel pada
 * backend/database/domestic-trade.sql menjadi sumber data sebenarnya.
 * ==========================================================================
 */

const CATEGORY_LABELS = {
  all: 'Semua Kategori',
  kopi: 'Kopi',
  rempah: 'Rempah & Hasil Alam',
  kriya: 'Kriya & Kerajinan',
  tekstil: 'Tekstil & Wastra',
};

const CATEGORY_LABELS_EN = {
  all: 'All Categories',
  kopi: 'Coffee',
  rempah: 'Spices & Natural Products',
  kriya: 'Crafts & Handicrafts',
  tekstil: 'Textiles & Wastra',
};

function categoryLabel(key, isEn) {
  const map = isEn ? CATEGORY_LABELS_EN : CATEGORY_LABELS;
  return map[key] || (isEn ? 'Commodity' : 'Komoditas');
}

const LS_LISTINGS = 'nusabridge_domestic_listings';
const LS_ORDERS = 'nusabridge_domestic_orders';

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_) {
    return iso;
  }
}

function statusLabel(status, isEn) {
  if (!isEn) return status;
  const map = {
    'Menunggu Pembayaran': 'Awaiting Payment',
    Dibayar: 'Paid',
    Diproses: 'Processing',
    Dikirim: 'Shipped',
    Selesai: 'Completed',
  };
  return map[status] || status;
}

function docTitle(type, isEn) {
  const map = {
    PO: { id: 'Purchase Order', en: 'Purchase Order' },
    Invoice: { id: 'Invoice', en: 'Invoice' },
    'Surat Jalan': { id: 'Surat Jalan', en: 'Delivery Note' },
    BAST: { id: 'Berita Acara Serah Terima', en: 'Handover Report' },
  };
  return map[type] ? map[type][isEn ? 'en' : 'id'] : type;
}

function buildDocHtml(order, type) {
  const rows = [
    ['No. Pesanan', order.orderNo],
    ['Tanggal', formatDate(order.createdAt)],
    ['Penjual', order.seller],
    ['Pembeli', order.buyerName],
    ['Produk', order.productName],
    ['Jumlah', `${order.quantity} ${order.unit}`],
    ['Harga Satuan', formatIDR(order.unitPriceIdr)],
    ['Subtotal', formatIDR(order.subtotal)],
    ['Ongkos Kirim', formatIDR(order.shippingCost)],
    ['PPN 11%', formatIDR(order.tax)],
    ['Total', formatIDR(order.total)],
    ['Tujuan', `${order.buyerCity}, ${order.buyerAddress}`],
    ['Metode Kirim', order.shippingMethod],
    ['Pembayaran', order.paymentMethod],
  ];

  return `
    <div class="header">
      <div>
        <div class="title">${docTitle(type, false)}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">NusaBridge — Perdagangan Domestik UMKM</div>
      </div>
      <div class="seal">NUSABRIDGE</div>
    </div>
    <table>
      ${rows.map(([k, v]) => `<tr><th style="width:34%">${k}</th><td>${v}</td></tr>`).join('')}
    </table>
    <p style="font-size:12px;color:#64748b;">Dokumen ini dibuat otomatis oleh NusaBridge sebagai simulasi perdagangan domestik UMKM. Bukan dokumen resmi.</p>
    <div class="footer">
      <span>NusaBridge — Tim Arjika Labs</span>
      <span>${order.orderNo}</span>
    </div>
  `;
}

export default function DomesticPage() {
  const { lang, session, showToast } = useApp();
  const isEn = lang === 'en';
  const L = (id, en) => (isEn ? en : id);

  const [tab, setTab] = useState('beli');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [province, setProvince] = useState('all');
  const [sort, setSort] = useState('popular');
  const [listings, setListings] = useState(() => readLS(LS_LISTINGS, []));
  const [orders, setOrders] = useState(() => readLS(LS_ORDERS, []));
  const [checkout, setCheckout] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => writeLS(LS_LISTINGS, listings), [listings]);
  useEffect(() => writeLS(LS_ORDERS, orders), [orders]);

  const offers = useMemo(() => buildDomesticOffers(undefined, listings).map((offer) => ({
    ...offer,
    nameId: offer.name,
    name: isEn ? (offer.nameEn || offer.name) : offer.name,
    province: isEn ? (offer.provinceEn || offer.province) : offer.province,
    description: isEn ? (offer.descriptionEn || offer.description) : offer.description,
  })), [listings, isEn]);

  const filtered = useMemo(() => {
    let list = offers.filter((offer) => {
      const matchSearch =
        !search ||
        offer.name.toLowerCase().includes(search.toLowerCase()) ||
        (offer.nameId || '').toLowerCase().includes(search.toLowerCase()) ||
        (offer.nameEn || '').toLowerCase().includes(search.toLowerCase()) ||
        offer.seller.toLowerCase().includes(search.toLowerCase()) ||
        offer.origin.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === 'all' || offer.category === category;
      const matchProvince = province === 'all' || offer.provinceId === province;
      return matchSearch && matchCategory && matchProvince;
    });

    if (sort === 'cheap') list = [...list].sort((a, b) => a.priceIdr - b.priceIdr);
    else if (sort === 'expensive') list = [...list].sort((a, b) => b.priceIdr - a.priceIdr);
    else if (sort === 'stock') list = [...list].sort((a, b) => b.stock - a.stock);
    else list = [...list].sort((a, b) => b.sold - a.sold);

    return list;
  }, [offers, search, category, province, sort]);

  const stats = useMemo(() => {
    const sellers = new Set(offers.map((o) => o.seller));
    const totalValue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    return {
      products: offers.length,
      sellers: sellers.size,
      orders: orders.length,
      value: totalValue,
    };
  }, [offers, orders]);

  function openCheckout(offer) {
    setCheckout({
      offer,
      quantity: offer.moq,
      toCityId: session?.city || 'jakarta',
      shippingMethod: offer.island === 'Jawa' ? 'local' : 'interisland',
      paymentMethod: 'escrow',
      buyerName: session?.company || session?.name || '',
      buyerPhone: session?.phone || '',
      buyerAddress: '',
    });
  }

  function updateCheckout(patch) {
    setCheckout((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  const checkoutTotals = useMemo(() => {
    if (!checkout) return null;
    return calcOrderTotals({
      offer: checkout.offer,
      quantity: checkout.quantity,
      toCityId: checkout.toCityId,
      shippingMethod: checkout.shippingMethod,
    });
  }, [checkout]);

  function submitOrder(e) {
    e.preventDefault();
    if (!checkout || !checkoutTotals) return;
    if (!checkout.buyerName.trim() || !checkout.buyerAddress.trim()) {
      showToast(L('Nama pembeli dan alamat wajib diisi.', 'Buyer name and address are required.'));
      return;
    }

    const orderNo = makeOrderNo();
    const now = new Date().toISOString();
    const shippingOption = SHIPPING_OPTIONS.find((s) => s.id === checkout.shippingMethod) || SHIPPING_OPTIONS[0];
    const paymentOption = PAYMENT_OPTIONS.find((p) => p.id === checkout.paymentMethod) || PAYMENT_OPTIONS[0];

    const order = {
      id: orderNo,
      orderNo,
      createdAt: now,
      buyerName: checkout.buyerName.trim(),
      buyerPhone: checkout.buyerPhone.trim(),
      buyerAddress: checkout.buyerAddress.trim(),
      buyerCity: getCity(checkout.toCityId).name,
      seller: checkout.offer.seller,
      sellerCity: checkout.offer.city,
      productId: checkout.offer.productId,
      productName: checkout.offer.name,
      image: checkout.offer.image,
      quantity: checkoutTotals.quantity,
      unit: checkout.offer.unit,
      unitPriceIdr: checkout.offer.priceIdr,
      subtotal: checkoutTotals.subtotal,
      shippingCost: checkoutTotals.shippingCost,
      tax: checkoutTotals.tax,
      total: checkoutTotals.total,
      shippingMethod: isEn ? shippingOption.label.en : shippingOption.label.id,
      shippingDays: checkoutTotals.shippingDays,
      paymentMethod: isEn ? paymentOption.label.en : paymentOption.label.id,
      status: 'Menunggu Pembayaran',
      escrow: makeEscrowStages(checkoutTotals.total),
      timeline: [{ status: 'Menunggu Pembayaran', at: now }],
    };

    setOrders((prev) => [order, ...prev]);
    setCheckout(null);
    setDetail(order);
    setTab('pesanan');
    showToast(L('Pesanan domestik berhasil dibuat.', 'Domestic order created.'));
  }

  function updateOrder(nextOrder) {
    setOrders((prev) => prev.map((o) => (o.id === nextOrder.id ? nextOrder : o)));
    setDetail((prev) => (prev && prev.id === nextOrder.id ? nextOrder : prev));
  }

  function advanceOrder(order) {
    const next = nextStatus(order.status);
    if (next === order.status) return;
    const updated = {
      ...order,
      status: next,
      timeline: [...order.timeline, { status: next, at: new Date().toISOString() }],
    };
    updateOrder(updated);
    showToast(`${L('Status pesanan', 'Order status')}: ${statusLabel(next, isEn)}`);
  }

  function releaseEscrow(order, stage) {
    const index = order.escrow.findIndex((item) => item.stage === stage);
    if (index < 0) return;
    if (stage > 1 && order.escrow[stage - 2].status !== 'released') {
      showToast(L('Selesaikan fase sebelumnya dulu.', 'Release the previous stage first.'));
      return;
    }
    const escrow = order.escrow.map((item, i) =>
      i === index ? { ...item, status: 'released' } : item
    );
    updateOrder({ ...order, escrow });
    showToast(`${L('Dana fase', 'Stage')} ${stage} ${L('dicairkan.', 'released.')}`);
  }

  function downloadDocument(order, type) {
    downloadHtmlFile(
      `${type.replace(/\s+/g, '-')}-${order.orderNo}.html`,
      `${docTitle(type, isEn)} ${order.orderNo}`,
      buildDocHtml(order, type)
    );
    showToast(`${docTitle(type, isEn)} ${L('diunduh.', 'downloaded.')}`);
  }

  function deleteListing(id) {
    setListings((prev) => prev.filter((item) => item.id !== id));
    showToast(L('Produk dihapus dari katalog domestik.', 'Product removed from domestic catalog.'));
  }

  return (
    <main className="dom-page">
      <section className="dom-hero">
        <div className="site-container dom-hero-inner">
          <div>
            <span className="pill-badge pill-blue">
              {L('PERDAGANGAN DOMESTIK UMKM', 'INDONESIAN SME DOMESTIC TRADE')}
            </span>
            <h1 className="dom-hero-title">
              {L('UMKM Indonesia', 'Indonesian SMEs')}{' '}
              <span className="text-accent">{L('saling membeli', 'buy from each other')}</span>
              {L(', tanpa harus ekspor.', ', without exporting.')}
            </h1>
            <p className="dom-hero-sub">
              {L(
                'Jual dan beli produk UMKM antar kota dan antar pulau dalam Rupiah. Dilengkapi escrow 4 fase, dokumen domestik otomatis, dan pelacakan pengiriman.',
                'Buy and sell SME products across cities and islands in Rupiah. Includes 4-phase escrow, automatic domestic documents, and shipment tracking.'
              )}
            </p>
            <div className="dom-hero-actions">
              <button type="button" className="btn btn-primary" onClick={() => setTab('beli')}>
                {L('Belanja Produk Lokal', 'Shop Local Products')}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setTab('jual')}>
                {L('Jual Produk Saya', 'Sell My Product')}
              </button>
            </div>
          </div>
          <div className="dom-hero-card">
            <div className="dom-hero-card-head">
              <span className="dom-dot" />
              <strong>{L('Escrow Domestik', 'Domestic Escrow')}</strong>
            </div>
            <div className="dom-hero-card-row"><span>30%</span><small>{L('Pesanan dikonfirmasi', 'Order confirmed')}</small></div>
            <div className="dom-hero-card-row"><span>30%</span><small>{L('Barang siap / surat jalan', 'Goods ready / delivery note')}</small></div>
            <div className="dom-hero-card-row"><span>20%</span><small>{L('Barang dalam perjalanan', 'In transit')}</small></div>
            <div className="dom-hero-card-row"><span>20%</span><small>{L('Barang diterima', 'Delivered')}</small></div>
            <p className="dom-hero-card-note">
              {L('Dana aman sampai barang diterima.', 'Funds are safe until delivery.')}
            </p>
          </div>
        </div>
      </section>

      <section className="site-container dom-body">
        <div className="dom-stats">
          <div className="dom-stat"><strong>{stats.products}</strong><span>{L('Produk domestik', 'Domestic products')}</span></div>
          <div className="dom-stat"><strong>{stats.sellers}</strong><span>{L('UMKM penjual', 'SME sellers')}</span></div>
          <div className="dom-stat"><strong>{stats.orders}</strong><span>{L('Pesanan dibuat', 'Orders created')}</span></div>
          <div className="dom-stat"><strong>{formatIDR(stats.value)}</strong><span>{L('Nilai transaksi', 'Transaction value')}</span></div>
        </div>

        <div className="dom-tabs" role="tablist" aria-label={L('Navigasi perdagangan domestik', 'Domestic trade navigation')}>
          <button type="button" className={`dom-tab ${tab === 'beli' ? 'active' : ''}`} onClick={() => setTab('beli')}>
            {L('Beli dari UMKM', 'Buy from SMEs')}
          </button>
          <button type="button" className={`dom-tab ${tab === 'jual' ? 'active' : ''}`} onClick={() => setTab('jual')}>
            {L('Jual Produk', 'Sell Product')}
          </button>
          <button type="button" className={`dom-tab ${tab === 'pesanan' ? 'active' : ''}`} onClick={() => setTab('pesanan')}>
            {L('Pesanan Saya', 'My Orders')} {orders.length > 0 && <span className="dom-tab-count">{orders.length}</span>}
          </button>
        </div>

        {tab === 'beli' && (
          <>
            <div className="dom-toolbar">
              <input
                type="search"
                className="dom-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={L('Cari produk, UMKM, atau daerah...', 'Search product, SME, or region...')}
              />
              <select className="dom-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {Object.entries(isEn ? CATEGORY_LABELS_EN : CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{L(label, key === 'all' ? 'All categories' : label)}</option>
                ))}
              </select>
              <select className="dom-select" value={province} onChange={(e) => setProvince(e.target.value)}>
                <option value="all">{L('Semua Provinsi', 'All provinces')}</option>
                {PROVINCES.map((p) => (
                  <option key={p.id} value={p.id}>{provinceName(p.id, isEn)}</option>
                ))}
              </select>
              <select className="dom-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="popular">{L('Terlaris', 'Best selling')}</option>
                <option value="cheap">{L('Harga terendah', 'Lowest price')}</option>
                <option value="expensive">{L('Harga tertinggi', 'Highest price')}</option>
                <option value="stock">{L('Stok terbanyak', 'Most stock')}</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="dom-empty">
                <strong>{L('Produk tidak ditemukan.', 'No products found.')}</strong>
                <p>{L('Coba ubah kata kunci atau filter wilayah.', 'Try changing the keyword or region filter.')}</p>
              </div>
            ) : (
              <div className="dom-grid">
                {filtered.map((offer) => (
                  <article className="dom-card" key={offer.id}>
                    <div className="dom-card-media">
                      <img src={offer.image} alt={offer.name} loading="lazy" />
                      <span className="dom-card-badge">{categoryLabel(offer.category, isEn)}</span>
                    </div>
                    <div className="dom-card-body">
                      <h3 className="dom-card-title">{offer.name}</h3>
                      <p className="dom-card-seller">{offer.seller}</p>
                      <p className="dom-card-origin">📍 {offer.origin} · {offer.province}</p>
                      <div className="dom-card-price">
                        {formatIDR(offer.priceIdr)} <span>/{offer.unit}</span>
                      </div>
                      <div className="dom-card-meta">
                        <span>MOQ {offer.moq} {offer.unit}</span>
                        <span>{L('Stok', 'Stock')} {offer.stock}</span>
                        <span>★ {offer.rating.toFixed(1)}</span>
                      </div>
                      <div className="dom-card-foot">
                        <span className="dom-card-ship">🚚 {L('Kirim dari', 'Ships from')} {offer.city}</span>
                        <button type="button" className="btn btn-primary dom-buy-btn" onClick={() => openCheckout(offer)}>
                          {L('Beli', 'Buy')}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="dom-compliance">
              <h3>{L('Kepatuhan domestik yang dicek', 'Domestic compliance checked')}</h3>
              <div className="dom-compliance-grid">
                {DOMESTIC_COMPLIANCE.map((item) => (
                  <div className="dom-compliance-item" key={item.id}>
                    <strong>{item.label}</strong>
                    <span>{item.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'jual' && (
          <SellerPanel
            isEn={isEn}
            session={session}
            listings={listings}
            onAdd={(listing) => setListings((prev) => [listing, ...prev])}
            onDelete={deleteListing}
            showToast={showToast}
          />
        )}

        {tab === 'pesanan' && (
          <div className="dom-orders">
            {orders.length === 0 ? (
              <div className="dom-empty">
                <strong>{L('Belum ada pesanan.', 'No orders yet.')}</strong>
                <p>{L('Buat pesanan pertama dari tab Beli dari UMKM.', 'Create your first order from the Buy from SMEs tab.')}</p>
              </div>
            ) : (
              orders.map((order) => (
                <article className="dom-order-card" key={order.id}>
                  <img src={order.image} alt={order.productName} />
                  <div className="dom-order-main">
                    <div className="dom-order-head">
                      <strong>{order.orderNo}</strong>
                      <span className={`dom-status ${statusTone(order.status)}`}>{statusLabel(order.status, isEn)}</span>
                    </div>
                    <p>{order.productName}</p>
                    <small>{order.seller} → {order.buyerName}, {order.buyerCity}</small>
                    <small>{formatDate(order.createdAt)} · {order.quantity} {order.unit}</small>
                  </div>
                  <div className="dom-order-side">
                    <strong>{formatIDR(order.total)}</strong>
                    <button type="button" className="btn btn-outline" onClick={() => setDetail(order)}>
                      {L('Detail', 'Details')}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </section>

      {checkout && checkoutTotals && (
        <div className="modal-overlay show active" onClick={(e) => { if (e.target === e.currentTarget) setCheckout(null); }}>
          <div className="modal-card dom-modal">
            <button type="button" className="modal-close-btn" onClick={() => setCheckout(null)}>&times;</button>
            <div className="dom-modal-head">
              <span className="pill-badge pill-blue">{L('CHECKOUT DOMESTIK', 'DOMESTIC CHECKOUT')}</span>
              <h3>{checkout.offer.name}</h3>
              <p>{checkout.offer.seller} · {checkout.offer.origin}</p>
            </div>
            <form onSubmit={submitOrder} className="dom-form">
              <div className="dom-form-grid">
                <label className="dom-field">
                  <span>{L('Jumlah', 'Quantity')} ({checkout.offer.unit})</span>
                  <input
                    type="number"
                    min={checkout.offer.moq}
                    max={checkout.offer.stock}
                    value={checkout.quantity}
                    onChange={(e) => updateCheckout({ quantity: e.target.value })}
                  />
                  <small>MOQ {checkout.offer.moq} {checkout.offer.unit}</small>
                </label>
                <label className="dom-field">
                  <span>{L('Kota tujuan', 'Destination city')}</span>
                  <select value={checkout.toCityId} onChange={(e) => updateCheckout({ toCityId: e.target.value })}>
                    {CITIES.map((city) => (
                      <option key={city.id} value={city.id}>{city.name} — {provinceName(city.provinceId, isEn)}</option>
                    ))}
                  </select>
                </label>
                <label className="dom-field">
                  <span>{L('Nama pembeli / usaha', 'Buyer / business name')}</span>
                  <input
                    type="text"
                    value={checkout.buyerName}
                    onChange={(e) => updateCheckout({ buyerName: e.target.value })}
                    placeholder={L('Contoh: CV Rasa Nusantara', 'Example: CV Rasa Nusantara')}
                  />
                </label>
                <label className="dom-field">
                  <span>{L('Nomor WhatsApp', 'WhatsApp number')}</span>
                  <input
                    type="tel"
                    value={checkout.buyerPhone}
                    onChange={(e) => updateCheckout({ buyerPhone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                  />
                </label>
                <label className="dom-field dom-field-wide">
                  <span>{L('Alamat pengiriman', 'Shipping address')}</span>
                  <input
                    type="text"
                    value={checkout.buyerAddress}
                    onChange={(e) => updateCheckout({ buyerAddress: e.target.value })}
                    placeholder={L('Jalan, kelurahan, kecamatan, kode pos', 'Street, sub-district, district, postal code')}
                  />
                </label>
                <label className="dom-field">
                  <span>{L('Metode pengiriman', 'Shipping method')}</span>
                  <select value={checkout.shippingMethod} onChange={(e) => updateCheckout({ shippingMethod: e.target.value })}>
                    {SHIPPING_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {isEn ? option.label.en : option.label.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="dom-field">
                  <span>{L('Metode pembayaran', 'Payment method')}</span>
                  <select value={checkout.paymentMethod} onChange={(e) => updateCheckout({ paymentMethod: e.target.value })}>
                    {PAYMENT_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {isEn ? option.label.en : option.label.id}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="dom-summary">
                <div className="dom-summary-row"><span>{L('Subtotal', 'Subtotal')}</span><strong>{formatIDR(checkoutTotals.subtotal)}</strong></div>
                <div className="dom-summary-row"><span>{L('Ongkos kirim', 'Shipping')} ({checkoutTotals.shippingDays} {L('hari', 'days')})</span><strong>{formatIDR(checkoutTotals.shippingCost)}</strong></div>
                <div className="dom-summary-row"><span>PPN 11%</span><strong>{formatIDR(checkoutTotals.tax)}</strong></div>
                <div className="dom-summary-row dom-summary-total"><span>{L('Total', 'Total')}</span><strong>{formatIDR(checkoutTotals.total)}</strong></div>
                <p className="dom-summary-note">
                  {checkoutTotals.sameIsland
                    ? L('Pengiriman dalam pulau yang sama.', 'Delivery within the same island.')
                    : L('Pengiriman antarpulau: truk + kapal + truk.', 'Inter-island delivery: truck + ship + truck.')}
                </p>
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                {L('Buat Pesanan Domestik', 'Create Domestic Order')}
              </button>
            </form>
          </div>
        </div>
      )}

      {detail && (
        <OrderDetail
          order={detail}
          isEn={isEn}
          onClose={() => setDetail(null)}
          onAdvance={advanceOrder}
          onRelease={releaseEscrow}
          onDownload={downloadDocument}
        />
      )}
    </main>
  );
}

function SellerPanel({ isEn, session, listings, onAdd, onDelete, showToast }) {
  const L = (id, en) => (isEn ? en : id);
  const [form, setForm] = useState({
    name: '',
    category: 'kriya',
    priceIdr: '',
    unit: 'Pcs',
    moq: 1,
    stock: 10,
    origin: 'Bandung, Jawa Barat',
    description: '',
  });

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.priceIdr) {
      showToast(L('Nama produk dan harga wajib diisi.', 'Product name and price are required.'));
      return;
    }
    const listing = {
      id: `seller_${Date.now()}`,
      name: form.name.trim(),
      category: form.category,
      priceIdr: Number(form.priceIdr),
      unit: form.unit,
      moq: Number(form.moq) || 1,
      stock: Number(form.stock) || 0,
      origin: form.origin,
      description: form.description.trim(),
      seller: session?.company || session?.name || L('UMKM Saya', 'My SME'),
      image: '/assets/products/kopi-1.webp',
      certs: [],
    };
    onAdd(listing);
    setForm({ ...form, name: '', priceIdr: '', description: '' });
    showToast(L('Produk berhasil ditambahkan ke katalog domestik.', 'Product added to the domestic catalog.'));
  }

  return (
    <div className="dom-seller">
      <div className="dom-seller-form-card">
        <h3>{L('Daftarkan Produk UMKM', 'List Your SME Product')}</h3>
        <p>{L('Produk akan langsung muncul di katalog domestik dan bisa dibeli UMKM lain.', 'Your product will appear in the domestic catalog and can be bought by other SMEs.')}</p>
        <form onSubmit={submit} className="dom-form">
          <div className="dom-form-grid">
            <label className="dom-field dom-field-wide">
              <span>{L('Nama produk', 'Product name')}</span>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={L('Contoh: Tas Anyaman Pandan', 'Example: Woven Pandan Bag')} />
            </label>
            <label className="dom-field">
              <span>{L('Kategori', 'Category')}</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="kopi">Kopi</option>
                <option value="rempah">Rempah & Hasil Alam</option>
                <option value="kriya">Kriya & Kerajinan</option>
                <option value="tekstil">Tekstil & Wastra</option>
              </select>
            </label>
            <label className="dom-field">
              <span>{L('Harga (IDR)', 'Price (IDR)')}</span>
              <input type="number" min="1000" value={form.priceIdr} onChange={(e) => setForm({ ...form, priceIdr: e.target.value })} placeholder="50000" />
            </label>
            <label className="dom-field">
              <span>{L('Satuan', 'Unit')}</span>
              <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Pcs / Kg" />
            </label>
            <label className="dom-field">
              <span>MOQ</span>
              <input type="number" min="1" value={form.moq} onChange={(e) => setForm({ ...form, moq: e.target.value })} />
            </label>
            <label className="dom-field">
              <span>{L('Stok', 'Stock')}</span>
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </label>
            <label className="dom-field">
              <span>{L('Asal produk', 'Product origin')}</span>
              <select value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })}>
                {CITIES.map((city) => (
                  <option key={city.id} value={`${city.name}, ${provinceName(city.provinceId, isEn)}`}>
                    {city.name}, {provinceName(city.provinceId, isEn)}
                  </option>
                ))}
              </select>
            </label>
            <label className="dom-field dom-field-wide">
              <span>{L('Deskripsi singkat', 'Short description')}</span>
              <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={L('Ceritakan keunggulan produk Anda.', 'Tell buyers what makes your product special.')} />
            </label>
          </div>
          <button type="submit" className="btn btn-primary">{L('Tambahkan ke Katalog', 'Add to Catalog')}</button>
        </form>
      </div>

      <div className="dom-listing-list">
        <h3>{L('Produk yang Anda jual', 'Products you sell')} ({listings.length})</h3>
        {listings.length === 0 ? (
          <p className="dom-muted">{L('Belum ada produk. Tambahkan produk pertama Anda.', 'No products yet. Add your first product.')}</p>
        ) : (
          listings.map((item) => (
            <div className="dom-listing-item" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <small>{formatIDR(item.priceIdr)} / {item.unit} · {L('Stok', 'Stock')} {item.stock} · {item.origin}</small>
              </div>
              <button type="button" className="btn btn-outline" onClick={() => onDelete(item.id)}>{L('Hapus', 'Delete')}</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function OrderDetail({ order, isEn, onClose, onAdvance, onRelease, onDownload }) {
  const L = (id, en) => (isEn ? en : id);
  const currentIndex = DOMESTIC_STATUS_FLOW.indexOf(order.status);
  const released = order.escrow.filter((item) => item.status === 'released').length;
  const progress = Math.round((released / order.escrow.length) * 100);

  return (
    <div className="modal-overlay show active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card dom-modal dom-detail">
        <button type="button" className="modal-close-btn" onClick={onClose}>&times;</button>
        <div className="dom-modal-head">
          <span className="pill-badge pill-blue">{L('DETAIL PESANAN DOMESTIK', 'DOMESTIC ORDER DETAIL')}</span>
          <h3>{order.orderNo}</h3>
          <p>{formatDate(order.createdAt)} · {order.seller} → {order.buyerName}</p>
        </div>

        <div className="dom-detail-grid">
          <div>
            <h4>{L('Informasi Pesanan', 'Order Information')}</h4>
            <div className="dom-info-row"><span>{L('Produk', 'Product')}</span><strong>{order.productName}</strong></div>
            <div className="dom-info-row"><span>{L('Jumlah', 'Quantity')}</span><strong>{order.quantity} {order.unit}</strong></div>
            <div className="dom-info-row"><span>{L('Tujuan', 'Destination')}</span><strong>{order.buyerCity}</strong></div>
            <div className="dom-info-row"><span>{L('Alamat', 'Address')}</span><strong>{order.buyerAddress}</strong></div>
            <div className="dom-info-row"><span>{L('Pengiriman', 'Shipping')}</span><strong>{order.shippingMethod}</strong></div>
            <div className="dom-info-row"><span>{L('Pembayaran', 'Payment')}</span><strong>{order.paymentMethod}</strong></div>
            <div className="dom-info-row"><span>{L('Total', 'Total')}</span><strong className="dom-total-text">{formatIDR(order.total)}</strong></div>
          </div>
          <div>
            <h4>{L('Status Pesanan', 'Order Status')}</h4>
            <div className="dom-timeline">
              {DOMESTIC_STATUS_FLOW.map((status, index) => (
                <div className={`dom-step ${index <= currentIndex ? 'done' : ''}`} key={status}>
                  <span className="dom-step-dot">{index + 1}</span>
                  <div>
                    <strong>{statusLabel(status, isEn)}</strong>
                    <small>
                      {index < currentIndex
                        ? L('Selesai', 'Done')
                        : index === currentIndex
                          ? L('Sedang berjalan', 'In progress')
                          : L('Menunggu', 'Waiting')}
                    </small>
                  </div>
                </div>
              ))}
            </div>
            {currentIndex < DOMESTIC_STATUS_FLOW.length - 1 && (
              <button type="button" className="btn btn-primary btn-block" onClick={() => onAdvance(order)}>
                {L('Ubah status ke', 'Change status to')} {statusLabel(DOMESTIC_STATUS_FLOW[currentIndex + 1], isEn)}
              </button>
            )}
          </div>
        </div>

        <div className="dom-detail-section">
          <div className="dom-detail-section-head">
            <h4>{L('Escrow 4 Fase', '4-Phase Escrow')}</h4>
            <span>{progress}% {L('tercair', 'released')}</span>
          </div>
          <div className="dom-progress"><span style={{ width: `${progress}%` }} /></div>
          <div className="dom-escrow">
            {order.escrow.map((item) => (
              <div className={`dom-escrow-row ${item.status === 'released' ? 'released' : ''}`} key={item.stage}>
                <div>
                  <strong>{L('Fase', 'Stage')} {item.stage} — {item.pct}%</strong>
                  <small>{item.label}</small>
                </div>
                <div className="dom-escrow-right">
                  <span>{formatIDR(item.amount)}</span>
                  {item.status === 'released' ? (
                    <span className="dom-status done">{L('Cair', 'Released')}</span>
                  ) : (
                    <button type="button" className="btn btn-outline" onClick={() => onRelease(order, item.stage)}>
                      {L('Cairkan', 'Release')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dom-detail-section">
          <h4>{L('Dokumen Domestik', 'Domestic Documents')}</h4>
          <div className="dom-doc-list">
            {['PO', 'Invoice', 'Surat Jalan', 'BAST'].map((type) => (
              <button type="button" className="dom-doc-btn" key={type} onClick={() => onDownload(order, type)}>
                <span>📄</span>
                <strong>{docTitle(type, isEn)}</strong>
                <small>{L('Unduh', 'Download')}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="dom-detail-section">
          <h4>{L('Kepatuhan yang perlu disiapkan', 'Compliance to prepare')}</h4>
          <div className="dom-compliance-grid">
            {DOMESTIC_COMPLIANCE.map((item) => (
              <div className="dom-compliance-item" key={item.id}>
                <strong>{item.label}</strong>
                <span>{item.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
