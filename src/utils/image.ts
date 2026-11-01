// Utilitas kompresi gambar untuk pengiriman foto via MQTT.
//
// BUG FIX: Foto dikirim mentah sebagai base64 tanpa kompresi. Foto dari
// kamera HP zaman sekarang berukuran 3-10 MB => base64 payload bisa 15+ MB.
// Broker publik (EMQX) menolak paket sebesar itu (limit ~1-8 MB), sehingga
// "gabisa kirim foto". Solusi: downscale + re-encode JPEG quality 80% lewat
// Canvas API sebelum dikirim, plus validasi tipe file dan fallback
// penyimpanan lokal yang aman terhadap kuota localStorage yang penuh.

export interface CompressResult {
  dataUrl: string;
  originalBytes: number;
  compressedBytes: number;
}

const MAX_DIMENSION = 1280; // sisi terpanjang setelah di-downscale
const JPEG_QUALITY = 0.8;
/** Batas aman payload MQTT broker publik (~7 MB). */
export const MAX_PAYLOAD_BYTES = 7 * 1024 * 1024;

export const estimatedBase64Bytes = (dataUrl: string): number => {
  const commaIdx = dataUrl.indexOf(',');
  const b64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  return Math.floor((b64.length * 3) / 4);
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/** Muat File menjadi HTMLImageElement (via object URL agar hemat memori). */
const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal membaca file gambar.'));
    };
    img.src = url;
  });

const drawToDataUrl = (img: HTMLImageElement, maxSide: number, quality: number): string => {
  const ratio = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * ratio));
  const h = Math.max(1, Math.round(img.naturalHeight * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak didukung browser ini.');
  // Background putih agar PNG transparan tidak jadi hitam saat jadi JPEG
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
};

/**
 * Kompres gambar dengan downscale bertahap sampai di bawah batas payload.
 * Mengembalikan data URL JPEG siap kirim + info ukuran sebelum/sesudah.
 */
export async function compressImageForChat(
  file: File,
  maxBytes: number = MAX_PAYLOAD_BYTES
): Promise<CompressResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File bukan gambar. Pilih file JPG/PNG/GIF/WebP.');
  }

  const img = await loadImage(file);
  const originalBytes = file.size;

  let dataUrl = drawToDataUrl(img, MAX_DIMENSION, JPEG_QUALITY);

  // Jika masih terlalu besar, turunkan dimensi & kualitas secara bertahap
  const ladder: Array<[number, number]> = [
    [960, 0.7],
    [720, 0.6],
    [560, 0.5],
    [420, 0.45],
  ];
  for (const [side, q] of ladder) {
    if (estimatedBase64Bytes(dataUrl) <= maxBytes) break;
    dataUrl = drawToDataUrl(img, side, q);
  }

  const compressedBytes = estimatedBase64Bytes(dataUrl);
  if (compressedBytes > maxBytes) {
    throw new Error(
      `Foto terlalu besar bahkan setelah dikompres (${formatBytes(compressedBytes)}). ` +
        `Maksimal ${formatBytes(maxBytes)}.`
    );
  }

  return { dataUrl, originalBytes, compressedBytes };
}

/**
 * setItem localStorage yang tahan penuh (QuotaExceededError).
 * BUG FIX: sebelumnya simpan riwayat bisa crash diam-diam saat storage penuh
 * (foto base64 cepat menghabiskan kuota 5 MB). Versi ini membuang pesan
 * tertua (mempertahankan 200 terakhir) lalu mencoba lagi.
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    try {
      const msgs = JSON.parse(value);
      if (Array.isArray(msgs) && msgs.length > 200) {
        const trimmed = msgs.slice(-200);
        localStorage.setItem(key, JSON.stringify(trimmed));
        return true;
      }
    } catch {
      // bukan array pesan, lanjutkan ke kegagalan total
    }
    return false;
  }
}
