const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }

  return res.json();
}

// ─── Auth ────────────────────────────────────
export const authApi = {
  requestOtp: (phone: string, channel: 'whatsapp' | 'sms' = 'whatsapp') =>
    fetchApi<{ message: string; userId: string }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone, channel }),
    }),

  verifyOtp: (phone: string, code: string) =>
    fetchApi<{ token: string; user: import('../types').User }>(
      '/auth/otp/verify',
      {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      },
    ),
};

// ─── Community Wall ──────────────────────────
export const communityApi = {
  getFeed: (nodeId: string, filters: import('../types').FeedFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.tags?.length) params.set('tags', filters.tags.join(','));
    if (filters.search) params.set('search', filters.search);
    if (filters.latitude) params.set('lat', String(filters.latitude));
    if (filters.longitude) params.set('lng', String(filters.longitude));
    if (filters.radiusKm) params.set('radius', String(filters.radiusKm));
    if (filters.page) params.set('page', String(filters.page));

    const qs = params.toString();
    return fetchApi<import('../types').PaginatedResponse<import('../types').Post>>(
      `/community/feed/${nodeId}${qs ? `?${qs}` : ''}`,
    );
  },

  getPost: (id: string) =>
    fetchApi<import('../types').Post>(`/community/posts/${id}`),

  createPost: (data: {
    nodeId: string;
    category: string;
    title: string;
    body: string;
    tags?: string[];
  }) =>
    fetchApi<import('../types').Post>('/community/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  applyToJob: (postId: string, message?: string) =>
    fetchApi(`/community/posts/${postId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};

// ─── Payments ────────────────────────────────
export const paymentsApi = {
  createTransaction: (data: {
    serviceId: string;
    providerId: string;
    totalAmount: number;
  }) =>
    fetchApi<{ transaction: import('../types').Transaction; clientSecret: string }>(
      '/payments/transactions',
      { method: 'POST', body: JSON.stringify(data) },
    ),

  generateQr: (transactionId: string, lat: number, lng: number) =>
    fetchApi<{ qrImage: string; transactionId: string; amount: number; signature: string }>(
      '/payments/qr/generate',
      {
        method: 'POST',
        body: JSON.stringify({
          transactionId,
          providerLat: lat,
          providerLng: lng,
        }),
      },
    ),

  /** Escanear QR: envía datos parseados del QR + GPS del cliente */
  scanQr: (transactionId: string, amount: number, signature: string, lat: number, lng: number) =>
    fetchApi<{ transaction: import('../types').Transaction; fundsReleased: number }>(
      '/payments/qr/scan',
      {
        method: 'POST',
        body: JSON.stringify({
          transactionId,
          amount,
          signature,
          clientLat: lat,
          clientLng: lng,
        }),
      },
    ),

  getTransactions: (role: 'client' | 'provider' = 'client') =>
    fetchApi<import('../types').Transaction[]>(
      `/payments/transactions?role=${role}`,
    ),
};

// ─── Tournaments ─────────────────────────────
export const tournamentsApi = {
  getByNode: (nodeId: string) =>
    fetchApi(`/tournaments/node/${nodeId}`),

  register: (tournamentId: string) =>
    fetchApi(`/tournaments/${tournamentId}/register`, { method: 'POST' }),

  getLeaderboard: (type: string) =>
    fetchApi<import('../types').EloScore[]>(`/tournaments/leaderboard/${type}`),
};
