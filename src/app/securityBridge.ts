const mobilePasswordKey = 'personal-workspace-password-v1';
const iterations = 210000;

type PasswordRecord = {salt: number[]; hash: number[]};

function readRecord(): PasswordRecord | null {
  const raw = localStorage.getItem(mobilePasswordKey);
  if (!raw) return null;
  const record = JSON.parse(raw) as PasswordRecord;
  if (!Array.isArray(record.salt) || !Array.isArray(record.hash)) throw new Error('Invalid password record');
  return record;
}

async function hashPassword(password: string, salt: Uint8Array): Promise<number[]> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256'}, key, 256);
  return Array.from(new Uint8Array(bits));
}

async function verifyLocal(password: string): Promise<boolean> {
  const record = readRecord();
  if (!record) return false;
  const actual = await hashPassword(password, new Uint8Array(record.salt));
  return actual.length === record.hash.length && actual.reduce((difference, byte, index) => difference | (byte ^ record.hash[index]), 0) === 0;
}

export const securityBridge = {
  hasPassword: async () => window.workspace ? window.workspace.hasPassword() : readRecord() !== null,
  verifyPassword: async (password: string) => window.workspace ? window.workspace.verifyPassword(password) : verifyLocal(password),
  setPassword: async (password: string, current?: string) => {
    if (window.workspace) return window.workspace.setPassword(password, current);
    if (password.length < 8 || (readRecord() && (!current || !await verifyLocal(current)))) return false;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await hashPassword(password, salt);
    localStorage.setItem(mobilePasswordKey, JSON.stringify({salt: Array.from(salt), hash}));
    return true;
  },
  removePassword: async (current: string) => {
    if (window.workspace) return window.workspace.removePassword(current);
    if (!await verifyLocal(current)) return false;
    localStorage.removeItem(mobilePasswordKey);
    return true;
  },
  resetAll: async () => window.workspace ? window.workspace.resetAll() : true
};
