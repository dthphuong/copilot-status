import chalk from 'chalk';
import { SessionProcessor } from '../utils/session-processor.js';
import { join } from 'path';
import { homedir } from 'os';
export async function trackCommand(options) {
    const interval = parseInt(options.interval);
    const processor = new SessionProcessor();
    const historyDir = join(homedir(), '.copilot', 'history-session-state');
    console.log(chalk.cyan('🔍 Starting GitHub Copilot Usage Tracker'));
    console.log(chalk.gray(`📁 Monitoring: ${historyDir}`));
    console.log(chalk.gray(`⏱️  Check interval: ${interval}s\n`));
    let sessionFiles = [];
    try {
        sessionFiles = await processor.getSessionFiles();
        console.log(chalk.green(`✅ Found ${sessionFiles.length} existing session files`));
    }
    catch (error) {
        console.log(chalk.yellow('⚠️  No session files found'));
        console.log(chalk.gray('   Make sure Copilot CLI is installed and has been used'));
        console.log(chalk.gray('   Session data should be in ~/.copilot/history-session-state/\n'));
    }
    let totalTracked = 0;
    let totalTokens = 0;
    let totalCost = 0;
    process.on('SIGINT', () => {
        console.log(chalk.yellow('\n\n⏹️  Stopping tracker...'));
        console.log(chalk.white(`📊 Session Summary:`));
        console.log(chalk.gray(`   Commands tracked: ${totalTracked}`));
        console.log(chalk.gray(`   Total tokens: ${totalTokens.toLocaleString()}`));
        console.log(chalk.gray(`   Total cost: $${totalCost.toFixed(6)}`));
        console.log(chalk.green('✅ Tracker stopped successfully'));
        process.exit(0);
    });
    console.log(chalk.green('🚀 Tracker started! (Press Ctrl+C to stop)'));
    console.log(chalk.gray('─'.repeat(60)));
    if (sessionFiles.length > 0) {
        console.log(chalk.blue('📂 Processing existing sessions...'));
        for (const sessionFile of sessionFiles) {
            await processSessionFile(sessionFile);
        }
        console.log(chalk.gray('─'.repeat(60)));
    }
    console.log(chalk.gray('👀 Watching for new Copilot sessions...\n'));
    const checkInterval = setInterval(async () => {
        await checkForNewSessions();
    }, interval * 1000);
    await checkForNewSessions();
}
async function processSessionFile(sessionFile) {
    try {
        const processor = new SessionProcessor();
        const sessionData = await processor.parseSessionFile(sessionFile);
        const metrics = processor.calculateSessionMetrics(sessionData);
        const usage = {
            timestamp: new Date(sessionData.startTime),
            model: 'github-copilot',
            promptTokens: Math.round(metrics.tokens * 0.3),
            completionTokens: Math.round(metrics.tokens * 0.7),
            totalTokens: metrics.tokens,
            cost: processor.calculateCost(metrics.tokens),
            sessionId: sessionData.sessionId,
            command: `Session ${sessionData.sessionId} (${metrics.prompts} prompts)`,
            duration: metrics.duration * 1000
        };
        totalTracked++;
        totalTokens += usage.totalTokens;
        totalCost += usage.cost;
        const timestamp = usage.timestamp.toLocaleTimeString();
        console.log(chalk.blue(`[${timestamp}]`) + ' ' +
            chalk.green('📄') + ' ' +
            chalk.white(`Session: ${usage.sessionId.substring(0, 8)}...`));
        console.log(chalk.gray('  ') +
            chalk.yellow(`🎯 ${usage.totalTokens} tokens`) + ' ' +
            chalk.magenta(`💰 $${usage.cost.toFixed(6)}`) + ' ' +
            chalk.cyan(`📝 ${metrics.prompts} prompts`) + ' ' +
            chalk.blue(`⏱️ ${formatDuration(metrics.duration)}`));
        if (totalTracked % 5 === 0) {
            console.log(chalk.gray('─'.repeat(60)));
            console.log(chalk.white(`📊 Running totals: `) +
                chalk.gray(`${totalTracked} sessions, `) +
                chalk.yellow(`${totalTokens.toLocaleString()} tokens, `) +
                chalk.magenta(`$${totalCost.toFixed(6)}`));
            console.log(chalk.gray('─'.repeat(60)));
        }
    }
    catch (error) {
        console.error(chalk.red(`❌ Error processing session file ${sessionFile}:`), error.message);
    }
}
async function checkForNewSessions() {
    try {
        const processor = new SessionProcessor();
        const currentFiles = await processor.getSessionFiles();
        const newFiles = currentFiles.filter(file => !processedFiles.has(file));
        for (const newFile of newFiles) {
            processedFiles.add(newFile);
            await processSessionFile(newFile);
        }
        if (newFiles.length === 0) {
            console.log(chalk.gray(`[${new Date().toLocaleTimeString()}] 👀 Watching for new sessions... (${currentFiles.length} total)`));
        }
    }
    catch (error) {
        console.error(chalk.red('❌ Error checking for new sessions:'), error.message);
    }
}
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    if (hours > 0) {
        return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    else if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    }
    else {
        return `${remainingSeconds}s`;
    }
}
let totalTracked = 0;
let totalTokens = 0;
let totalCost = 0;
const processedFiles = new Set();
