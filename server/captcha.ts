/**
 * Gerador de CAPTCHA para autenticação segura
 */

// Caracteres permitidos no CAPTCHA (evita confusão entre 0/O, 1/I/l)
const CAPTCHA_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CAPTCHA_LENGTH = 6;

/**
 * Gera um código CAPTCHA aleatório
 */
export function generateCaptchaCode(): string {
  let code = "";
  for (let i = 0; i < CAPTCHA_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * CAPTCHA_CHARS.length);
    code += CAPTCHA_CHARS[randomIndex];
  }
  return code;
}

/**
 * Gera uma imagem CAPTCHA em formato SVG
 */
export function generateCaptchaSvg(code: string): string {
  const width = 200;
  const height = 60;
  const fontSize = 32;
  
  // Cores de fundo e texto
  const bgColor = "#7c3aed"; // Roxo similar ao da imagem
  const textColor = "#ffffff";
  
  // Gera linhas de ruído
  let noiseLines = "";
  for (let i = 0; i < 3; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    noiseLines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>`;
  }
  
  // Gera pontos de ruído
  let noiseDots = "";
  for (let i = 0; i < 20; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    const r = 1 + Math.random() * 2;
    noiseDots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(255,255,255,0.4)"/>`;
  }
  
  // Gera texto com distorção
  let textElements = "";
  const spacing = width / (code.length + 1);
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const x = spacing * (i + 1);
    const y = height / 2 + fontSize / 3;
    const rotation = -15 + Math.random() * 30; // Rotação aleatória
    const skewX = -5 + Math.random() * 10; // Inclinação aleatória
    
    textElements += `
      <text 
        x="${x}" 
        y="${y}" 
        font-size="${fontSize}" 
        font-family="Arial, sans-serif" 
        font-weight="bold"
        fill="${textColor}"
        text-anchor="middle"
        transform="rotate(${rotation} ${x} ${y}) skewX(${skewX})"
      >${char}</text>
    `;
  }
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${bgColor}" rx="8"/>
      ${noiseLines}
      ${noiseDots}
      ${textElements}
    </svg>
  `.trim();
}

/**
 * Valida se o código digitado corresponde ao CAPTCHA gerado
 * (case-insensitive)
 */
export function validateCaptcha(userInput: string, correctCode: string): boolean {
  return userInput.toUpperCase() === correctCode.toUpperCase();
}

/**
 * Armazena CAPTCHAs em memória com expiração
 * Em produção, usar Redis ou similar
 */
const captchaStore = new Map<string, { code: string; expiresAt: number }>();

// Limpa CAPTCHAs expirados a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(captchaStore.entries());
  for (const [sessionId, data] of entries) {
    if (data.expiresAt < now) {
      captchaStore.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

/**
 * Armazena um CAPTCHA para uma sessão específica
 * Expira em 5 minutos
 */
export function storeCaptcha(sessionId: string, code: string): void {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos
  captchaStore.set(sessionId, { code, expiresAt });
}

/**
 * Recupera e remove um CAPTCHA armazenado
 */
export function retrieveCaptcha(sessionId: string): string | null {
  const data = captchaStore.get(sessionId);
  if (!data) return null;
  
  if (data.expiresAt < Date.now()) {
    captchaStore.delete(sessionId);
    return null;
  }
  
  // Remove após recuperar (uso único)
  captchaStore.delete(sessionId);
  return data.code;
}
