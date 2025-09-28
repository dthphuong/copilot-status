import fs from 'fs/promises';
import { CopilotUsage, DailyStats, HourlyStats } from './types.js';
import path from 'path';

export class UsageLogger {
  constructor(private logFile: string) {}

  async logUsage(usage: CopilotUsage): Promise<void> {
    const logEntry = {
      ...usage,
      timestamp: usage.timestamp.toISOString()
    };

    try {
      await fs.appendFile(this.logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to log usage:', error);
    }
  }

  async getUsageForDate(date: string): Promise<CopilotUsage[]> {
    try {
      const logData = await fs.readFile(this.logFile, 'utf-8');
      const lines = logData.split('\n').filter(line => line.trim());
      
      return lines
        .map(line => {
          try {
            const entry = JSON.parse(line);
            return {
              ...entry,
              timestamp: new Date(entry.timestamp)
            };
          } catch {
            return null;
          }
        })
        .filter((entry): entry is CopilotUsage => 
          entry !== null && 
          entry.timestamp.toISOString().startsWith(date)
        );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async getDailyStats(date: string): Promise<DailyStats> {
    const usage = await this.getUsageForDate(date);
    
    if (usage.length === 0) {
      return {
        date,
        totalPrompts: 0,
        totalTokens: 0,
        totalCost: 0,
        averagePromptTokens: 0,
        averageCompletionTokens: 0,
        totalDuration: 0,
        uniqueSessions: 0,
        commands: {},
        models: {},
        hourlyBreakdown: {}
      };
    }

    const commands: { [key: string]: number } = {};
    const models: { [key: string]: number } = {};
    const hourlyBreakdown: { [hour: string]: HourlyStats } = {};
    const sessions = new Set<string>();

    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    
    usage.forEach(entry => {
      // Track commands
      commands[entry.command] = (commands[entry.command] || 0) + 1;
      
      // Track models
      models[entry.model] = (models[entry.model] || 0) + 1;
      
      // Track sessions
      sessions.add(entry.sessionId);
      
      // Track tokens
      totalPromptTokens += entry.promptTokens;
      totalCompletionTokens += entry.completionTokens;
      
      // Hourly breakdown
      const hour = entry.timestamp.getHours().toString().padStart(2, '0');
      if (!hourlyBreakdown[hour]) {
        hourlyBreakdown[hour] = { prompts: 0, tokens: 0, cost: 0, duration: 0 };
      }
      hourlyBreakdown[hour].prompts++;
      hourlyBreakdown[hour].tokens += entry.totalTokens;
      hourlyBreakdown[hour].cost += entry.cost;
      hourlyBreakdown[hour].duration += entry.duration;
    });

    return {
      date,
      totalPrompts: usage.length,
      totalTokens: usage.reduce((sum, u) => sum + u.totalTokens, 0),
      totalCost: usage.reduce((sum, u) => sum + u.cost, 0),
      averagePromptTokens: totalPromptTokens / usage.length,
      averageCompletionTokens: totalCompletionTokens / usage.length,
      totalDuration: usage.reduce((sum, u) => sum + u.duration, 0),
      uniqueSessions: sessions.size,
      commands,
      models,
      hourlyBreakdown
    };
  }

  async ensureLogFile(): Promise<void> {
    try {
      await fs.access(this.logFile);
    } catch {
      await fs.mkdir(path.dirname(this.logFile), { recursive: true });
      await fs.writeFile(this.logFile, '');
    }
  }
}