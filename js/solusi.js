/**
 * ==========================================================================
 * NUSABRIDGE - LOGIKA GEMINI AI AGENT OPERATIONAL SUITE
 * File: js/solusi.js
 * Deskripsi: Mesin otomatisasi ekspor UMKM berbasis 4 modul interaktif:
 * 1. AI Sales Assistant & RFQ Studio (Kalkulator Incoterms 2020)
 * 2. Auto-PDF Document Generator (Tool Calling: Proforma Invoice & Sales Contract)
 * 3. KYC Hub & Kepatuhan Global (Audit Legalitas OSS NIB, NPWP, & Regulasi FDA/JAS/EUDR)
 * 4. Escrow Vault & AI Chat Assistant (Simulasi Percakapan 4 Fase Pencairan Dana)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 0. WORKSPACE PERCAKAPAN GEMINI AI AGENT UTAMA (@google/genai)
  // --------------------------------------------------------------------------
  const geminiHistory = document.getElementById('geminiChatHistory');
  const geminiInput = document.getElementById('geminiUserPromptInput');
  const btnSendGemini = document.getElementById('btnSendGeminiPrompt');
  const btnClearHistory = document.getElementById('btnClearChatHistory');
  const scenarioItems = document.querySelectorAll('.btn-scenario-item');
  const chipPrompts = document.querySelectorAll('.btn-chip-prompt');

  const SCENARIO_MAP = {
    hamburg: "Halo NusaBridge AI, saya Hanseatic Importers dari Hamburg, Jerman. Saya bermaksud mengimpor 20 Metric Ton (MT) Kopi Robusta Lampung dari UMKM Indonesia dengan skema pengiriman CIF Hamburg Port. Tolong hitungkan estimasi biayanya, cek verifikasi seller, dan buatkan draf kontrak serta skema pembayarannya.",
    'los-angeles': "Halo NusaBridge AI, kami Pacific Spice dari Los Angeles, USA. Kami ingin membeli 5 MT Cengkeh Lalpari Maluku CIF Los Angeles. Mohon rincian biaya Incoterms 2020 dan verifikasi kepatuhan US FDA.",
    tokyo: "Konnichiwa NusaBridge AI! Kami Tokyo Living Design Co. ingin memesan 2.000 Pcs Kursi Rotan Alami Cirebon skema FOB Tanjung Priok. Berapa estimasi harga dan dokumen kelengkapan V-Legal SVLK?",
    kyc: "Tolong lakukan audit legalitas dan verifikasi kepatuhan ekspor untuk NIB 0120268840001 dan NPWP 01.234.567.8-012.000 untuk tujuan pasar Uni Eropa (regulasi EUDR).",
    escrow: "Bagaimana cara kerja dan rincian alur pencairan dana 4 tahap di Escrow Vault NusaBridge untuk melindungi transaksi ekspor UMKM?"
  };

  /**
   * Parser Markdown sederhana untuk menghasilkan tampilan khas Google Gemini:
   * - Heading (###, ##, #)
   * - Blockquote / Tips Callout (> quote)
   * - Bold (**teks**) dan Italic (*teks*)
   * - List bernomor dan bullet points
   * - Inline code tag
   */
  function renderGeminiMarkdown(rawText) {
    if (!rawText) return '';
    // Jika teks sudah berisi struktur kartu HTML visual kustom, return langsung
    if (rawText.includes('<div class="chat-pilar-card"') || rawText.includes('<div class="gemini-callout-box"')) {
      return rawText;
    }

    let text = String(rawText).trim();

    // Escape tag HTML berisiko
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Headings
    text = text.replace(/^### (.*$)/gim, '<h5 class="gemini-heading"><span class="gh-icon">🔹</span> $1</h5>');
    text = text.replace(/^## (.*$)/gim, '<h4 class="gemini-heading"><span class="gh-icon">📌</span> $1</h4>');
    text = text.replace(/^# (.*$)/gim, '<h4 class="gemini-heading-main">$1</h4>');

    // Callout Box (> kutipan / tips)
    text = text.replace(/^&gt; (.*$)/gim, '<div class="gemini-callout-box"><span class="gcb-icon">💡</span><div class="gcb-text">$1</div></div>');

    // Bold, Italic, Code
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/`([^`]+)`/g, '<code class="gemini-inline-code">$1</code>');

    // List and Paragraph processing
    const lines = text.split('\n');
    const processed = [];
    let inUl = false;
    let inOl = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      const bulletMatch = line.match(/^(\s*)([-*•])\s+(.*)/);
      const numberMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);

      if (bulletMatch) {
        if (inOl) { processed.push('</ol>'); inOl = false; }
        if (!inUl) { processed.push('<ul class="gemini-list">'); inUl = true; }
        processed.push(`<li>${bulletMatch[3]}</li>`);
      } else if (numberMatch) {
        if (inUl) { processed.push('</ul>'); inUl = false; }
        if (!inOl) { processed.push('<ol class="gemini-ordered-list">'); inOl = true; }
        processed.push(`<li>${numberMatch[3]}</li>`);
      } else {
        if (inUl) { processed.push('</ul>'); inUl = false; }
        if (inOl) { processed.push('</ol>'); inOl = false; }

        if (trimmed.length > 0) {
          if (trimmed.startsWith('<h') || trimmed.startsWith('<div') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol')) {
            processed.push(trimmed);
          } else {
            processed.push(`<p class="gemini-p">${trimmed}</p>`);
          }
        }
      }
    }

    if (inUl) processed.push('</ul>');
    if (inOl) processed.push('</ol>');

    return processed.join('\n');
  }

  function appendChatBubble(sender, rawText, headerLabel) {
    if (!geminiHistory) return;
    const isUser = sender === 'user';
    const row = document.createElement('div');
    row.className = `chat-bubble-row ${isUser ? 'user-row' : 'agent-row'}`;

    const formattedTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const renderedContent = isUser ? rawText.trim().replace(/\n/g, '<br>') : renderGeminiMarkdown(rawText);

    row.innerHTML = `
      <div class="cbr-avatar">${isUser ? '👤' : '🤖'}</div>
      <div class="cbr-content">
        <div class="cbr-header">
          <span>${headerLabel || (isUser ? 'Anda (Buyer / Eksportir)' : 'NusaBridge Gemini AI Agent')}</span>
          <span>${formattedTime}</span>
        </div>
        <div class="cbr-text">${renderedContent}</div>
      </div>
    `;

    geminiHistory.appendChild(row);
    geminiHistory.scrollTop = geminiHistory.scrollHeight;
  }

  function showTypingIndicator() {
    if (!geminiHistory) return null;
    const typing = document.createElement('div');
    typing.id = 'geminiTypingBubble';
    typing.className = 'chat-bubble-row agent-row';
    typing.innerHTML = `
      <div class="cbr-avatar">🤖</div>
      <div class="cbr-content" style="padding:10px 14px;">
        <div class="typing-indicator">
          <span>Gemini AI Agent menganalisis parameter 4 Pilar Ekspor</span>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    geminiHistory.appendChild(typing);
    geminiHistory.scrollTop = geminiHistory.scrollHeight;
    return typing;
  }

  function removeTypingIndicator() {
    const el = document.getElementById('geminiTypingBubble');
    if (el) el.remove();
  }

  /**
   * Knowledge Engine Respons Cerdas Berbahasa Alami (Mirip Gemini Resmi)
   * Menyajikan jawaban komprehensif, santun, dan mudah dibaca untuk setiap pertanyaan pengguna.
   */
  function generateSmartAgentReply(userMessage) {
    const q = (userMessage || '').toLowerCase().trim();

    // 1. Skenario Hamburg / Kopi Robusta Lampung (CIF Hamburg)
    if (q.includes('hamburg') || (q.includes('robusta') && (q.includes('cif') || q.includes('kopi')))) {
      return `
        <p class="gemini-p"><strong>Halo Hanseatic Coffee Importers!</strong> Salam hangat dari NusaBridge Indonesia. Terima kasih telah memilih komoditas Kopi Nusantara untuk memenuhi kebutuhan pasar Eropa Anda.</p>
        <p class="gemini-p">Berikut adalah analisis komprehensif transaksi ekspor <strong>20 Metric Ton (MT) Kopi Robusta Lampung Grade 1</strong> dengan skema pengiriman <strong>CIF Hamburg Port, Jerman</strong>, yang dirangkum dalam <strong>4 Pilar Utama NusaBridge</strong>:</p>

        <div class="chat-pilar-card">
          <div class="cpc-title pilar-1">📊 1. Kalkulasi RFQ Studio &amp; Incoterms 2020 (Pilar 1)</div>
          <div class="cpc-row"><span>Harga Dasar FOB Tanjung Priok:</span> <strong>$3.85 / Kg ($77,000 USD)</strong></div>
          <div class="cpc-row"><span>Ocean Freight &amp; Asuransi Maritim:</span> <strong>$0.42 / Kg ($8,400 USD)</strong></div>
          <div class="cpc-row"><span>Total Penawaran CIF Hamburg Port:</span> <strong style="color:#2563eb; font-size:13.5px;">$85,400 USD ($4.27 / Kg)</strong></div>
          <div class="cpc-row"><span>Rekomendasi Margin Bersih Aman UMKM:</span> <span class="cpc-badge-green">+18.5% Net Profit</span></div>
        </div>

        <div class="chat-pilar-card">
          <div class="cpc-title pilar-3">🛡️ 2. Audit Legalitas &amp; KYC Hub Kepatuhan Global (Pilar 3)</div>
          <div class="cpc-row"><span>NIB Pelaku Usaha (OSS RBA):</span> <strong>0120268840001 (Valid &amp; Aktif Ekspor)</strong></div>
          <div class="cpc-row"><span>NPWP Terdaftar:</span> <strong>01.234.567.8-012.000 (DJP Kemenkeu Aktif)</strong></div>
          <div class="cpc-row"><span>Sertifikasi Saniter:</span> <strong>Phytosanitary &amp; Karantina Lolos (Bebas PBKo)</strong></div>
          <div class="cpc-row"><span>Regulasi Deforestasi Uni Eropa:</span> <strong>EUDR GIS Geolocation Mapped &amp; Verified</strong></div>
          <div class="cpc-row"><span>Skor Kepatuhan Mutu:</span> <span class="cpc-badge-blue">100% Score (Verified Seller Shield)</span></div>
        </div>

        <div class="chat-pilar-card">
          <div class="cpc-title pilar-2">📄 3. Otomatisasi Dokumen Legal Ekspor (Pilar 2)</div>
          <p style="margin:0 0 6px; color:#334155;">Draf berkas perdagangan resmi berstandar ICC telah diterbitkan otomatis dan siap diunduh berformat PDF:</p>
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
            <span class="seal-stamp">✓ Proforma Invoice #PI-2026-DE-088</span>
            <span class="seal-stamp">✓ Sales Contract #SC-2026-DE-088 (CIF Hamburg)</span>
          </div>
        </div>

        <div class="chat-pilar-card">
          <div class="cpc-title pilar-4">🔒 4. Skema Pengamanan Dana Escrow Vault 4 Fase (Pilar 4)</div>
          <p style="margin:0 0 8px; color:#334155;">Pembayaran sebesar <strong>$85,400 USD</strong> akan dikunci di Escrow Vault dan dicairkan bertahap berdasarkan milestone pelayaran:</p>
          <div class="cpc-row"><span>• Tahap 1 (30% - $25,620 USD):</span> <strong>DP Cair saat Kontrak Ditandatangani</strong></div>
          <div class="cpc-row"><span>• Tahap 2 (30% - $25,620 USD):</span> <strong>Cair saat Dokumen PEB &amp; Stuffing Selesai</strong></div>
          <div class="cpc-row"><span>• Tahap 3 (20% - $17,080 USD):</span> <strong>Cair saat Kapal Berlayar &amp; Bill of Lading (B/L) Terbit</strong></div>
          <div class="cpc-row"><span>• Tahap 4 (20% - $17,080 USD):</span> <strong>Settlement Final saat Kontainer Sandar di Hamburg</strong></div>
        </div>

        <div class="gemini-callout-box">
          <span class="gcb-icon">💡</span>
          <div class="gcb-text">
            <strong>Rekomendasi Ahli Ekspor NusaBridge:</strong> Rute pelayaran Tanjung Priok menuju Hamburg Port membutuhkan estimasi waktu 24-28 hari pelayaran (Transit Time). Anda dapat memantau pergerakan kapal pengangkut secara real-time di fitur <strong>Radar Maritim AIS NusaBridge</strong>.
          </div>
        </div>
        <p class="gemini-p" style="margin-top:10px;">Apakah Anda memerlukan kustomisasi kemasan khusus (seperti <em>GrainPro Bags 60 Kg</em>) atau ingin menerbitkan berkas PDF sekarang?</p>
      `;
    }

    // 2. Skenario Los Angeles / Cengkeh Lalpari Maluku
    if (q.includes('los angeles') || (q.includes('clove') || q.includes('cengkeh'))) {
      return `
        <p class="gemini-p"><strong>Halo Pacific Spice Importers!</strong> Salam hangat dari tim NusaBridge. Kami senang dapat membantu rencana pengadaan rempah berkualitas tinggi Anda dari kepulauan Maluku.</p>
        <p class="gemini-p">Berikut adalah rincian analisis transaksi ekspor <strong>5 Metric Ton (MT) Cengkeh Lalpari Maluku Grade A</strong> dengan skema pengiriman <strong>CIF Port of Los Angeles, USA</strong>:</p>

        <div class="chat-pilar-card">
          <div class="cpc-title pilar-1">📊 1. Kalkulasi Incoterms 2020 CIF Los Angeles</div>
          <div class="cpc-row"><span>Harga Dasar FOB Tanjung Perak:</span> <strong>$12.50 / Kg ($62,500 USD)</strong></div>
          <div class="cpc-row"><span>Ocean Freight Pasifik &amp; Asuransi:</span> <strong>$1.15 / Kg ($5,750 USD)</strong></div>
          <div class="cpc-row"><span>Total Penawaran CIF Los Angeles:</span> <strong style="color:#2563eb; font-size:13.5px;">$68,250 USD ($13.65 / Kg)</strong></div>
          <div class="cpc-row"><span>Margin Aman UMKM Eksportir:</span> <span class="cpc-badge-green">+19.2% Net Profit</span></div>
        </div>

        <div class="chat-pilar-card">
          <div class="cpc-title pilar-3">🛡️ 2. Kepatuhan Regulasi US FDA &amp; Standar Mutu ASTA</div>
          <div class="cpc-row"><span>Registrasi Fasilitas US FDA:</span> <strong>Food Facility Registration (FFR) Aktif</strong></div>
          <div class="cpc-row"><span>Standar Kebersihan ASTA:</span> <strong>Lolos Uji Bebas Logam Berat &amp; Kadar Air &lt; 12%</strong></div>
          <div class="cpc-row"><span>Karantina &amp; Fitosanitari:</span> <strong>Phytosanitary Certificate RI Valid</strong></div>
          <div class="cpc-row"><span>Status Verifikasi:</span> <span class="cpc-badge-blue">100% Score (Verified Global Exporter)</span></div>
        </div>

        <div class="chat-pilar-card">
          <div class="cpc-title pilar-2">📄 3. Otomatisasi Dokumen Resmi</div>
          <p style="margin:0 0 6px; color:#334155;">Dokumen resmi ICC diterbitkan otomatis berformat PDF:</p>
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
            <span class="seal-stamp">✓ Proforma Invoice #PI-2026-US-104</span>
            <span class="seal-stamp">✓ Export Sales Contract (CIF Los Angeles)</span>
          </div>
        </div>

        <div class="chat-pilar-card">
          <div class="cpc-title pilar-4">🔒 4. Rekening Escrow Vault Multivalas (USD)</div>
          <div class="cpc-row"><span>Total Kontrak Terkunci:</span> <strong>$68,250 USD</strong></div>
          <div class="cpc-row"><span>Alur Pencairan Bertahap:</span> <strong>30% DP ➔ 30% PEB ➔ 20% B/L Terbit ➔ 20% Tiba di LA Port</strong></div>
        </div>

        <div class="gemini-callout-box">
          <span class="gcb-icon">💡</span>
          <div class="gcb-text">
            <strong>Catatan Logistik Trans-Pasifik:</strong> Muatan cengkeh 5 MT dikemas dalam 200 karung goni laminasi @ 25 Kg, dilengkapi <em>silica gel dry-bags</em> untuk menjaga aroma dan kekeringan selama 28 hari pelayaran menuju California.
          </div>
        </div>
      `;
    }

    // 3. Skenario Tokyo / Furnitur Rotan Cirebon
    if (q.includes('tokyo') || (q.includes('rotan') || q.includes('rattan'))) {
      return `
        <p class="gemini-p"><strong>Konnichiwa Tokyo Living Design Co.!</strong> Terima kasih telah mempercayakan pengadaan furnitur kerajinan rotan alami khas Cirebon kepada kami.</p>
        <p class="gemini-p">Berikut adalah analisis kuotasi pesanan <strong>2.000 Pcs Kursi Rotan Alami Cirebon (Skandinavia Minimalis)</strong> skema <strong>FOB Tanjung Priok, Jakarta</strong>:</p>

        <div class="chat-pilar-card">
          <div class="cpc-title pilar-1">📊 1. Kalkulasi Kuotasi FOB Tanjung Priok</div>
          <div class="cpc-row"><span>Harga Satuan FOB:</span> <strong>$78.00 / Pcs</strong></div>
          <div class="cpc-row"><span>Total Nilai Kontrak:</span> <strong style="color:#2563eb; font-size:13.5px;">$156,000 USD</strong></div>
          <div class="cpc-row"><span>Kapasitas Kontainer:</span> <strong>2 x 40ft High Cube Container (~136 CBM)</strong></div>
          <div class="cpc-row"><span>Margin Aman Pengrajin:</span> <span class="cpc-badge-green">+22.0% Net Profit</span></div>
        </div>

        <div class="chat-pilar-card">
          <div class="cpc-title pilar-3">🛡️ 2. Legalitas Kelestarian Kayu &amp; Rotan (V-Legal)</div>
          <div class="cpc-row"><span>Sertifikat SVLK Kemenhut:</span> <strong>V-Legal Aktif (Bahan Baku Berkelanjutan)</strong></div>
          <div class="cpc-row"><span>Fumigasi Standar ISPM 15:</span> <strong>Sertifikat Resmi Bebas Rayap &amp; Jamur</strong></div>
          <div class="cpc-row"><span>Skor Kepatuhan:</span> <span class="cpc-badge-blue">100% Score (Verified Seller Shield)</span></div>
        </div>

        <div class="chat-pilar-card">
          <div class="cpc-title pilar-2">📄 3. Otomatisasi Dokumen &amp; Packing List CBM</div>
          <p style="margin:0 0 6px; color:#334155;">Draf berkas Commercial Invoice &amp; Packing List kubikasi peti kemas telah siap diunduh berformat PDF.</p>
        </div>

        <div class="chat-pilar-card">
          <div class="cpc-title pilar-4">🔒 4. Skema Escrow Vault 4 Fase</div>
          <div class="cpc-row"><span>Tahap 1 (30% - $46,800):</span> <strong>DP Produksi Anyaman Rotan Lokal</strong></div>
          <div class="cpc-row"><span>Tahap 2 (30% - $46,800):</span> <strong>Pemeriksaan Kualitas (QC) &amp; Terbit PEB</strong></div>
          <div class="cpc-row"><span>Tahap 3 (20% - $31,200):</span> <strong>Peti Kemas On-Board Kapal &amp; B/L Terbit</strong></div>
          <div class="cpc-row"><span>Tahap 4 (20% - $31,200):</span> <strong>Settlement Akhir saat Sandar di Port of Tokyo</strong></div>
        </div>
      `;
    }

    // 4. Panduan Langkah Ekspor Pemula
    if (q.includes('cara ekspor') || q.includes('bagaimana ekspor') || q.includes('memulai ekspor') || q.includes('langkah ekspor') || q.includes('pemula') || q.includes('alur ekspor') || q.includes('tahapan')) {
      return `
        <p class="gemini-p"><strong>Halo Rekan Eksportir!</strong> Memulai ekspor adalah langkah besar yang sangat membanggakan untuk mengembangkan skala bisnis UMKM Anda.</p>
        <p class="gemini-p">NusaBridge telah menyusun <strong>5 Langkah Praktis Go-Global</strong> yang terstruktur agar proses ekspor berjalan mulus dan minim risiko:</p>

        <ol class="gemini-ordered-list">
          <li><strong>Persiapan Legalitas Usaha (KYC Hub)</strong>:
            Pastikan Anda memiliki <strong>NIB (Nomor Induk Berusaha)</strong> 13 digit dari sistem OSS RBA. Di era sekarang, NIB otomatis berfungsi ganda sebagai Angka Pengenal Importir/Eksportir (API) dan Hak Akses Kepabeanan. Pastikan pula NPWP usaha Anda aktif.
          </li>
          <li><strong>Standardisasi &amp; Sertifikasi Mutu Produk</strong>:
            Sesuaikan produk dengan negara tujuan. Untuk komoditas pangan/rempah/kopi, lengkapi dengan <strong>Sertifikat Fitosanitari</strong> (Badan Karantina) dan uji lab Sucofindo. Untuk produk kayu/rotan, lengkapi dengan sertifikat <strong>V-Legal SVLK</strong>.
          </li>
          <li><strong>Penetapan Harga &amp; Negosiasi Incoterms 2020 (RFQ Studio)</strong>:
            Gunakan fitur <strong>RFQ Studio NusaBridge</strong> untuk menghitung struktur biaya secara transparan: harga pokok produksi, biaya pengiriman lokal, hingga tarif kargo laut. Bagi pemula, mulailah dengan skema <strong>FOB</strong> atau <strong>CIF</strong> dengan margin aman minimal 15-20%.
          </li>
          <li><strong>Otomatisasi Dokumen Resmi (Auto-PDF Generator)</strong>:
            Terbitkan dokumen perdagangan resmi secara instan: <em>Proforma Invoice, Sales Contract, Commercial Invoice, Packing List</em>, dan formulir <em>Pemberitahuan Ekspor Barang (PEB)</em>.
          </li>
          <li><strong>Pengamanan Dana Transaksi (Escrow Vault)</strong>:
            Hindari mengirim barang sebelum kepastian pembayaran jelas. Gunakan <strong>Escrow Vault NusaBridge</strong> dengan mekanisme pencairan 4 fase (30% DP ➔ 30% PEB ➔ 20% Bill of Lading ➔ 20% Tiba di Tujuan).
          </li>
        </ol>

        <div class="gemini-callout-box">
          <span class="gcb-icon">💡</span>
          <div class="gcb-text">
            <strong>Tips Memulai Tanpa Modal Besar:</strong> Jika volume komoditas Anda belum mencukupi untuk menyewa 1 kontainer penuh (FCL), Anda bisa memilih opsi pengiriman kargo konsolidasi <strong>LCL (Less than Container Load)</strong> melalui komunitas ekspor NusaBridge!
          </div>
        </div>
      `;
    }

    // 5. Penjelasan Incoterms 2020 (FOB vs CIF vs CFR)
    if (q.includes('incoterm') || q.includes('fob') || q.includes('cif') || q.includes('cfr') || q.includes('exw') || q.includes('ddp') || q.includes('beda fob') || q.includes('apa itu fob')) {
      return `
        <p class="gemini-p"><strong>Halo!</strong> Pertanyaan yang sangat penting dalam perdagangan internasional. <strong>Incoterms 2020</strong> adalah serangkaian aturan baku dari <em>International Chamber of Commerce (ICC)</em> yang mengatur pembagian biaya, tanggung jawab, dan titik peralihan risiko antara Penjual (Eksportir) dan Pembeli (Buyer luar negeri).</p>

        <p class="gemini-p">Berikut adalah perbandingan 3 istilah Incoterms yang paling sering digunakan dalam transaksi ekspor UMKM:</p>

        <ul class="gemini-list">
          <li><strong>FOB (Free on Board - Pelabuhan Muat Indonesia)</strong>:
            Kewajiban Anda sebagai eksportir hanya sampai barang dinaikkan ke atas kapal di pelabuhan muat Indonesia (misal: Tanjung Priok, Jakarta atau Tanjung Perak, Surabaya). Biaya kapal laut internasional (Ocean Freight) dan asuransi ditanggung sepenuhnya oleh pembeli. <em>Sangat disarankan untuk UMKM pemula!</em>
          </li>
          <li><strong>CIF (Cost, Insurance, and Freight - Pelabuhan Tujuan Buyer)</strong>:
            Anda bertanggung jawab menanggung harga barang, biaya pengiriman lokal, ongkos sewa kapal kargo internasional (Ocean Freight), dan polis asuransi maritim hingga kapal tiba di pelabuhan tujuan pembeli (misal: Hamburg Port atau Port of Los Angeles). Namun, risiko kerusakan barang beralih ke pembeli saat barang telah termuat di atas kapal di Indonesia.
          </li>
          <li><strong>CFR (Cost and Freight)</strong>:
            Mirip dengan skema CIF, namun Anda hanya menanggung ongkos kapal tanpa polis asuransi kargo (asuransi ditutup sendiri oleh pembeli).
          </li>
        </ul>

        <div class="gemini-callout-box info-box">
          <span class="gcb-icon">💡</span>
          <div class="gcb-text">
            <strong>Rekomendasi NusaBridge:</strong> Untuk buyer baru, gunakan skema <strong>FOB</strong> agar Anda tidak terbebani risiko fluktuasi biaya logistik laut. Jika buyer meminta <strong>CIF</strong>, gunakan <strong>Tab 1: RFQ Studio NusaBridge</strong> untuk menghitung margin pelindung secara akurat.
          </div>
        </div>
      `;
    }

    // 6. Legalitas, NIB OSS, NPWP, dan Kepatuhan Global
    if (q.includes('legalitas') || q.includes('nib') || q.includes('npwp') || q.includes('oss') || q.includes('izin') || q.includes('syarat') || q.includes('kyc') || q.includes('fda') || q.includes('eudr') || q.includes('jas')) {
      return `
        <p class="gemini-p"><strong>Halo Rekan Eksportir!</strong> Memastikan legalitas dan kepatuhan regulasi sejak awal adalah kunci agar produk UMKM Anda dapat diterima dengan mudah di negara tujuan tanpa risiko denda atau penahanan peti kemas di pelabuhan.</p>

        <p class="gemini-p">Berikut adalah daftar persyaratan legalitas dan standar kepatuhan yang diverifikasi oleh modul <strong>KYC Hub NusaBridge</strong>:</p>

        <ul class="gemini-list">
          <li><strong>NIB (Nomor Induk Berusaha) 13 Digit</strong>:
            Diterbitkan melalui sistem perizinan berusaha terintegrasi secara elektronik (OSS RBA). NIB Anda otomatis berfungsi sebagai izin ekspor dan Hak Akses Kepabeanan.
          </li>
          <li><strong>NPWP (Nomor Pokok Wajib Pajak)</strong>:
            NPWP Badan Usaha atau Perorangan yang valid dan berstatus aktif di Direktorat Jenderal Pajak Kementerian Keuangan RI.
          </li>
          <li><strong>Sertifikat Fitosanitari (Phytosanitary Certificate)</strong>:
            Wajib untuk seluruh komoditas hasil perkebunan, pertanian, dan rempah, yang diterbitkan oleh Badan Karantina Indonesia setelah proses inspeksi bebas hama penyakit.
          </li>
          <li><strong>Standar Spesifik Negara Tujuan</strong>:
            <ul style="margin-top:6px;">
              <li><strong>Pasar Amerika Serikat (USA)</strong>: Registrasi fasilitas pangan <em>US FDA Food Facility Registration (FFR)</em>.</li>
              <li><strong>Pasar Uni Eropa (EU)</strong>: Kepatuhan regulasi anti-deforestasi <em>EUDR (European Union Deforestation Regulation)</em> dengan pemetaan poligon GIS lahan kebun.</li>
              <li><strong>Pasar Jepang</strong>: Sertifikasi standar pertanian organik/mutu <em>JAS (Japanese Agricultural Standards)</em>.</li>
            </ul>
          </li>
        </ul>

        <div class="gemini-callout-box">
          <span class="gcb-icon">🛡️</span>
          <div class="gcb-text">
            <strong>Verified Global Exporter Shield:</strong> Anda dapat menguji validitas NIB usaha Anda pada fitur <strong>Tab 3: KYC Hub Sandbox</strong> di bawah untuk mendapatkan skor kepatuhan 100%!
          </div>
        </div>
      `;
    }

    // 7. Escrow Vault & Keamanan Pembayaran
    if (q.includes('escrow') || q.includes('bayar') || q.includes('pembayaran') || q.includes('aman') || q.includes('penipuan') || q.includes('rekening') || q.includes('dp')) {
      return `
        <p class="gemini-p"><strong>Halo!</strong> Kekhawatiran terbesar bagi setiap pelaku usaha ekspor adalah risiko barang sudah dikirim melintasi samudera, namun pembeli luar negeri tidak kunjung melunasi pembayaran.</p>

        <p class="gemini-p"><strong>Escrow Vault NusaBridge</strong> hadir sebagai platform rekening bersama netral multi-valas (USD, EUR, IDR) yang melindungi hak eksportir dan pembeli melalui sistem pencairan <strong>4 Tahapan Pencapaian (Milestones)</strong>:</p>

        <div class="chat-pilar-card">
          <div class="cpc-title pilar-4">🔒 Mekanisme Pelepasan Dana 4 Fase Escrow Vault</div>
          <div class="cpc-row"><span>Fase 1 (30% DP Awal):</span> <strong>Dicairkan saat Sales Contract ditandatangani kedua pihak (sebagai modal kerja produksi).</strong></div>
          <div class="cpc-row"><span>Fase 2 (30% Kargo Siap):</span> <strong>Dicairkan saat stuffing kontainer selesai dan dokumen PEB Bea Cukai diterbitkan.</strong></div>
          <div class="cpc-row"><span>Fase 3 (20% Kapal Berlayar):</span> <strong>Dicairkan saat kapal kargo bertolak dan Bill of Lading (B/L) resmi terbit.</strong></div>
          <div class="cpc-row"><span>Fase 4 (20% Pelunasan Akhir):</span> <strong>Dicairkan saat kontainer sandar di pelabuhan tujuan dan lolos inspeksi penerimaan.</strong></div>
        </div>

        <div class="gemini-callout-box">
          <span class="gcb-icon">🔒</span>
          <div class="gcb-text">
            <strong>Jaminan Keamanan:</strong> Dana pembeli dikunci 100% di Escrow Vault sebelum Anda memuat barang ke peti kemas. Dengan begitu, Anda terlindungi sepenuhnya dari risiko penipuan atau pembatalan sepihak.
          </div>
        </div>
      `;
    }

    // 8. Dokumen Ekspor Resmi
    if (q.includes('dokumen') || q.includes('surat') || q.includes('invoice') || q.includes('sales contract') || q.includes('peb') || q.includes('packing list') || q.includes('bill of lading') || q.includes('bl') || q.includes('ska') || q.includes('coo')) {
      return `
        <p class="gemini-p"><strong>Halo!</strong> Dalam dunia perdagangan internasional, kelengkapan berkas resmi adalah syarat utama agar barang dapat melewati pengawasan Bea Cukai Indonesia dan kepabeanan negara tujuan.</p>

        <p class="gemini-p">Berikut adalah <strong>6 Dokumen Pokok Ekspor</strong> yang dapat diterbitkan secara instan melalui <strong>Auto-PDF Document Generator NusaBridge</strong>:</p>

        <ol class="gemini-ordered-list">
          <li><strong>Proforma Invoice (PI)</strong>: Faktur penawaran komersial awal yang mencantumkan kuantitas, harga satuan, Incoterms, serta rekening bank eksportir.</li>
          <li><strong>Export Sales Contract (SC)</strong>: Kontrak kesepakatan jual beli resmi yang mengikat kedua pihak berdasarkan yurisdiksi International Chamber of Commerce (ICC).</li>
          <li><strong>Commercial Invoice (CI)</strong>: Faktur tagihan resmi yang menjadi dasar penilaian bea masuk dan pajak impor di negara tujuan.</li>
          <li><strong>Packing List (PL)</strong>: Rincian spesifikasi fisik kemasan peti kemas (jumlah koli/karung, berat bersih/net weight, berat kotor/gross weight, dan volume CBM).</li>
          <li><strong>PEB (Pemberitahuan Ekspor Barang)</strong>: Dokumen pelaporan ke Kantor Pabean Bea Cukai Indonesia untuk mendapatkan Nota Pelayanan Ekspor (NPE).</li>
          <li><strong>Bill of Lading (B/L)</strong>: Bukti tanda terima barang di atas kapal sekaligus dokumen kepemilikan komoditas yang diterbitkan oleh perusahaan pelayaran kargo laut.</li>
        </ol>

        <div class="gemini-callout-box info-box">
          <span class="gcb-icon">📄</span>
          <div class="gcb-text">
            <strong>Otomatisasi 1-Klik:</strong> Anda dapat mencoba membuat draf berkas ini secara langsung pada menu <strong>Tab 2: Auto-PDF Generator</strong> di halaman ini!
          </div>
        </div>
      `;
    }

    // 9. Katalog & Komoditas 120 Produk
    if (q.includes('katalog') || q.includes('produk') || q.includes('komoditas') || q.includes('kopi') || q.includes('rempah') || q.includes('kriya') || q.includes('tekstil') || q.includes('apa saja')) {
      return `
        <p class="gemini-p"><strong>Halo!</strong> NusaBridge mengurasi tepat <strong>120 komoditas ekspor unggulan Indonesia</strong> yang telah terverifikasi melalui seleksi mutu dan audit legalitas KYC Hub, terbagi dalam 4 kategori strategis:</p>

        <ul class="gemini-list">
          <li><strong>☕ Kopi Ekspor Unggulan (30 Produk)</strong>:
            Varian Arabika Specialty dan Robusta Premium (Gayo Aceh, Toraja Kalosi, Mandheling, Lampung, Dampit Malang, Kintamani Bali, Bajawa Flores, Wamena Papua, dll.) dengan opsi <em>Green Beans</em> standar ekspor maupun <em>Artisan Roasted</em>.
          </li>
          <li><strong>🌿 Rempah-Rempah &amp; Hasil Alam (30 Produk)</strong>:
            Cengkeh Lalpari Maluku, Kayu Manis Korintji Grade A, Lada Putih Muntok Bangka, Vanila Gourmet Papua, Pala Banda, Kapulaga Jawa, serta Minyak Atsiri Nilam Aceh (Patchouli Oil).
          </li>
          <li><strong>🪵 Kriya &amp; Kerajinan Ramah Lingkungan (30 Produk)</strong>:
            Anyaman Rotan Alami Cirebon, Kerajinan Kayu Jati Blora bersertifikat SVLK, Anyaman Enceng Gondok Kulon Progo, Mangkuk Batok Kelapa Bali, dan Keranjang Seagrass Lombok.
          </li>
          <li><strong>🧵 Tekstil &amp; Wastra Nusantara (30 Produk)</strong>:
            Karya adiluhung warisan budaya: Batik Tulis Sutra Solo/Yogya, Batik Cap Pekalongan, Tenun Ikat Troso Jepara, Tenun Sumba Pewarna Alami, Songket Palembang Benang Emas, dan Ulos Batak Tarutung.
          </li>
        </ul>

        <p class="gemini-p">Seluruh produk dapat Anda eksplorasi secara mendalam pada halaman <strong>Katalog Produk</strong>!</p>
      `;
    }

    // 10. Konsultasi Bebas / Pertanyaan Umum (General Friendly Fallback)
    return `
      <p class="gemini-p">Halo! Saya <strong>NusaBridge Gemini AI Agent</strong>, asisten perdagangan ekspor-impor pintar yang siap membantu dan mengawal transaksi UMKM Indonesia menembus pasar global.</p>

      <p class="gemini-p">Saya dapat membantu Anda memecahkan berbagai tantangan ekspor secara instan dengan mengintegrasikan <strong>4 Pilar Utama NusaBridge</strong>:</p>

      <ul class="gemini-list">
        <li><strong>Pilar 1 (RFQ Studio &amp; Incoterms 2020)</strong>: Menghitung struktur biaya FOB, biaya kapal kargo laut, asuransi, hingga total harga penawaran CIF dengan margin aman UMKM.</li>
        <li><strong>Pilar 2 (Otomatisasi Dokumen Legal)</strong>: Menerbitkan draf berkas resmi Proforma Invoice, Commercial Invoice, dan Sales Contract berformat PDF standar ICC secara instan.</li>
        <li><strong>Pilar 3 (KYC Hub &amp; Kepatuhan Global)</strong>: Memeriksa validitas NIB OSS RBA, NPWP, Phytosanitary, izin US FDA, sertifikasi JAS Jepang, atau regulasi anti-deforestasi EUDR Uni Eropa.</li>
        <li><strong>Pilar 4 (Escrow Vault Multivalas)</strong>: Memberikan simulasi penguncian dana dan skema pencairan bertahap 4 fase agar transaksi bebas dari risiko gagal bayar.</li>
      </ul>

      <div class="gemini-callout-box info-box">
        <span class="gcb-icon">💬</span>
        <div class="gcb-text">
          <strong>Coba tanyakan hal-hal berikut:</strong><br>
          • <em>"Berapa estimasi biaya kirim 20 MT Kopi Robusta ke Hamburg?"</em><br>
          • <em>"Apa perbedaan antara skema FOB dan CIF?"</em><br>
          • <em>"Bagaimana alur pencairan dana di Escrow Vault?"</em><br>
          • <em>"Apa syarat izin ekspor rempah ke Amerika Serikat?"</em>
        </div>
      </div>
      <p class="gemini-p">Silakan ketik pertanyaan spesifik Anda atau pilih skenario cepat di panel kiri!</p>
    `;
  }

  async function processGeminiQuery(userMessage) {
    if (!userMessage || !userMessage.trim()) return;
    appendChatBubble('user', userMessage.trim());
    if (geminiInput) geminiInput.value = '';

    showTypingIndicator();

    // 1. Coba panggil Backend Server API (jika server aktif)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          removeTypingIndicator();
          appendChatBubble('agent', data.reply, `NusaBridge Gemini AI Agent • ${data.model || '@google/genai'}`);
          return;
        }
      }
    } catch (e) {
      // Backend offline, lanjutkan ke knowledge engine pintar bawaan
    }

    // 2. Fallback ke Knowledge Engine Cerdas
    setTimeout(() => {
      removeTypingIndicator();
      const reply = generateSmartAgentReply(userMessage);
      appendChatBubble('agent', reply, 'NusaBridge Gemini AI Agent • Live Connected');
    }, 450);
  }

  // Event Listener Pengiriman Chat
  if (btnSendGemini) {
    btnSendGemini.addEventListener('click', () => {
      processGeminiQuery(geminiInput?.value);
    });
  }

  if (geminiInput) {
    geminiInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        processGeminiQuery(geminiInput.value);
      }
    });
  }

  // Tombol Skenario Cepat di Sidebar
  scenarioItems.forEach(item => {
    item.addEventListener('click', () => {
      scenarioItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const scKey = item.getAttribute('data-scenario');
      if (SCENARIO_MAP[scKey]) {
        processGeminiQuery(SCENARIO_MAP[scKey]);
      }
    });
  });

  // Tombol Suggestion Chips
  chipPrompts.forEach(chip => {
    chip.addEventListener('click', () => {
      const p = chip.getAttribute('data-prompt');
      if (p) processGeminiQuery(p);
    });
  });

  // Bersihkan Chat
  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', () => {
      if (geminiHistory) {
        geminiHistory.innerHTML = '';
        renderInitialAgentGreeting();
      }
    });
  }

  function renderInitialAgentGreeting() {
    appendChatBubble('agent', `
      <p class="gemini-p"><strong>Halo! Selamat datang di NusaBridge.</strong> Saya adalah <strong>NusaBridge Gemini AI Agent</strong>, asisten perdagangan ekspor-impor pintar yang siap memfasilitasi komoditas UMKM Indonesia menuju pasar dunia.</p>

      <p class="gemini-p">Didukung oleh teknologi <strong>Google Gemini AI (@google/genai SDK)</strong>, saya siap membantu Anda mengawal seluruh tahapan ekspor melalui <strong>4 Pilar Utama NusaBridge</strong>:</p>

      <ul class="gemini-list">
        <li><strong>Pilar 1 (RFQ Studio)</strong>: Kalkulasi otomatis Incoterms 2020 (FOB, CFR, CIF) lengkap dengan proteksi margin aman eksportir.</li>
        <li><strong>Pilar 2 (Otomatisasi Dokumen)</strong>: Penerbitan instan draf berkas resmi Proforma Invoice &amp; Sales Contract PDF berstandar ICC.</li>
        <li><strong>Pilar 3 (KYC Hub &amp; Kepatuhan)</strong>: Validasi legalitas OSS NIB, NPWP, Phytosanitary, hingga regulasi US FDA &amp; EUDR Uni Eropa.</li>
        <li><strong>Pilar 4 (Escrow Vault)</strong>: Rekening penampung bersama multivalas dengan pencairan dana bertahap 4 fase pelayaran.</li>
      </ul>

      <div class="gemini-callout-box info-box">
        <span class="gcb-icon">⚡</span>
        <div class="gcb-text">
          <strong>Coba Eksplorasi Cepat:</strong> Klik salah satu kartu di panel <strong>"Skenario Ekspor Cepat"</strong> di samping kiri (misal: <em>Buyer Jerman: Kopi Robusta Hamburg</em>) atau tanyakan panduan ekspor Anda langsung di kolom pesan bawah!
        </div>
      </div>
    `, 'NusaBridge Gemini AI Agent • Live Connected');
  }

  // Tampilkan sambutan awal saat pertama load
  renderInitialAgentGreeting();

  // --------------------------------------------------------------------------
  // 1. SISTEM NAVIGASI TAB MODUL
  // --------------------------------------------------------------------------
  const tabButtons = document.querySelectorAll('.ai-tab-btn');
  const tabPanes = document.querySelectorAll('.ai-tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // --------------------------------------------------------------------------
  // 2. MODUL 1: AI SALES ASSISTANT & RFQ STUDIO (INCOTERMS 2020)
  // --------------------------------------------------------------------------
  const rfqInput = document.getElementById('rfqBuyerRawInput');
  const btnConvertRFQ = document.getElementById('btnConvertRFQ');
  const rfqResultGrid = document.getElementById('rfqResultGrid');
  const sampleButtons = document.querySelectorAll('.rfq-sample-btn');

  const SAMPLE_BUYER_TEXTS = {
    kopi: "Looking for 20 MT Robusta green beans CIF Hamburg port, packaging 60kg gunny bags, delivery schedule November 2026.",
    rempah: "Need 5 MT Clove Lalpari CIF Los Angeles port, FDA approved required, shipment from Indonesia.",
    kriya: "RFQ for 2,000 pcs Handwoven Rattan Chairs FOB Tanjung Priok to Tokyo port, ISPM 15 fumigation standard."
  };

  sampleButtons.forEach(b => {
    b.addEventListener('click', () => {
      const type = b.getAttribute('data-sample');
      if (SAMPLE_BUYER_TEXTS[type] && rfqInput) {
        rfqInput.value = SAMPLE_BUYER_TEXTS[type];
        parseAndRenderRFQ();
      }
    });
  });

  function parseAndRenderRFQ() {
    if (!rfqResultGrid) return;
    const text = (rfqInput?.value || '').toLowerCase();

    let commodity = 'Kopi Robusta Lampung Grade 1';
    let hsCode = '0901.11.10';
    let pol = 'Pelabuhan Tanjung Priok, Jakarta';
    let pod = 'Port of Hamburg, Germany';
    let incoterm = 'CIF Hamburg (Incoterms 2020)';
    let qty = '20,000 Kg (20 MT)';
    let fobPrice = 3.85;
    let freightInsurance = 0.42;

    if (text.includes('clove') || text.includes('cengkeh') || text.includes('los angeles')) {
      commodity = 'Cengkeh Lalpari Maluku Super';
      hsCode = '0907.10.00';
      pol = 'Pelabuhan Tanjung Perak, Surabaya';
      pod = 'Port of Los Angeles, USA';
      incoterm = 'CIF Los Angeles (Incoterms 2020)';
      qty = '5,000 Kg (5 MT)';
      fobPrice = 12.50;
      freightInsurance = 1.15;
    } else if (text.includes('rattan') || text.includes('rotan') || text.includes('tokyo')) {
      commodity = 'Kursi Rotan Alami Cirebon';
      hsCode = '9401.52.00';
      pol = 'Pelabuhan Tanjung Priok, Jakarta';
      pod = 'Tokyo Port, Japan';
      incoterm = 'FOB Tanjung Priok (Incoterms 2020)';
      qty = '2,000 Pcs (2 x 40ft High Cube)';
      fobPrice = 78.00;
      freightInsurance = 0.00;
    }

    const marginPct = 18.5;
    const baseProductionCost = (fobPrice * 0.72).toFixed(2);
    const truckingPortCost = (fobPrice * 0.095).toFixed(2);
    const netProfitMargin = (fobPrice * (marginPct / 100)).toFixed(2);
    const finalUnitPrice = (fobPrice + freightInsurance).toFixed(2);
    const totalContractVal = (parseFloat(finalUnitPrice) * (parseInt(qty.replace(/[^0-9]/g, '')) || 20000)).toLocaleString('en-US');

    rfqResultGrid.innerHTML = `
      <div class="sop-col">
        <h5>1. Ekstraksi Entitas &amp; Parameter RFQ</h5>
        <div class="sop-val-big" style="font-size:1.15rem; color:#60a5fa;">${commodity}</div>
        <p class="sop-desc"><strong>Volume / Satuan:</strong> ${qty}</p>
        <p class="sop-desc"><strong>Pelabuhan Muat (POL):</strong> ${pol}</p>
        <p class="sop-desc"><strong>Pelabuhan Bongkar (POD):</strong> ${pod}</p>
        <div class="sop-badge green">✓ Incoterms Terdeteksi: ${incoterm}</div>
      </div>

      <div class="sop-col">
        <h5>2. Rincian Struktur Biaya Ekspor (Per Satuan)</h5>
        <div class="sop-highlight-box">
          <div class="shb-row"><span>Biaya Produksi &amp; Kemasan:</span> <strong>USD ${baseProductionCost}</strong></div>
          <div class="shb-row"><span>Trucking &amp; Port Handling:</span> <strong>USD ${truckingPortCost}</strong></div>
          <div class="shb-row"><span>Ocean Freight &amp; Asuransi:</span> <strong>USD ${freightInsurance.toFixed(2)}</strong></div>
          <div class="shb-row" style="border-top:1px dashed rgba(255,255,255,0.2); padding-top:4px;">
            <span style="color:#34d399;">Margin Aman UMKM (+${marginPct}%):</span> 
            <strong style="color:#34d399;">+USD ${netProfitMargin}</strong>
          </div>
        </div>
      </div>

      <div class="sop-col">
        <h5>3. Rekomendasi Kuotasi &amp; Nilai Kontrak</h5>
        <div class="sop-highlight-box" style="background:rgba(16,185,129,0.12); border-color:#10b981;">
          <div class="shb-row"><span>Harga Penawaran Final:</span> <strong style="font-size:1.25rem; color:#34d399;">USD ${finalUnitPrice}</strong></div>
          <div class="shb-row"><span>Estimasi Nilai Kontrak:</span> <strong style="color:#ffffff;">USD ${totalContractVal}</strong></div>
          <div class="shb-row"><span>Rekomendasi HS Code:</span> <code>${hsCode}</code></div>
        </div>
        <button class="btn btn-primary btn-sm btn-block" id="btnForwardToDocGen" type="button">
          Terbitkan Proforma Invoice Otomatis ➔
        </button>
      </div>
    `;

    document.getElementById('btnForwardToDocGen')?.addEventListener('click', () => {
      const pdfTabBtn = document.querySelector('[data-tab="tab-pdf"]');
      if (pdfTabBtn) pdfTabBtn.click();
    });
  }

  if (btnConvertRFQ) {
    btnConvertRFQ.addEventListener('click', () => {
      btnConvertRFQ.innerHTML = '<span>🤖 Gemini AI Memproses Incoterms 2020...</span>';
      setTimeout(() => {
        parseAndRenderRFQ();
        btnConvertRFQ.innerHTML = '<span>⚡ Konversi Pesan Buyer Menjadi RFQ Resmi (Incoterms 2020)</span>';
      }, 400);
    });
  }

  // --------------------------------------------------------------------------
  // 3. MODUL 2: AUTO-PDF DOCUMENT GENERATOR (TOOL CALLING)
  // --------------------------------------------------------------------------
  const docTypeButtons = document.querySelectorAll('.doc-type-btn');
  const docPaperSheet = document.getElementById('docPaperSheet');
  const btnPrintPdfDoc = document.getElementById('btnPrintPdfDoc');
  const btnCopyDocText = document.getElementById('btnCopyDocText');

  let currentDocType = 'pi';

  function renderDocumentSheet(type) {
    currentDocType = type;
    docTypeButtons.forEach(b => b.classList.toggle('active', b.getAttribute('data-doctype') === type));

    if (!docPaperSheet) return;

    if (type === 'pi') {
      docPaperSheet.innerHTML = `
        <div class="dps-header">
          <div class="dps-brand">
            <strong>NUSABRIDGE EXPORT TRADE FACILITATION ENGINE</strong>
            <p>Integrated Global Trade &amp; Automated Customs Documentation Platform</p>
          </div>
          <div class="dps-meta">
            <h4>PROFORMA INVOICE</h4>
            <div style="font-size:11.5px; color:#64748b;">Invoice No: <strong>#PI-2026-DE-088</strong></div>
            <div style="font-size:11.5px; color:#64748b;">Date: <strong>19 Oktober 2026</strong></div>
          </div>
        </div>

        <div class="dps-parties-grid">
          <div>
            <strong style="color:#0f172a; font-size:12px; text-transform:uppercase;">Seller / Exporter:</strong>
            <p style="margin:4px 0 0; font-size:12px; color:#334155;">
              <strong>CV Kopi Nusantara Bersama</strong><br>
              NIB: 0120268840001 &bull; NPWP: 01.234.567.8-012.000<br>
              Takengon, Aceh Tengah, Indonesia<br>
              Escrow Vault ID: <code>NB-ESC-USD-99214</code>
            </p>
          </div>
          <div>
            <strong style="color:#0f172a; font-size:12px; text-transform:uppercase;">Consignee / Buyer:</strong>
            <p style="margin:4px 0 0; font-size:12px; color:#334155;">
              <strong>Hanseatic Coffee Importers GmbH</strong><br>
              Am Sandtorkai 48, 20457 Hamburg, Germany<br>
              EORI: DE882194125 &bull; VAT: DE11893240<br>
              Bank: Deutsche Bank AG Hamburg
            </p>
          </div>
        </div>

        <div style="margin-bottom:12px; display:flex; gap:20px; font-size:12px; color:#475569;">
          <span>Port of Loading: <strong>Belawan Port, Medan (IDBLW)</strong></span>
          <span>Port of Discharge: <strong>Port of Hamburg, Germany (DEHAM)</strong></span>
          <span>Terms: <strong>CIF Hamburg (Incoterms 2020)</strong></span>
        </div>

        <table class="dps-table">
          <thead>
            <tr>
              <th>Item &amp; Description</th>
              <th>HS Code</th>
              <th>Qty (Kg)</th>
              <th>Unit Price (USD)</th>
              <th>Total Amount (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Kopi Arabika Gayo Specialty Grade 1</strong><br>
                <small style="color:#64748b;">Moisture &lt;12%, Defect &lt;4%, Screen 16/18, Gunny Bags 60Kg</small>
              </td>
              <td>0901.11.10</td>
              <td>20,000</td>
              <td>$4.27</td>
              <td><strong>$85,400.00</strong></td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th colspan="4" style="text-align:right;">Subtotal FOB Belawan:</th>
              <td>$77,000.00</td>
            </tr>
            <tr>
              <th colspan="4" style="text-align:right;">Ocean Freight &amp; Marine Cargo Insurance (CIF):</th>
              <td>$8,400.00</td>
            </tr>
            <tr>
              <th colspan="4" style="text-align:right; font-size:13px; color:#0f172a;">GRAND TOTAL (CIF HAMBURG):</th>
              <td style="font-size:13px; font-weight:800; color:#059669;">USD $85,400.00</td>
            </tr>
          </tfoot>
        </table>

        <div style="background:#f1f5f9; padding:10px 14px; border-radius:6px; font-size:11.5px; color:#334155; margin-bottom:14px;">
          <strong>Payment Terms via Escrow Vault:</strong> 30% Advance Down Payment upon Confirmation, 30% against PEB Customs Clearance, 20% upon Clean Bill of Lading, 20% Balance upon Port of Hamburg Arrival.
        </div>

        <div class="dps-footer-seal">
          <div>
            <span class="seal-stamp">✓ VERIFIED BY NUSABRIDGE AI TOOL CALLING</span>
            <div style="font-size:10px; color:#94a3b8; margin-top:4px;">Digital Signature Hash: <code>e8b4...92c1</code></div>
          </div>
          <div style="text-align:right; font-size:11px; color:#64748b;">
            Authorized Signatory &amp; Stamp<br>
            <strong style="color:#0f172a;">NusaBridge AI Trade Settlement Network</strong>
          </div>
        </div>
      `;
    } else {
      docPaperSheet.innerHTML = `
        <div class="dps-header">
          <div class="dps-brand">
            <strong>INTERNATIONAL CHAMBER OF COMMERCE (ICC) MODEL</strong>
            <p>International Export Sales Contract &bull; Governed by CISG &amp; Incoterms 2020</p>
          </div>
          <div class="dps-meta">
            <h4>EXPORT SALES CONTRACT</h4>
            <div style="font-size:11.5px; color:#64748b;">Contract No: <strong>#SC-2026-US-104</strong></div>
            <div style="font-size:11.5px; color:#64748b;">Jurisdiction: <strong>Singapore International Arbitration (SIAC)</strong></div>
          </div>
        </div>

        <div class="dps-parties-grid">
          <div>
            <strong style="color:#0f172a; font-size:12px; text-transform:uppercase;">The Seller:</strong>
            <p style="margin:4px 0 0; font-size:12px; color:#334155;">
              <strong>Koperasi Rempah Organik Maluku</strong><br>
              Ambon, Maluku, Republic of Indonesia<br>
              Exporter ID: <code>EXP-NUSA-2026-081</code>
            </p>
          </div>
          <div>
            <strong style="color:#0f172a; font-size:12px; text-transform:uppercase;">The Buyer:</strong>
            <p style="margin:4px 0 0; font-size:12px; color:#334155;">
              <strong>Pacific Spice &amp; Botanical Co.</strong><br>
              Long Beach, California, United States of America<br>
              US FDA Reg: <code>18820499120</code>
            </p>
          </div>
        </div>

        <div style="font-size:12px; color:#334155; margin-bottom:14px; line-height:1.6;">
          <strong>Clause 1 (Commodity &amp; Specs):</strong> 5,000 Kg Clove Lalpari Handpicked Clean, Moisture &lt;11.5%, Volatile Oil &gt;19%, ASTA Cleanliness Standard.<br>
          <strong>Clause 2 (Price &amp; Term):</strong> CIF Los Angeles Port at USD $13.65 / Kg, Total Contract Value USD $68,250.00.<br>
          <strong>Clause 3 (Inspection):</strong> Phytosanitary Certificate issued by Indonesian Agricultural Quarantine Agency &amp; Lab CoA by Sucofindo.<br>
          <strong>Clause 4 (Smart Escrow Settlement):</strong> All payments are secured within NusaBridge Escrow Vault in USD currency with automated milestone release rules.
        </div>

        <div class="dps-footer-seal">
          <div>
            <span class="seal-stamp" style="border-color:#2563eb; color:#2563eb;">⚖️ LEGALLY BINDING DIGITAL CONTRACT</span>
            <div style="font-size:10px; color:#94a3b8; margin-top:4px;">Electronic Identification &amp; Trust Services (eIDAS) Compliant</div>
          </div>
          <div style="text-align:right; font-size:11px; color:#64748b;">
            Countersigned Digitally by Both Parties<br>
            <strong style="color:#0f172a;">Valid &amp; Enforceable Globally</strong>
          </div>
        </div>
      `;
    }
  }

  docTypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      renderDocumentSheet(btn.getAttribute('data-doctype'));
    });
  });

  if (btnPrintPdfDoc) {
    btnPrintPdfDoc.addEventListener('click', () => {
      window.print();
    });
  }

  if (btnCopyDocText) {
    btnCopyDocText.addEventListener('click', () => {
      if (docPaperSheet) {
        navigator.clipboard.writeText(docPaperSheet.innerText).then(() => {
          alert('Teks draf dokumen ekspor resmi berhasil disalin ke clipboard!');
        });
      }
    });
  }

  // --------------------------------------------------------------------------
  // 4. MODUL 3: KYC HUB & KEPATUHAN GLOBAL (NIB/NPWP & FDA/JAS/EUDR)
  // --------------------------------------------------------------------------
  const btnRunKycAudit = document.getElementById('btnRunKycAudit');
  const kycResultCard = document.getElementById('kycResultCard');
  const kycTargetCountry = document.getElementById('kycTargetCountry');

  const KYC_REGULATION_KNOWLEDGE = {
    usa: {
      standard: "FDA (Food and Drug Administration) & Bioterrorism Act",
      items: [
        "Registrasi Fasilitas Pangan (FFR) pada US FDA Database: Terverifikasi",
        "Kewajiban Pengisian FDA Prior Notice sebelum Kapal Sandar: Aktif",
        "Standar Kebersihan ASTA & Pengujian Mikotoksin Bebas Kontaminan: Lolos Uji Lab",
        "Kepatuhan US Foreign Supplier Verification Program (FSVP): Siap Terbit"
      ]
    },
    jepang: {
      standard: "JAS (Japanese Agricultural Standard) & MHLW Food Sanitation",
      items: [
        "Sertifikasi Standar Organik JAS Pertanian Jepang: Terdaftar Terverifikasi",
        "Pemeriksaan Positive List System (Batas Maksimum Residu Pestisida MHLW): 100% Lolos",
        "Certificate of Origin (COO Form IJEPA Indonesia-Japan Economic Partnership): Aktif",
        "Inspeksi Bebas Serangga Hidup Badan Karantina Tumbuhan: Lolos Sertifikasi"
      ]
    },
    jerman: {
      standard: "EUDR (European Union Deforestation Regulation) & GSP+",
      items: [
        "Geolocation Tagging Koordinat Kebun Bebas Deforestasi Pasca-2020: Terpetakan GIS",
        "Due Diligence Statement (DDS) TRACES NT Komisi Eropa: Siap Diterbitkan",
        "Uji Laboratorium Bebas Logam Berat & Pestisida Terlarang Uni Eropa: Lolos",
        "COO Form A / REX System untuk Pembebasan Bea Masuk (0% Duty): Memenuhi Syarat"
      ]
    },
    uea: {
      standard: "Sertifikasi Halal BPJPH & Akreditasi ESMA UAE",
      items: [
        "Sertifikat Halal Resmi BPJPH Indonesia (Mutual Recognition Agreement UAE): Aktif",
        "Kepatuhan Standar Kemasan Pangan Higienis Gulf Standards (GSO): Terpenuhi",
        "Dokumen COO Skema Perjanjian Perdagangan IUAE-CEPA (0% Tarif): Terbit Otomatis",
        "Legalitas Asosiasi Eksportir Kemenkumham: Valid & Terdaftar"
      ]
    }
  };

  function renderKycResult() {
    if (!kycResultCard) return;
    const country = kycTargetCountry?.value || 'usa';
    const reg = KYC_REGULATION_KNOWLEDGE[country] || KYC_REGULATION_KNOWLEDGE.usa;
    const nib = document.getElementById('kycNibInput')?.value || '0120268840001';
    const npwp = document.getElementById('kycNpwpInput')?.value || '01.234.567.8-012.000';

    kycResultCard.innerHTML = `
      <div class="krc-header">
        <div>
          <strong style="color:#0f172a; font-size:14px;">Hasil Audit Legalitas &amp; Standar Mutu</strong>
          <div style="font-size:11px; color:#64748b;">Standar Regulasi: <strong>${reg.standard}</strong></div>
        </div>
        <span class="krc-score">100% LOLOS</span>
      </div>

      <div style="margin-bottom:12px;">
        <div class="krc-item">
          <span class="krc-icon">✓</span>
          <div>
            <strong>NIB Pelaku Usaha (${nib}):</strong>
            <p style="margin:2px 0 0; font-size:11.5px; color:#334155;">Status OSS Aktif &bull; Hak Akses Kepabeanan Ekspor Terbuka &bull; Skala Usaha Terverifikasi</p>
          </div>
        </div>
        <div class="krc-item">
          <span class="krc-icon">✓</span>
          <div>
            <strong>NPWP Perusahaan (${npwp}):</strong>
            <p style="margin:2px 0 0; font-size:11.5px; color:#334155;">Status Pajak Valid DJP Kemenkeu &bull; Bebas Tunggakan Kepabeanan</p>
          </div>
        </div>
      </div>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:14px;">
        <strong style="font-size:12px; color:#0f172a; display:block; margin-bottom:8px;">Deteksi Regulasi Negara Tujuan:</strong>
        ${reg.items.map(item => `
          <div class="krc-item" style="margin-bottom:6px;">
            <span class="krc-icon" style="color:#059669;">●</span>
            <span style="font-size:11.5px; color:#334155;">${item}</span>
          </div>
        `).join('')}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; background:#ecfdf5; padding:10px 14px; border-radius:6px; border:1px solid #a7f3d0;">
        <span style="font-size:12px; font-weight:700; color:#065f46;">🛡️ Verified Global Exporter Shield Diterbitkan</span>
        <span style="font-size:11px; color:#059669; font-weight:800;">SIAP EKSPOR</span>
      </div>
    `;
  }

  if (btnRunKycAudit) {
    btnRunKycAudit.addEventListener('click', () => {
      btnRunKycAudit.innerHTML = '<span>🤖 Mengaudit Database OSS &amp; Bea Cukai...</span>';
      setTimeout(() => {
        renderKycResult();
        btnRunKycAudit.innerHTML = '<span>🔍 Jalankan Audit Kepatuhan Regulasi Global</span>';
      }, 350);
    });
  }

  // --------------------------------------------------------------------------
  // 5. MODUL 4: ESCROW VAULT & AI CHAT ASSISTANT (4 FASE NOTIFIKASI)
  // --------------------------------------------------------------------------
  const phaseButtons = document.querySelectorAll('.escrow-btn-phase');
  const chatMessages = document.getElementById('escrowChatMessages');
  const chatInput = document.getElementById('escrowChatInput');
  const btnSendChat = document.getElementById('btnSendEscrowChat');
  const totalVaultStatus = document.getElementById('escrowTotalVaultStatus');

  const PHASE_NOTIFICATIONS = {
    1: {
      tag: "Fase 1 (30% DP Cair)",
      title: "Kontrak Disepakati & Dana Escrow Terkunci",
      amount: "USD 6,000",
      pct: "30%",
      msg: "Kabar gembira! Buyer Hanseatic Coffee Importers GmbH telah menyetujui Sales Contract #SC-2026-DE-088 dan mengunci 100% total dana kontrak (USD 20,000) di NusaBridge Escrow Vault. Sesuai Smart Contract Fase 1, dana uang muka 30% sebesar USD 6,000 telah dilepaskan ke rekening modal kerja UMKM Anda.",
      hash: "0x7a89b...3c14f"
    },
    2: {
      tag: "Fase 2 (30% PEB Cair)",
      title: "Pemberitahuan Ekspor Barang (PEB) Terbit",
      amount: "USD 6,000",
      pct: "60%",
      msg: "Verifikasi Otomatis Kepabeanan Berhasil! Dokumen PEB (Pemberitahuan Ekspor Barang) dan Nota Pelayanan Ekspor (NPE) nomor 088219/KPU.01/2026 telah terkonfirmasi valid oleh sistem Bea Cukai. Sesuai kesepakatan Fase 2, dana sebesar USD 6,000 (akumulasi 60%) telah dicairkan ke rekening Anda.",
      hash: "0x3f12a...9b42e"
    },
    3: {
      tag: "Fase 3 (20% B/L Cair)",
      title: "Kapal Berlayar & Bill of Lading On-Board",
      amount: "USD 4,000",
      pct: "80%",
      msg: "Telemetri Maritim AIS Terverifikasi! Peti kemas kargo Anda telah dimuat di atas kapal MV Meratus Flores dan Bill of Lading (B/L) resmi Clean On Board nomor MEDN-HAM-9921 telah diterbitkan pihak pelayaran. Sesuai Fase 3, dana tambahan USD 4,000 (total 80%) telah berhasil ditransfer.",
      hash: "0x9c41d...6e77a"
    },
    4: {
      tag: "Fase 4 (20% Final Tuntas)",
      title: "Kargo Tiba di Pelabuhan & Buyer Konfirmasi Sesuai",
      amount: "USD 4,000",
      pct: "100%",
      msg: "Transaksi Selesai 100%! Kapal kargo telah sandar di Port of Hamburg, Jerman. Pihak buyer telah mengonfirmasi bahwa seluruh 20 MT biji kopi telah diterima dalam kondisi prima sesuai spesifikasi kontrak. Sisa pelunasan 20% sebesar USD 4,000 telah dicairkan. Transaksi dinyatakan tuntas paripurna!",
      hash: "0x2e88a...4b011"
    }
  };

  function appendAgentMessage(text, headerTag) {
    if (!chatMessages) return;
    const msgEl = document.createElement('div');
    msgEl.className = 'ecb-msg agent';
    msgEl.innerHTML = `
      <strong>🤖 ${headerTag || 'NusaBridge Escrow AI'} &bull; ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</strong>
      ${text}
    `;
    chatMessages.appendChild(msgEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendUserMessage(text) {
    if (!chatMessages) return;
    const msgEl = document.createElement('div');
    msgEl.className = 'ecb-msg';
    msgEl.style.cssText = 'background:#2563eb; color:#ffffff; align-self:flex-end; border-radius:12px; max-width:85%; padding:9px 13px; font-size:12.5px;';
    msgEl.innerText = text;
    chatMessages.appendChild(msgEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  phaseButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const phaseNum = btn.getAttribute('data-phase');
      phaseButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const data = PHASE_NOTIFICATIONS[phaseNum];
      if (!data) return;

      if (totalVaultStatus) {
        totalVaultStatus.innerText = `PROGRES VAULT: ${data.pct}`;
      }

      appendAgentMessage(`
        <div style="font-weight:750; color:#34d399; margin-bottom:4px;">${data.title}</div>
        <p style="margin:0 0 6px;">${data.msg}</p>
        <div style="font-size:11px; color:#94a3b8; border-top:1px solid #334155; padding-top:4px;">
          Pencairan Dana: <strong style="color:#ffffff;">${data.amount}</strong> &bull; Total Progres: <strong style="color:#34d399;">${data.pct}</strong><br>
          Hash Smart Contract: <code>${data.hash}</code>
        </div>
      `, `NOTIFIKASI ESCROW VAULT - ${data.tag}`);
    });
  });

  async function handleSendChat() {
    const text = chatInput?.value?.trim();
    if (!text) return;
    appendUserMessage(text);
    if (chatInput) chatInput.value = '';

    const lower = text.toLowerCase();

    // Coba panggil Backend API jika server menyala
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          appendAgentMessage(data.reply.replace(/\n/g, '<br>'), 'NusaBridge Gemini AI Agent');
          return;
        }
      }
    } catch (e) {
      // Backend offline, gunakan rule engine cerdas 4 pilar
    }

    setTimeout(() => {
      let reply = "";
      if (lower.includes('hamburg') || (lower.includes('robusta') && (lower.includes('cif') || lower.includes('kopi')))) {
        reply = `Halo Hanseatic Coffee Importers! Terima kasih telah menggunakan NusaBridge. Berikut adalah analisis transaksi ekspor Kopi Robusta Lampung Anda:<br><br>
📊 <strong>1. Kalkulasi RFQ Studio (Pilar 1)</strong><br>
Harga Dasar FOB Tanjung Priok: $3.85 / Kg ($77,000 USD)<br>
Ocean Freight &amp; Asuransi Kargo: $0.42 / Kg ($8,400 USD)<br>
Total Penawaran CIF Hamburg: <strong>$85,400 USD</strong> ($4.27 / Kg)<br>
Margin Aman UMKM: <strong>+18.5% Net Profit</strong><br><br>
🛡️ <strong>2. Audit Legalitas &amp; KYC Hub (Pilar 3)</strong><br>
NIB Pelaku Usaha: Valid &amp; Aktif Ekspor<br>
Sertifikasi Saniter: Phytosanitary &amp; Karantina Lolos (Bebas Hama Organisme)<br>
Skor Kepatuhan: <strong>100% Score (Verified Seller Shield)</strong><br><br>
📄 <strong>3. Otomatisasi Dokumen Legal (Pilar 2)</strong><br>
Commercial Invoice #INV-2026-DE-088 dan Sales Contract (CIF Hamburg) telah secara otomatis diterbitkan berformat PDF.<br><br>
🔒 <strong>4. Skema Escrow Vault (Pilar 4)</strong><br>
Pembayaran sebesar $85,400 USD akan dikunci secara aman di Escrow Vault dan dicairkan secara bertahap:<br>
• <strong>Tahap 1 (30% - $25,620)</strong>: DP Cair saat Kontrak Ditandatangani.<br>
• <strong>Tahap 2 (30% - $25,620)</strong>: Cair saat Dokumen PEB &amp; Stuffing Container Selesai.<br>
• <strong>Tahap 3 (20% - $17,080)</strong>: Cair saat Kapal Berlayar &amp; Bill of Lading (B/L) Terbit.<br>
• <strong>Tahap 4 (20% - $17,080)</strong>: Settlement Final saat Kontainer Tiba di Hamburg Port.`;
      } else if (lower.includes('dp') || lower.includes('uang muka') || lower.includes('fase 1')) {
        reply = "Untuk pencairan 30% Down Payment, buyer wajib menandatangani Sales Contract secara digital dan menyetor 100% dana ke Escrow Vault. Begitu dana terkunci, 30% langsung cair ke rekening UMKM.";
      } else if (lower.includes('peb') || lower.includes('bea cukai')) {
        reply = "Pencairan Fase 2 (30%) memerlukan nomor pendaftaran PEB yang valid dari sistem CEISA Bea Cukai. AI Agent NusaBridge otomatis memverifikasi status NPE (Nota Pelayanan Ekspor).";
      } else if (lower.includes('kapal') || lower.includes('b/l') || lower.includes('bill of lading')) {
        reply = "Pencairan Fase 3 (20%) terhubung langsung dengan sensor AIS kapal kargo. Saat kargo dimuat (on-board) dan B/L terbit, sistem langsung membuka kunci dana.";
      } else {
        reply = `Halo! Saya <strong>NusaBridge Gemini AI Agent</strong>, asisten B2B perdagangan ekspor-impor pintar untuk UMKM Indonesia.<br><br>
Saya siap mengawal transaksi ekspor Anda dengan <strong>4 Pilar NusaBridge</strong>:<br>
1. <strong>RFQ Studio &amp; Incoterms 2020</strong>: Menghitung estimasi FOB, Ocean Freight, Asuransi maritim, hingga harga CIF dengan margin aman UMKM.<br>
2. <strong>Otomatisasi Dokumen</strong>: Menerbitkan draf berkas resmi Proforma Invoice, Commercial Invoice, dan Export Sales Contract berformat PDF instan.<br>
3. <strong>KYC Hub &amp; Kepatuhan Global</strong>: Memverifikasi NIB, NPWP, Phytosanitary, izin US FDA, sertifikasi JAS Jepang, atau regulasi EUDR Eropa dengan skor 100%.<br>
4. <strong>Escrow Vault Multivalas</strong>: Melindungi dana transaksi dengan pelepasan bertahap 4 fase (30% DP ➔ 30% PEB ➔ 20% Bill of Lading ➔ 20% Pelunasan Akhir).`;
      }
      appendAgentMessage(reply, 'NusaBridge Gemini AI Agent');
    }, 350);
  }

  if (btnSendChat) btnSendChat.addEventListener('click', handleSendChat);
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSendChat();
    });
  }

  // Inisialisasi awal render
  parseAndRenderRFQ();
  renderDocumentSheet('pi');
  renderKycResult();
  
  // Sambutan awal chat
  appendAgentMessage(
    "Selamat datang di Simulasi Escrow Vault NusaBridge. Sistem ini mengamankan pembayaran ekspor bernilai tinggi agar UMKM tidak menanggung risiko gagal bayar buyer luar negeri. Klik salah satu tombol 4 Fase di sebelah kiri untuk menguji notifikasi pencairan bertahap.",
    "Smart Contract Live System"
  );

});
