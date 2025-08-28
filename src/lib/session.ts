
'use server';

import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function createSession(user: { userId: string }) {
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
  const session = await encrypt({ user, expiresAt });

  const cookieStore = cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: true,
    // By omitting 'expires', this becomes a session cookie that
    // is deleted when the browser is closed.
    sameSite: 'lax',
    path: '/',
  });
}

export async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h') // Token expires in 12 hours
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    // This is an expected error when the user is not logged in.
    // We don't want to log it to the console.
    return null;
  }
}

export async function getSession() {
  const cookie = (await cookies()).get('session')?.value;
  const session = await decrypt(cookie);
  return session;
}
