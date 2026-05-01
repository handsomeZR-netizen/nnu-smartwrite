import { z } from "zod";

const USERS_KEY = "nnu-smartwrite-users";
const SESSION_KEY = "nnu-smartwrite-session";
const SESSION_VERSION = "1.0";
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = "SHA-256";

export interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  studentId?: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: number;
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  studentId?: string;
}

interface UserStorage {
  users: StoredUser[];
  version: string;
}

interface SessionStorage {
  user: SessionUser;
  version: string;
  loggedInAt: number;
}

export const RegisterInputSchema = z.object({
  email: z.string().trim().email("请输入合法的邮箱地址"),
  displayName: z.string().trim().min(1, "请填写昵称").max(40, "昵称过长"),
  studentId: z
    .string()
    .trim()
    .regex(/^\d{8,12}$/u, "南师学号一般为 8–12 位数字")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, "密码至少 8 位")
    .max(64, "密码过长")
    .regex(/[A-Za-z]/u, "密码需包含字母")
    .regex(/\d/u, "密码需包含数字"),
});

export const LoginInputSchema = z.object({
  email: z.string().trim().email("请输入合法的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;

const isBrowser = (): boolean =>
  typeof window !== "undefined" && !!window.localStorage && !!window.crypto?.subtle;

const toBase64 = (bytes: ArrayBuffer): string => {
  const u8 = new Uint8Array(bytes);
  let str = "";
  for (let i = 0; i < u8.length; i++) str += String.fromCharCode(u8[i]);
  return btoa(str);
};

const randomSalt = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toBase64(bytes.buffer);
};

const hashPassword = async (password: string, saltB64: string): Promise<string> => {
  const enc = new TextEncoder();
  const saltBytes = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    256,
  );
  return toBase64(derived);
};

const generateId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const loadUsers = (): UserStorage => {
  if (!isBrowser()) return { users: [], version: SESSION_VERSION };
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return { users: [], version: SESSION_VERSION };
  try {
    const parsed = JSON.parse(raw) as UserStorage;
    if (!Array.isArray(parsed.users)) return { users: [], version: SESSION_VERSION };
    return parsed;
  } catch {
    return { users: [], version: SESSION_VERSION };
  }
};

const saveUsers = (storage: UserStorage): void => {
  if (!isBrowser()) return;
  localStorage.setItem(USERS_KEY, JSON.stringify(storage));
};

export const registerUser = async (input: RegisterInput): Promise<SessionUser> => {
  if (!isBrowser()) {
    throw new Error("注册需要浏览器环境");
  }
  const validated = RegisterInputSchema.parse(input);
  const storage = loadUsers();
  const emailLower = validated.email.toLowerCase();
  if (storage.users.some((u) => u.email.toLowerCase() === emailLower)) {
    throw new Error("该邮箱已注册");
  }
  const salt = randomSalt();
  const passwordHash = await hashPassword(validated.password, salt);
  const user: StoredUser = {
    id: generateId(),
    email: validated.email,
    displayName: validated.displayName,
    studentId: validated.studentId || undefined,
    passwordHash,
    passwordSalt: salt,
    createdAt: Date.now(),
  };
  storage.users.push(user);
  saveUsers(storage);
  const session: SessionUser = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    studentId: user.studentId,
  };
  setSession(session);
  return session;
};

export const loginUser = async (input: LoginInput): Promise<SessionUser> => {
  if (!isBrowser()) {
    throw new Error("登录需要浏览器环境");
  }
  const validated = LoginInputSchema.parse(input);
  const storage = loadUsers();
  const user = storage.users.find(
    (u) => u.email.toLowerCase() === validated.email.toLowerCase(),
  );
  if (!user) {
    throw new Error("账号或密码错误");
  }
  const candidate = await hashPassword(validated.password, user.passwordSalt);
  if (candidate !== user.passwordHash) {
    throw new Error("账号或密码错误");
  }
  const session: SessionUser = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    studentId: user.studentId,
  };
  setSession(session);
  return session;
};

export const logoutUser = (): void => {
  if (!isBrowser()) return;
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent("nnu-auth-change"));
};

const setSession = (user: SessionUser): void => {
  if (!isBrowser()) return;
  const payload: SessionStorage = {
    user,
    version: SESSION_VERSION,
    loggedInAt: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("nnu-auth-change"));
};

export const getCurrentUser = (): SessionUser | null => {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionStorage;
    if (parsed?.version !== SESSION_VERSION || !parsed.user) return null;
    return parsed.user;
  } catch {
    return null;
  }
};
