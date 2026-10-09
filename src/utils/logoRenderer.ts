import { CompanySettings } from '../types';

/**
 * High-precision SVG Data URI of the "LG — LOGÍSTICA ADUANERA" corporate logo
 * matching the official brand mark:
 * - White background
 * - Bold "LG" with lime-to-forest green vertical gradient and dark green contour,
 *   plus charcoal grey lower-left base on the "L"
 * - Sweeping 3D metallic grey orbital swoosh wrapping around "LG"
 * - "LOGÍSTICA ADUANERA" in bold deep forest green at the bottom
 */
export const LG_CORPORATE_LOGO_SVG_STRING = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
  <defs>
    <linearGradient id="lgGreenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#8fd129" />
      <stop offset="45%" stop-color="#4ca634" />
      <stop offset="100%" stop-color="#08602c" />
    </linearGradient>
    <linearGradient id="lGreyBase" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#75787b" />
      <stop offset="50%" stop-color="#4a4d50" />
      <stop offset="100%" stop-color="#2c2e30" />
    </linearGradient>
    <linearGradient id="swooshGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3a3c3e" />
      <stop offset="45%" stop-color="#6d7073" />
      <stop offset="75%" stop-color="#3d3f42" />
      <stop offset="100%" stop-color="#26282a" />
    </linearGradient>
    <linearGradient id="swooshHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#9ca0a4" stop-opacity="0.65" />
      <stop offset="50%" stop-color="#b5b9bd" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#5a5d60" stop-opacity="0.3" />
    </linearGradient>
  </defs>

  <!-- Clean white background -->
  <rect width="640" height="360" fill="#ffffff" />

  <!-- Upper-left part of "L" (Green gradient with dark green outline) -->
  <path d="M 170 58 H 220 V 185 L 170 154 Z" fill="url(#lgGreenGrad)" stroke="#085c29" stroke-width="4" stroke-linejoin="miter" />

  <!-- Lower-right horizontal foot tip of "L" (Green) -->
  <path d="M 255 202 H 302 V 225 L 255 202 Z" fill="#136f34" stroke="#085c29" stroke-width="3.5" />

  <!-- Lower-left corner base of "L" (Charcoal metallic grey below the swoosh) -->
  <path d="M 170 175 L 265 227 L 285 240 H 170 Z" fill="url(#lGreyBase)" stroke="#6c6f72" stroke-width="2.5" />

  <!-- Bold "G" (Green gradient with dark green outline) -->
  <path d="M 480 98
           C 456 68, 424 55, 386 55
           C 326 55, 286 98, 286 154
           C 286 206, 324 246, 386 246
           C 425 246, 458 235, 480 218
           V 142
           H 402
           V 174
           H 440
           V 202
           C 426 210, 408 214, 388 214
           C 348 214, 326 188, 326 153
           C 326 116, 350 88, 388 88
           C 415 88, 436 98, 452 118
           Z"
        fill="url(#lgGreenGrad)"
        stroke="#085c29"
        stroke-width="4"
        stroke-linejoin="round" />

  <!-- White separation gap around the orbital swoosh -->
  <path d="M 198 48
           C 100 62, 84 148, 206 208
           C 324 265, 476 286, 518 228
           C 542 195, 518 158, 486 135
           C 536 165, 558 218, 522 254
           C 476 298, 316 272, 192 206
           C 72 142, 86 54, 198 48 Z"
        fill="#ffffff" />

  <!-- 3D Grey Orbital Swoosh -->
  <path d="M 200 50
           C 110 64, 96 142, 212 200
           C 332 258, 474 276, 514 222
           C 534 195, 516 162, 488 140
           C 532 168, 548 216, 516 248
           C 472 290, 318 266, 196 202
           C 82 142, 94 58, 200 50 Z"
        fill="url(#swooshGrad)" />

  <!-- Inner bevel highlight on the orbital swoosh -->
  <path d="M 140 120
           C 155 154, 200 184, 270 214
           C 355 250, 448 262, 495 242"
        fill="none"
        stroke="url(#swooshHighlight)"
        stroke-width="5"
        stroke-linecap="round" />

  <!-- Bottom Corporate Typography: LOGÍSTICA ADUANERA -->
  <text x="320" y="324"
        font-family="'Plus Jakarta Sans', 'Arial Black', Arial, sans-serif"
        font-size="40"
        font-weight="800"
         letter-spacing="1.5"
        fill="#065a2b"
        text-anchor="middle">LOGÍSTICA ADUANERA</text>
</svg>`;

export const DEFAULT_CORPORATE_LOGO_DATA_URI =
  'data:image/svg+xml;utf8,' + encodeURIComponent(LG_CORPORATE_LOGO_SVG_STRING);

/**
 * Generates a high-resolution PNG Data URL (640x360) for the LG Logística Aduanera logo.
 * Because it renders directly onto an HTML5 Canvas and outputs a standard PNG Data URI,
 * it embeds 100% natively in jsPDF.addImage(), standalone HTML, and browser print.
 */
export function renderCorporateLogoPngDataUrl(
  logoText = 'LG',
  companyName = 'LG ESTUDIO ADUANERO & LOGÍSTICA S.A.'
): string {
  if (typeof document === 'undefined') return DEFAULT_CORPORATE_LOGO_DATA_URI;
  const canvas = document.createElement('canvas');
  const width = 640;
  const height = 360;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return DEFAULT_CORPORATE_LOGO_DATA_URI;

  // Clean White Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const isDefaultLg =
    (logoText || '').trim().toUpperCase() === 'LG' ||
    companyName.toUpperCase().includes('LG ');

  if (isDefaultLg) {
    // Vertical Green Gradient for "LG"
    const greenGrad = ctx.createLinearGradient(0, 55, 0, 245);
    greenGrad.addColorStop(0, '#8fd129');
    greenGrad.addColorStop(0.45, '#4ca634');
    greenGrad.addColorStop(1, '#08602c');

    // 1. Upper-left stem of "L"
    ctx.fillStyle = greenGrad;
    ctx.strokeStyle = '#085c29';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(170, 58);
    ctx.lineTo(220, 58);
    ctx.lineTo(220, 185);
    ctx.lineTo(170, 154);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Foot tip of "L"
    ctx.fillStyle = '#136f34';
    ctx.beginPath();
    ctx.moveTo(255, 202);
    ctx.lineTo(302, 202);
    ctx.lineTo(302, 225);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Lower-left charcoal grey base of "L"
    const greyBase = ctx.createLinearGradient(170, 175, 285, 240);
    greyBase.addColorStop(0, '#75787b');
    greyBase.addColorStop(0.5, '#4a4d50');
    greyBase.addColorStop(1, '#2c2e30');
    ctx.fillStyle = greyBase;
    ctx.strokeStyle = '#6c6f72';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(170, 175);
    ctx.lineTo(265, 227);
    ctx.lineTo(285, 240);
    ctx.lineTo(170, 240);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Letter "G"
    ctx.fillStyle = greenGrad;
    ctx.strokeStyle = '#085c29';
    ctx.lineWidth = 4;
    const gPath = new Path2D(
      'M 480 98 C 456 68, 424 55, 386 55 C 326 55, 286 98, 286 154 C 286 206, 324 246, 386 246 C 425 246, 458 235, 480 218 V 142 H 402 V 174 H 440 V 202 C 426 210, 408 214, 388 214 C 348 214, 326 188, 326 153 C 326 116, 350 88, 388 88 C 415 88, 436 98, 452 118 Z'
    );
    ctx.fill(gPath);
    ctx.stroke(gPath);

    // 5. White halo gap around the swoosh
    ctx.fillStyle = '#ffffff';
    const gapPath = new Path2D(
      'M 198 48 C 100 62, 84 148, 206 208 C 324 265, 476 286, 518 228 C 542 195, 518 158, 486 135 C 536 165, 558 218, 522 254 C 476 298, 316 272, 192 206 C 72 142, 86 54, 198 48 Z'
    );
    ctx.fill(gapPath);

    // 6. 3D Grey Orbital Swoosh
    const swooshGrad = ctx.createLinearGradient(90, 60, 540, 270);
    swooshGrad.addColorStop(0, '#3a3c3e');
    swooshGrad.addColorStop(0.45, '#6d7073');
    swooshGrad.addColorStop(0.75, '#3d3f42');
    swooshGrad.addColorStop(1, '#26282a');
    ctx.fillStyle = swooshGrad;
    const swooshPath = new Path2D(
      'M 200 50 C 110 64, 96 142, 212 200 C 332 258, 474 276, 514 222 C 534 195, 516 162, 488 140 C 532 168, 548 216, 516 248 C 472 290, 318 266, 196 202 C 82 142, 94 58, 200 50 Z'
    );
    ctx.fill(swooshPath);

    // 7. Bottom Text: LOGÍSTICA ADUANERA
    ctx.fillStyle = '#065a2b';
    ctx.font = '800 39px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('LOGÍSTICA ADUANERA', width / 2, 326);
  } else {
    // Fallback custom monogram on clean light card
    ctx.strokeStyle = '#08602c';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    ctx.fillStyle = '#08602c';
    ctx.font = '800 130px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((logoText || 'LG').slice(0, 4).toUpperCase(), width / 2, 155);

    ctx.fillStyle = '#1e293b';
    ctx.font = '700 32px sans-serif';
    ctx.fillText('LOGÍSTICA ADUANERA', width / 2, 295);
  }

  return canvas.toDataURL('image/png');
}
