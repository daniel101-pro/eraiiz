import { headers } from 'next/headers';

export async function getSession() {
  try {
    const cookieHeader = headers().get('cookie') || '';
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/session`, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!res.ok) {
      console.error('Session request failed:', res.status, await res.text());
      return null;
    }

    const session = await res.json();
    return session;
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
}