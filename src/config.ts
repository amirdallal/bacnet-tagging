import dotenv from 'dotenv';
dotenv.config();

function env(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function envFloat(key: string, fallback: number): number {
  const v = process.env[key];
  return v ? parseFloat(v) : fallback;
}

export const config = {
  port: parseInt(env('PORT', '3000'), 10),
  nodeEnv: env('NODE_ENV', 'development'),

  auth: {
    user: env('BASIC_AUTH_USER', 'admin'),
    pass: env('BASIC_AUTH_PASS', 'changeme'),
  },

  ollama: {
    url: env('OLLAMA_URL', 'http://localhost:11434'),
    model: env('OLLAMA_MODEL', 'llama3.1'),
  },

  claude: {
    apiKey: env('ANTHROPIC_API_KEY', ''),
    model: env('CLAUDE_MODEL', 'claude-sonnet-4-20250514'),
    dailyBudgetUsd: envFloat('CLAUDE_DAILY_BUDGET_USD', 5.0),
  },

  cache: {
    ttlHours: envFloat('CACHE_TTL_HOURS', 24),
  },

  confidence: {
    high: envFloat('CONFIDENCE_HIGH', 0.80),
    medium: envFloat('CONFIDENCE_MEDIUM', 0.50),
    low: envFloat('CONFIDENCE_LOW', 0.20),
  },
} as const;
