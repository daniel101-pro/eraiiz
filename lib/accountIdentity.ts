import { getIdentityFromAuthHeader } from '@/lib/sellerPayoutStore';

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

export async function identityKeysFromAuth(authHeader?: string | null) {
  const identity = await getIdentityFromAuthHeader(authHeader);
  return uniqueKeys([...identity.ids, identity.email]);
}

export async function expandIdentityKeys(
  authHeader: string,
  extra: Array<string | null | undefined> = []
) {
  const keys = await identityKeysFromAuth(authHeader);
  if (keys.length === 0) return [];
  return uniqueKeys([...keys, ...extra]);
}
