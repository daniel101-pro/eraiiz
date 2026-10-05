import axios from 'axios';
import { getIdentityFromAuthHeader } from '@/lib/sellerPayoutStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

function uniqueKeys(ids: Array<string | null | undefined>) {
  return [
    ...new Set(
      ids
        .map((id) => {
          const value = String(id || '').trim();
          if (!value) return '';
          return value.includes('@') ? value.toLowerCase() : value;
        })
        .filter(Boolean)
    ),
  ];
}

export function identityKeysFromAuth(authHeader?: string | null) {
  const identity = getIdentityFromAuthHeader(authHeader);
  return uniqueKeys([...identity.ids, identity.email]);
}

export async function expandIdentityKeys(
  authHeader: string,
  extra: Array<string | null | undefined> = []
) {
  const keys = uniqueKeys([...identityKeysFromAuth(authHeader), ...extra]);
  try {
    const response = await axios.get(`${API_URL}/api/users/me`, {
      headers: { Authorization: authHeader },
      timeout: 4000,
    });
    const user = response.data || {};
    return uniqueKeys([...keys, user._id, user.id, user.userId, user.email]);
  } catch {
    return keys;
  }
}
