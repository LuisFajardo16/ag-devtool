import { StorageService, STORAGE_KEYS } from './storage.js';
import { events } from './events.js';

/**
 * Autenticación de Administrador usando Web Crypto API (SHA-256 + Salt)
 *
 * Credenciales configuradas:
 * - Usuario: admin
 * - Contraseña: admin123**
 * - Payload hasheado: "ag_devtool_salt_v1:admin:admin123**"
 */
const AUTH_SALT = 'ag_devtool_salt_v1';
const ADMIN_USERNAME = 'admin';
const ADMIN_EXPECTED_SHA256 = '172ad48bb1c217f036346abe12063ca59d3ff55b6b9dd7668058a0632af610dd';

/**
 * Calcula el hash SHA-256 en formato hexadecimal usando Web Crypto API
 * @param {string} message
 * @returns {Promise<string>}
 */
async function sha256Hex(message) {
  if (window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback puro JS de SHA-256 en caso de abrir el archivo en un contexto sin crypto.subtle
  return fallbackSha256(message);
}

/**
 * Implementación compacta de SHA-256 en JS puro por si el navegador corre en contexto no seguro
 */
function fallbackSha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';
  const words = [];
  const asciiBitLength = ascii.length * 8;
  let hash = [];
  const k = [];
  let primeCounter = 0;
  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;
  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];
      const a = hash[0],
        e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? 0 : '') + b.toString(16);
    }
  }
  return result;
}

export const AuthService = {
  isAdmin() {
    const session = StorageService.get(STORAGE_KEYS.ADMIN_SESSION, null);
    return Boolean(session && session.authenticated === true && session.username === ADMIN_USERNAME);
  },

  getSession() {
    return StorageService.get(STORAGE_KEYS.ADMIN_SESSION, null);
  },

  async login(username, password) {
    const cleanUser = (username || '').trim();
    const payload = `${AUTH_SALT}:${cleanUser}:${password || ''}`;
    const computedHash = await sha256Hex(payload);

    if (cleanUser === ADMIN_USERNAME && computedHash === ADMIN_EXPECTED_SHA256) {
      const sessionData = {
        authenticated: true,
        username: ADMIN_USERNAME,
        loginAt: new Date().toISOString(),
        method: 'SHA-256 (Web Crypto API)'
      };
      StorageService.set(STORAGE_KEYS.ADMIN_SESSION, sessionData);
      events.emit('auth:changed', { isAdmin: true, session: sessionData });
      return { ok: true, session: sessionData };
    }

    return {
      ok: false,
      error: 'Credenciales inválidas. Verifica el usuario y contraseña de administrador.'
    };
  },

  logout() {
    StorageService.remove(STORAGE_KEYS.ADMIN_SESSION);
    events.emit('auth:changed', { isAdmin: false, session: null });
  }
};
