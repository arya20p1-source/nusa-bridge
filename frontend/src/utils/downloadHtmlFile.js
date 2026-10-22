/**
 * Utilitas unduh dokumen (dipakai TxModal, Docs sandbox, dan Manifest radar).
 */
export function downloadHtmlFile(filename, title, bodyHtml) {
  const fullDoc = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #0f172a; line-height: 1.5; background: #fff; }
    .container { max-width: 800px; margin: 0 auto; border: 2px solid #0f172a; padding: 28px; border-radius: 8px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 20px; }
    .title { font-size: 20px; font-weight: 800; color: #1e3a8a; }
    .seal { font-size: 11px; font-weight: 800; color: #1b68f8; border: 1.5px solid #1b68f8; padding: 4px 10px; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 18px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 12.5px; text-align: left; }
    th { background: #f8fafc; font-weight: 700; color: #1e293b; }
    .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
    .btn-print { background: #1b68f8; color: #fff; border: none; padding: 8px 16px; font-weight: 700; border-radius: 6px; cursor: pointer; margin-bottom: 16px; font-size: 13px; }
    @media print { .btn-print { display: none; } body { margin: 0; } .container { border: none; padding: 0; } }
  </style>
</head>
<body>
  <div style="text-align: right; max-width: 800px; margin: 0 auto;">
    <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan sebagai PDF</button>
  </div>
  <div class="container">
    ${bodyHtml}
  </div>
</body>
</html>`;

  const blob = new Blob([fullDoc], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default downloadHtmlFile;
