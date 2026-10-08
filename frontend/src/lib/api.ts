/**
 * NyayaSetu API Client
 * Wraps fetch with base URL, auth token injection, and error normalization.
 */

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://nyayasetu-rbn8.onrender.com').replace(/\/+$/, '');
const BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  return localStorage.getItem('nyayasetu_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  requireAuth = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = json?.error?.message || json?.message || 'An unexpected error occurred';
    throw new ApiError(res.status, message, json?.error?.details);
  }

  return json.data as T;
}

// ── Auth Endpoints ────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'CITIZEN' | 'LAWYER' | 'ADMIN';
  preferredLanguage: string;
  avatarUrl: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authApi = {
  registerCitizen: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    preferredLanguage?: string;
  }) => request<AuthResponse>('POST', '/auth/register/citizen', data, false),

  registerLawyer: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    preferredLanguage?: string;
    barCouncilNumber: string;
    bio?: string;
    specialization?: string[];
    experienceYears?: number;
    city: string;
    state: string;
    languagesSpoken?: string[];
  }) => request<AuthResponse>('POST', '/auth/register/lawyer', data, false),

  login: (email: string, password: string) =>
    request<AuthResponse>('POST', '/auth/login', { email, password }, false),

  logout: () => request<{ message: string }>('POST', '/auth/logout'),

  getProfile: () => request<Omit<AuthUser, never>>('GET', '/auth/profile'),
};

// ── Health ────────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => request<{ status: string; db?: any }>('GET', '/health', undefined, false),
};

// ── Document API ──────────────────────────────────────────────────────────────
export const documentApi = {
  upload: async (caseId: string, file: File): Promise<{
    id: string;
    caseId: string;
    originalName: string;
    mimeType: string;
    fileSizeBytes: number;
    processingStatus: string;
    createdAt: string;
  }> => {
    const formData = new FormData();
    formData.append('caseId', caseId);
    formData.append('file', file);

    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.error?.message || json?.message || 'Failed to upload document';
      throw new ApiError(res.status, msg, json?.error?.details);
    }
    return json.data;
  },

  getStatus: (documentId: string, lang?: string) =>
    request<{
      id: string;
      caseId: string;
      originalName: string;
      mimeType: string;
      fileSizeBytes: number;
      processingStatus: string;
      detectedLanguage?: string;
      hasExtractedText: boolean;
      createdAt: string;
      analysis?: any;
    }>('GET', `/documents/${documentId}/status${lang ? `?lang=${encodeURIComponent(lang)}` : ''}`),

  getById: (documentId: string, lang?: string) =>
    request<{
      id: string;
      caseId: string;
      originalName: string;
      mimeType: string;
      fileSizeBytes: number;
      detectedLanguage?: string;
      processingStatus: string;
      extractedText?: string;
      createdAt: string;
      analysis?: any;
    }>('GET', `/documents/${documentId}${lang ? `?lang=${encodeURIComponent(lang)}` : ''}`),

  listByCase: (caseId: string) =>
    request<any[]>('GET', `/documents/case/${caseId}`),

  download: async (documentId: string, filename: string): Promise<void> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/documents/${documentId}/download`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      throw new Error(`Failed to download document: HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// ── Language API Endpoints ────────────────────────────────────────────────────

export const languageApi = {
  getLanguages: () =>
    request<Array<{ code: string; name: string; nativeName: string }>>(
      'GET',
      '/languages',
      undefined,
      false
    ),

  translate: (text: string, targetLanguage: string, sourceLanguage?: string) =>
    request<{
      translatedText: string;
      sourceLanguage: string;
      targetLanguage: string;
      provider: string;
      cached: boolean;
    }>('POST', '/language/translate', { text, targetLanguage, sourceLanguage }, false),

  detect: (text: string) =>
    request<{
      language: string;
      confidence: number;
      isSupported: boolean;
    }>('POST', '/language/detect', { text }, false),
};

// ── User API Endpoints ────────────────────────────────────────────────────────

export const userApi = {
  updateLanguage: (language: string) =>
    request<{ id: string; email: string; preferred_language: string }>(
      'PATCH',
      '/users/me/language',
      { language },
      true
    ),
};

// ── Case API Endpoints ────────────────────────────────────────────────────────
export const caseApi = {
  getById: (id: string) =>
    request<any>('GET', `/cases/${id}`),

  list: (params?: { citizenId?: string; lawyerId?: string; status?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.citizenId) q.append('citizenId', params.citizenId);
    if (params?.lawyerId) q.append('lawyerId', params.lawyerId);
    if (params?.status) q.append('status', params.status);
    if (params?.limit) q.append('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<any[]>('GET', `/cases${qs}`);
  },

  create: (data: {
    citizenId: string;
    title: string;
    description: string;
    category: string;
    urgency?: string;
    jurisdiction?: string;
  }) => request<any>('POST', '/cases', data),

  updateStatus: (id: string, status: string) =>
    request<any>('PATCH', `/cases/${id}/status`, { status }),
};

// ── Lawyer API Endpoints ──────────────────────────────────────────────────────
export const lawyerApi = {
  list: (filters?: {
    city?: string;
    state?: string;
    specialization?: string;
    language?: string;
    status?: string;
    isAvailable?: boolean;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (filters?.city) q.append('city', filters.city);
    if (filters?.state) q.append('state', filters.state);
    if (filters?.specialization) q.append('specialization', filters.specialization);
    if (filters?.language) q.append('language', filters.language);
    if (filters?.status) q.append('status', filters.status);
    if (filters?.isAvailable !== undefined) q.append('isAvailable', String(filters.isAvailable));
    if (filters?.limit) q.append('limit', String(filters.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<any[]>('GET', `/lawyers${qs}`);
  },

  getById: (id: string) =>
    request<any>('GET', `/lawyers/${id}`),
};

// ── Case Assistance Requests API Endpoints ────────────────────────────────────
export const assistanceRequestApi = {
  create: (
    caseId: string,
    data: { lawyerId?: string | null; requestType?: string; message?: string }
  ) => request<any>('POST', `/cases/${caseId}/assistance-requests`, data),

  listByCase: (caseId: string) =>
    request<any[]>('GET', `/cases/${caseId}/assistance-requests`),

  listForLawyer: (tab?: 'new' | 'pending' | 'active' | 'completed' | 'all') => {
    const qs = tab ? `?tab=${tab}` : '';
    return request<any[]>('GET', `/assistance-requests/lawyer${qs}`);
  },

  review: (requestId: string) =>
    request<any>('POST', `/assistance-requests/${requestId}/review`),

  accept: (requestId: string, notes?: string) =>
    request<any>('POST', `/assistance-requests/${requestId}/accept`, { notes }),

  requestInfo: (requestId: string, message: string) =>
    request<any>('POST', `/assistance-requests/${requestId}/request-info`, { message }),

  decline: (requestId: string, reason?: string) =>
    request<any>('POST', `/assistance-requests/${requestId}/decline`, { reason }),
};

// ── Message Thread API Endpoints ──────────────────────────────────────────────
export const messageApi = {
  listByCase: (caseId: string) =>
    request<any[]>('GET', `/cases/${caseId}/messages`),

  send: (caseId: string, content: string, attachments?: any[]) =>
    request<any>('POST', `/cases/${caseId}/messages`, { content, attachments }),
};


