import axios from 'axios';

function isTokenExpiringSoon(token, skewMs = 60_000) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload?.exp) return false;
    return Date.now() >= payload.exp * 1000 - skewMs;
  } catch {
    return false;
  }
}

export const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(
      process.env.NEXT_PUBLIC_API_URL + '/api/auth/refresh',
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const { accessToken, refreshToken: nextRefresh } = response.data;
    localStorage.setItem('accessToken', accessToken);
    if (nextRefresh) {
      localStorage.setItem('refreshToken', nextRefresh);
    }
    return accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error.response?.data || error.message);
    throw error;
  }
};

export async function getValidAccessToken() {
  const token = localStorage.getItem('accessToken');
  if (!token || isTokenExpiringSoon(token)) {
    return refreshAccessToken();
  }
  return token;
}

// Function to decode JWT token and extract user ID
export function decodeToken(token) {
  try {
    // JWT tokens are in format: header.payload.signature
    const payload = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));
    return decodedPayload.id || decodedPayload.userId;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}