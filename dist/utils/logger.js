import fs from 'fs/promises';
import path from 'path';
export class UsageLogger {
    constructor(logFile) {
        this.logFile = logFile;
    }
    async logUsage(usage) {
        const logEntry = {
            ...usage,
            timestamp: usage.timestamp.toISOString()
        };
        try {
            await fs.appendFile(this.logFile, JSON.stringify(logEntry) + '\n');
        }
        catch (error) {
            console.error('Failed to log usage:', error);
        }
    }
    async getUsageForDate(date) {
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
                }
                catch {
                    return null;
                }
            })
                .filter((entry) => entry !== null &&
                entry.timestamp.toISOString().startsWith(date));
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }
    async getDailyStats(date) {
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
        const commands = {};
        const models = {};
        const hourlyBreakdown = {};
        const sessions = new Set();
        let totalPromptTokens = 0;
        let totalCompletionTokens = 0;
        usage.forEach(entry => {
            commands[entry.command] = (commands[entry.command] || 0) + 1;
            models[entry.model] = (models[entry.model] || 0) + 1;
            sessions.add(entry.sessionId);
            totalPromptTokens += entry.promptTokens;
            totalCompletionTokens += entry.completionTokens;
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
    async ensureLogFile() {
        try {
            await fs.access(this.logFile);
        }
        catch {
            await fs.mkdir(path.dirname(this.logFile), { recursive: true });
            await fs.writeFile(this.logFile, '');
        }
    }
}
