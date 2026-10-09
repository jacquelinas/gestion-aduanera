import { CompanySettings } from '../types';

/**
 * Generates a high-resolution PNG Data URL (320x320) for the corporate logo.
 * If the user uploaded/configured a custom image, it draws that image onto the canvas;
 * otherwise, it renders a crisp maritime/customs shield emblem with the company monogram.
 * Because it returns a standard PNG data URI, it works 100% reliably in HTML, Print, and jsPDF.addImage().
 */
export function renderCorporateLogoPngDataUrl(
  logoText = 'MC',
  companyName = 'MERIDIAN ADUANAS'
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  const size = 320;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background rounded square (Deep Corporate Navy #0f172a)
  const r = 48;
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Subtle inner border frame (Sky Blue #38bdf8)
  const inset = 18;
  const ir = 34;
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(inset + ir, inset);
  ctx.lineTo(size - inset - ir, inset);
  ctx.quadraticCurveTo(size - inset, inset, size - inset, inset + ir);
  ctx.lineTo(size - inset, size - inset - ir);
  ctx.quadraticCurveTo(
    size - inset,
    size - inset,
    size - inset - ir,
    size - inset
  );
  ctx.lineTo(inset + ir, size - inset);
  ctx.quadraticCurveTo(inset, size - inset, inset, size - inset - ir);
  ctx.lineTo(inset, inset + ir);
  ctx.quadraticCurveTo(inset, inset, inset + ir, inset);
  ctx.closePath();
  ctx.stroke();

  // Top decorative compass/globe arc
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2 - 10, 96, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  // Monogram Text (e.g. "MC")
  const cleanMonogram = (logoText || 'MC').slice(0, 4).toUpperCase();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 116px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cleanMonogram, size / 2, size / 2 - 12);

  // Horizontal accent bar
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(72, 224);
  ctx.lineTo(size - 72, 224);
  ctx.stroke();

  // Bottom sub-label ("ADUANAS & LOGÍSTICA")
  const shortLabel = companyName.toUpperCase().includes('ADUANA')
    ? 'ADUANAS & LOGÍSTICA'
    : 'COMERCIO EXTERIOR';
  ctx.fillStyle = '#bae6fd';
  ctx.font = 'bold 21px sans-serif';
  ctx.fillText(shortLabel, size / 2, 258);

  return canvas.toDataURL('image/png');
}

/**
 * Converts any image URL or Data URI into a PNG Data URL suitable for jsPDF.addImage().
 * Falls back to the generated corporate emblem if loading fails.
 */
export async function resolveLogoPngForPdf(
  company: CompanySettings
): Promise<string> {
  if (
    company.logoUrl &&
    company.logoUrl.startsWith('data:image/png;base64,')
  ) {
    return company.logoUrl;
  }

  if (company.logoUrl && company.logoUrl.trim() !== '') {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 320;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No canvas context'));
            return;
          }
          // Draw scaled inside square
          const ratio = Math.min(320 / img.width, 320 / img.height);
          const w = img.width * ratio;
          const h = img.height * ratio;
          ctx.drawImage(img, (320 - w) / 2, (320 - h) / 2, w, h);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('Image load error'));
        img.src = company.logoUrl!;
      });
      return dataUrl;
    } catch {
      // Fallback to crisp generated PNG emblem
    }
  }

  return renderCorporateLogoPngDataUrl(company.logoText, company.name);
}
