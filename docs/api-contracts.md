# NyayaSetu API Contracts (Phase 1 Initial Specification)

## Base URL
`/api/v1`

## Health Check
- **Endpoint**: `GET /api/health`
- **Auth**: Public
- **Response**:
```json
{
  "status": "healthy",
  "service": "NyayaSetu Backend API",
  "version": "1.0.0",
  "environment": "development",
  "uptime": 12.34,
  "timestamp": "2026-10-08T01:30:00.000Z"
}
```

## Upcoming Modules (Phases 2-6)
- `/api/v1/auth/*`: Authentication, sign-in, token refresh
- `/api/v1/users/*`: Profile management, preferred Indian language
- `/api/v1/lawyers/*`: Verified lawyer directory and search
- `/api/v1/cases/*`: Case lifecycle, status updates, timelines
- `/api/v1/documents/*`: Secure file upload & signed URL generation
- `/api/v1/ai/*`: Gemini AI document analysis (server-side only)
- `/api/v1/bhashini/*`: Server-side translation proxy
