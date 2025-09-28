import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
export class SessionProcessor {
    constructor() {
        this.historyDir = join(homedir(), '.copilot', 'history-session-state');
    }
    async getTodayUsage() {
        const today = new Date().toISOString().split('T')[0];
        return this.getUsageByDate(today);
    }
    async getUsageByDate(targetDate) {
        try {
            const sessionFiles = await this.getSessionFiles();
            const sessionMetrics = [];
            for (const sessionFile of sessionFiles) {
                try {
                    const sessionData = await this.parseSessionFile(sessionFile);
                    if (this.isSessionFromTargetDate(sessionData, targetDate)) {
                        const metrics = this.calculateSessionMetrics(sessionData);
                        sessionMetrics.push(metrics);
                    }
                }
                catch (error) {
                    console.warn(`Failed to process session file ${sessionFile}:`, error);
                    continue;
                }
            }
            return this.aggregateDailyStats(targetDate, sessionMetrics);
        }
        catch (error) {
            console.error('Error getting usage by date:', error);
            return this.createEmptyStats(targetDate);
        }
    }
    async getSessionFiles() {
        try {
            await fs.access(this.historyDir);
            const files = await fs.readdir(this.historyDir);
            const sessionFiles = files
                .filter(file => file.startsWith('session_') && file.endsWith('.json'))
                .map(file => join(this.historyDir, file));
            if (sessionFiles.length === 0) {
                console.warn('No session files found in:', this.historyDir);
            }
            return sessionFiles;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                console.warn('Session directory does not exist:', this.historyDir);
                console.info('GitHub Copilot CLI may not be installed or used yet.');
            }
            else if (error.code === 'EACCES') {
                console.warn('Permission denied accessing session directory:', this.historyDir);
            }
            else {
                console.warn('Error accessing session directory:', error.message);
            }
            return [];
        }
    }
    async parseSessionFile(filePath) {
        try {
            await fs.access(filePath);
            const content = await fs.readFile(filePath, 'utf-8');
            if (!content.trim()) {
                throw new Error('Empty file');
            }
            const data = JSON.parse(content);
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid JSON object');
            }
            if (!data.sessionId || typeof data.sessionId !== 'string') {
                throw new Error('Missing or invalid sessionId');
            }
            if (!data.chatMessages || !Array.isArray(data.chatMessages)) {
                throw new Error('Missing or invalid chatMessages array');
            }
            for (const msg of data.chatMessages) {
                if (!msg.role || !['user', 'assistant', 'tool', 'system'].includes(msg.role)) {
                    throw new Error('Invalid message role');
                }
            }
            return data;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${filePath}`);
            }
            else if (error.code === 'EACCES') {
                throw new Error(`Permission denied: ${filePath}`);
            }
            else if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
            }
            else {
                throw new Error(`Failed to parse session file ${filePath}: ${error.message}`);
            }
        }
    }
    isSessionFromTargetDate(sessionData, targetDate) {
        if (!sessionData.startTime) {
            console.warn(`Session ${sessionData.sessionId} missing startTime`);
            return false;
        }
        try {
            const sessionDate = new Date(sessionData.startTime);
            if (isNaN(sessionDate.getTime())) {
                console.warn(`Session ${sessionData.sessionId} has invalid startTime: ${sessionData.startTime}`);
                return false;
            }
            if (sessionDate > new Date()) {
                console.warn(`Session ${sessionData.sessionId} has future timestamp: ${sessionData.startTime}`);
                return false;
            }
            const sessionDateString = sessionDate.toISOString().split('T')[0];
            return sessionDateString === targetDate;
        }
        catch (error) {
            console.warn(`Error parsing date for session ${sessionData.sessionId}: ${error.message}`);
            return false;
        }
    }
    calculateSessionMetrics(sessionData) {
        const startTime = sessionData.startTime ? new Date(sessionData.startTime) : null;
        const endTime = sessionData.endTime ? new Date(sessionData.endTime) : new Date();
        const duration = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0;
        const tokens = this.estimateTokens(sessionData);
        const messages = this.countMessages(sessionData);
        const userMessages = this.countUserMessages(sessionData);
        const assistantMessages = this.countAssistantMessages(sessionData);
        const toolMessages = this.countToolMessages(sessionData);
        const toolCalls = this.countToolCalls(sessionData);
        return {
            sessionId: sessionData.sessionId,
            startTime: sessionData.startTime,
            endTime: sessionData.endTime,
            duration,
            tokens,
            prompts: userMessages,
            messages,
            toolCalls,
            userMessages,
            assistantMessages,
            toolMessages
        };
    }
    estimateTokens(sessionData) {
        if (!sessionData.chatMessages)
            return 0;
        let totalTokens = 0;
        for (const msg of sessionData.chatMessages) {
            if (msg.content) {
                totalTokens += Math.ceil(msg.content.length / 4);
            }
            if (msg.tool_calls) {
                totalTokens += msg.tool_calls.length * 10;
            }
        }
        return totalTokens;
    }
    countMessages(sessionData) {
        return sessionData.chatMessages ? sessionData.chatMessages.length : 0;
    }
    countUserMessages(sessionData) {
        if (!sessionData.chatMessages)
            return 0;
        return sessionData.chatMessages.filter(msg => msg.role === 'user').length;
    }
    countAssistantMessages(sessionData) {
        if (!sessionData.chatMessages)
            return 0;
        return sessionData.chatMessages.filter(msg => msg.role === 'assistant').length;
    }
    countToolMessages(sessionData) {
        if (!sessionData.chatMessages)
            return 0;
        return sessionData.chatMessages.filter(msg => msg.role === 'tool').length;
    }
    countToolCalls(sessionData) {
        if (!sessionData.chatMessages)
            return 0;
        return sessionData.chatMessages.reduce((count, msg) => {
            if (msg.tool_calls) {
                return count + msg.tool_calls.length;
            }
            return count;
        }, 0);
    }
    aggregateDailyStats(date, sessionMetrics) {
        if (sessionMetrics.length === 0) {
            return this.createEmptyStats(date);
        }
        const totalTokens = sessionMetrics.reduce((sum, s) => sum + s.tokens, 0);
        const totalPrompts = sessionMetrics.reduce((sum, s) => sum + s.prompts, 0);
        const totalDuration = sessionMetrics.reduce((sum, s) => sum + s.duration, 0);
        const totalToolCalls = sessionMetrics.reduce((sum, s) => sum + s.toolCalls, 0);
        const totalCost = this.calculateCost(totalTokens);
        const averagePromptTokens = totalPrompts > 0 ? totalTokens / totalPrompts : 0;
        const averageCompletionTokens = totalPrompts > 0 ? (totalTokens - averagePromptTokens) : 0;
        const hourlyBreakdown = this.calculateHourlyBreakdown(sessionMetrics);
        return {
            date,
            totalPrompts,
            totalTokens,
            totalCost,
            averagePromptTokens,
            averageCompletionTokens,
            totalDuration,
            uniqueSessions: sessionMetrics.length,
            commands: {},
            models: { 'github-copilot': totalPrompts },
            hourlyBreakdown
        };
    }
    calculateCost(tokens) {
        return tokens * 0.000001;
    }
    calculateHourlyBreakdown(sessionMetrics) {
        const hourly = {};
        for (let hour = 0; hour < 24; hour++) {
            const hourStr = hour.toString().padStart(2, '0');
            hourly[hourStr] = {
                prompts: 0,
                tokens: 0,
                cost: 0,
                duration: 0
            };
        }
        for (const metrics of sessionMetrics) {
            if (metrics.startTime) {
                const hour = new Date(metrics.startTime).getHours();
                const hourStr = hour.toString().padStart(2, '0');
                hourly[hourStr].prompts += metrics.prompts;
                hourly[hourStr].tokens += metrics.tokens;
                hourly[hourStr].cost += this.calculateCost(metrics.tokens);
                hourly[hourStr].duration += metrics.duration;
            }
        }
        return hourly;
    }
    createEmptyStats(date) {
        const hourlyBreakdown = {};
        for (let hour = 0; hour < 24; hour++) {
            const hourStr = hour.toString().padStart(2, '0');
            hourlyBreakdown[hourStr] = {
                prompts: 0,
                tokens: 0,
                cost: 0,
                duration: 0
            };
        }
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
            hourlyBreakdown
        };
    }
    async getAvailableDates() {
        try {
            const sessionFiles = await this.getSessionFiles();
            const dates = new Set();
            for (const sessionFile of sessionFiles) {
                try {
                    const sessionData = await this.parseSessionFile(sessionFile);
                    if (sessionData.startTime) {
                        const date = new Date(sessionData.startTime).toISOString().split('T')[0];
                        dates.add(date);
                    }
                }
                catch {
                    continue;
                }
            }
            return Array.from(dates).sort();
        }
        catch {
            return [];
        }
    }
}
