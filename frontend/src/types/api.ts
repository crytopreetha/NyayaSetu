export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
  uptime: number;
  timestamp: string;
  components: {
    server: string;
    database: string;
    aiEngine: string;
    bhashini: string;
  };
}
