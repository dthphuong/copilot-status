export interface CopilotUsage {
  timestamp: Date;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  sessionId: string;
  command: string;
  duration: number; // in milliseconds
}

export interface DailyStats {
  date: string;
  totalPrompts: number;
  totalTokens: number;
  totalCost: number;
  averagePromptTokens: number;
  averageCompletionTokens: number;
  totalDuration: number;
  uniqueSessions: number;
  commands: { [key: string]: number };
  models: { [key: string]: number };
  hourlyBreakdown: { [hour: string]: HourlyStats };
}

export interface HourlyStats {
  prompts: number;
  tokens: number;
  cost: number;
  duration: number;
}

export interface UsageConfig {
  logFile: string;
  trackingInterval: number;
  apiKey?: string;
  enableNotifications: boolean;
  costThresholds: {
    warning: number;
    critical: number;
  };
}

export interface CopilotMetrics {
  tokensPerMinute: number;
  averageResponseTime: number;
  successRate: number;
  costBurnRate: number; // dollars per hour
  contextWindowUsage: number; // percentage
}