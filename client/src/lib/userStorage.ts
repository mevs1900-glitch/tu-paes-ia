/**
 * Almacenamiento local de usuarios con contraseñas hasheadas.
 *
 * NOTA IMPORTANTE: Este es un sistema de auth local (localStorage) para la maqueta.
 * En producción se reemplaza por Firebase Auth / Supabase / un backend real.
 * El hash + salt aquí impide que las contraseñas queden en texto plano,
 * pero NO sustituye una solución de auth real (las contraseñas siguen viviendo
 * en el navegador del usuario, no hay protección contra acceso al dispositivo).
 */

export interface StoredUser {
  email: string;
  /** Hash SHA-256 de password+salt en hex */
  passwordHash: string;
  /** Salt aleatorio único por usuario, en hex */
  salt: string;
  createdAt: string;
}

/** Representación pública del usuario sin datos sensibles. */
export interface PublicUser {
  email: string;
  createdAt: string;
}

const USERS_KEY = "tu_paes_ia_users";
const CURRENT_USER_KEY = "tu_paes_ia_current_user";

// ---------- utilidades de cripto -----------------------------------------

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return bytesToHex(arr);
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(password + ":" + salt);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(buf));
}

// ---------- acceso al storage --------------------------------------------

function getAllUsers(): StoredUser[] {
  try {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  } catch {
    return [];
  }
}

function saveAllUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function findUserByEmail(email: string): StoredUser | null {
  const users = getAllUsers();
  return (
    users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
  );
}

function toPublic(user: StoredUser): PublicUser {
  return { email: user.email, createdAt: user.createdAt };
}

// ---------- API pública ---------------------------------------------------

export async function registerUser(
  email: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  if (!email || email.trim() === "") {
    return { success: false, message: "El email es requerido" };
  }
  if (!password || password.length < 6) {
    return {
      success: false,
      message: "La contraseña debe tener al menos 6 caracteres",
    };
  }
  if (findUserByEmail(email)) {
    return { success: false, message: "Este correo ya está registrado" };
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);

  const newUser: StoredUser = {
    email: email.toLowerCase(),
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };

  const users = getAllUsers();
  users.push(newUser);
  saveAllUsers(users);

  return { success: true, message: "Cuenta creada correctamente" };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  if (!email || email.trim() === "") {
    return { success: false, message: "El email es requerido" };
  }
  if (!password || password.length < 6) {
    return {
      success: false,
      message: "La contraseña debe tener al menos 6 caracteres",
    };
  }

  const user = findUserByEmail(email);
  if (!user) {
    return { success: false, message: "El correo no está registrado" };
  }

  const computedHash = await hashPassword(password, user.salt);
  if (user.passwordHash !== computedHash) {
    return { success: false, message: "Contraseña incorrecta" };
  }

  // Solo guardamos datos públicos del usuario en la sesión.
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(toPublic(user)));
  return { success: true, message: "Sesión iniciada correctamente" };
}

export function getCurrentUser(): PublicUser | null {
  try {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function logoutUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

/**
 * Sesión "Guest" para login con Google falso o entrada rápida.
 * No persiste en USERS_KEY, solo en CURRENT_USER_KEY.
 */
export function loginAsGuest(label = "Invitado"): PublicUser {
  const guest: PublicUser = {
    email: `${label}@guest`,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(guest));
  return guest;
}
