// src/utils/gs1Parser.js
/**
 * Phân tích mã vạch GS1-128 (VD: (01)08934567890101(17)261231(10)LOT2026A)
 * Trả về SKU, Số lô và Hạn sử dụng (YYYY-MM-DD). Nếu là mã vạch thường thì trả về nguyên SKU.
 */
export function parseGs1Barcode(rawInput) {
  const raw = String(rawInput || '').trim();
  if (!raw) {
    return { isGs1: false, sku: '', batchCode: '', expiryDate: '' };
  }

  let sku = '';
  let expiryDate = '';
  let batchCode = '';
  let isGs1 = false;

  const GS_CHAR = String.fromCharCode(29);

  // Dạng có ngoặc đơn: (01)...(17)...(10)...
  if (raw.includes('(01)') || raw.includes('(10)') || raw.includes('(17)')) {
    isGs1 = true;
    const gtinMatch = raw.match(/\(01\)(\d{8,14})/);
    const expMatch = raw.match(/\(17\)(\d{6})/);
    const lotMatch = raw.match(/\(10\)([^(]+)/);

    if (gtinMatch) {
      sku = gtinMatch[1].length === 14 && gtinMatch[1].startsWith('0')
        ? gtinMatch[1].slice(1)
        : gtinMatch[1];
    }
    if (expMatch) {
      expiryDate = formatYyMmDd(expMatch[1]);
    }
    if (lotMatch) {
      batchCode = lotMatch[1].split(GS_CHAR)[0].trim();
    }
    return { isGs1, sku: sku || raw, batchCode, expiryDate };
  }

  // Dạng chuỗi thô không ngoặc bắt đầu bằng 01 + 14 số GTIN
  if (/^01\d{14}/.test(raw)) {
    isGs1 = true;
    const gtin14 = raw.slice(2, 16);
    sku = gtin14.startsWith('0') ? gtin14.slice(1) : gtin14;
    let rest = raw.slice(16);
    while (rest.startsWith(GS_CHAR)) rest = rest.slice(1);

    while (rest.length >= 2) {
      if (rest.startsWith('17') && /^\d{6}/.test(rest.slice(2, 8))) {
        expiryDate = formatYyMmDd(rest.slice(2, 8));
        rest = rest.slice(8);
        while (rest.startsWith(GS_CHAR)) rest = rest.slice(1);
      } else if (rest.startsWith('10')) {
        const gsIdx = rest.indexOf(GS_CHAR, 2);
        batchCode = gsIdx > 0 ? rest.slice(2, gsIdx).trim() : rest.slice(2).trim();
        rest = gsIdx > 0 ? rest.slice(gsIdx + 1) : '';
      } else {
        break;
      }
    }
    return { isGs1, sku, batchCode, expiryDate };
  }

  return { isGs1: false, sku: raw, batchCode: '', expiryDate: '' };
}

function formatYyMmDd(yymmdd) {
  if (!/^\d{6}$/.test(yymmdd)) return '';
  const yy = Number(yymmdd.slice(0, 2));
  const mm = Number(yymmdd.slice(2, 4));
  let dd = Number(yymmdd.slice(4, 6));
  const year = 2000 + yy;
  if (mm < 1 || mm > 12) return '';
  if (dd === 0) {
    dd = new Date(year, mm, 0).getDate();
  }
  return `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}
