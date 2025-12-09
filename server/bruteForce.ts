// Sistema de proteção contra brute force
// Rastreia tentativas de login por IP e email

interface LoginAttempt {
  count: number;
  firstAttempt: number;
  blockedUntil: number | null;
}

// Armazena tentativas em memória (em produção, usar Redis ou banco de dados)
const loginAttempts = new Map<string, LoginAttempt>();

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutos
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos

// Limpar registros expirados a cada 10 minutos
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(loginAttempts.entries());
  for (const [key, attempt] of entries) {
    // Remover se o bloqueio expirou e passou mais de 15 minutos da primeira tentativa
    if (
      attempt.blockedUntil &&
      attempt.blockedUntil < now &&
      now - attempt.firstAttempt > ATTEMPT_WINDOW_MS
    ) {
      loginAttempts.delete(key);
    }
  }
}, 10 * 60 * 1000);

// Verificar se IP/email está bloqueado
export function isBlocked(identifier: string): { blocked: boolean; remainingTime?: number } {
  const attempt = loginAttempts.get(identifier);
  if (!attempt || !attempt.blockedUntil) {
    return { blocked: false };
  }

  const now = Date.now();
  if (attempt.blockedUntil > now) {
    const remainingTime = Math.ceil((attempt.blockedUntil - now) / 1000); // segundos
    return { blocked: true, remainingTime };
  }

  // Bloqueio expirou, resetar
  loginAttempts.delete(identifier);
  return { blocked: false };
}

// Registrar tentativa de login falhada
export function recordFailedAttempt(identifier: string): {
  blocked: boolean;
  remainingAttempts: number;
  blockedUntil?: number;
} {
  const now = Date.now();
  let attempt = loginAttempts.get(identifier);

  if (!attempt) {
    // Primeira tentativa
    attempt = {
      count: 1,
      firstAttempt: now,
      blockedUntil: null,
    };
    loginAttempts.set(identifier, attempt);
    return { blocked: false, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  // Verificar se está dentro da janela de tempo
  if (now - attempt.firstAttempt > ATTEMPT_WINDOW_MS) {
    // Resetar contador se passou da janela
    attempt.count = 1;
    attempt.firstAttempt = now;
    attempt.blockedUntil = null;
    return { blocked: false, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  // Incrementar contador
  attempt.count++;

  if (attempt.count >= MAX_ATTEMPTS) {
    // Bloquear
    attempt.blockedUntil = now + BLOCK_DURATION_MS;
    return {
      blocked: true,
      remainingAttempts: 0,
      blockedUntil: attempt.blockedUntil,
    };
  }

  return {
    blocked: false,
    remainingAttempts: MAX_ATTEMPTS - attempt.count,
  };
}

// Resetar tentativas após login bem-sucedido
export function resetAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}

// Obter estatísticas de tentativas (para admin)
export function getAttemptStats(): {
  totalBlocked: number;
  totalAttempts: number;
  blockedIdentifiers: Array<{ identifier: string; blockedUntil: number }>;
} {
  const now = Date.now();
  let totalBlocked = 0;
  let totalAttempts = 0;
  const blockedIdentifiers: Array<{ identifier: string; blockedUntil: number }> = [];

  const entries = Array.from(loginAttempts.entries());
  for (const [identifier, attempt] of entries) {
    totalAttempts += attempt.count;
    if (attempt.blockedUntil && attempt.blockedUntil > now) {
      totalBlocked++;
      blockedIdentifiers.push({
        identifier,
        blockedUntil: attempt.blockedUntil,
      });
    }
  }

  return { totalBlocked, totalAttempts, blockedIdentifiers };
}
