import chalk from 'chalk';
import { SessionProcessor } from '../utils/session-processor.js';
import { CopilotUsage } from '../utils/types.js';
import { watch } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface TrackOptions {
  file: string;
  interval: string;
}

export async function trackCommand(options: TrackOptions) {
  const interval = parseInt(options.interval);
  const processor = new SessionProcessor();
  const historyDir = join(homedir(), '.copilot', 'history-session-state');

  console.log(chalk.cyan('🔍 Starting GitHub Copilot Usage Tracker'));
  console.log(chalk.gray(`📁 Monitoring: ${historyDir}`));
  console.log(chalk.gray(`⏱️  Check interval: ${interval}s\n`));

  // Check if session directory exists
  let sessionFiles: string[] = [];
  try {
    sessionFiles = await processor.getSessionFiles();
    console.log(chalk.green(`✅ Found ${sessionFiles.length} existing session files`));
  } catch (error) {
    console.log(chalk.yellow('⚠️  No session files found'));
    console.log(chalk.gray('   Make sure Copilot CLI is installed and has been used'));
    console.log(chalk.gray('   Session data should be in ~/.copilot/history-session-state/\n'));
  }

  let totalTracked = 0;
  let totalTokens = 0;
  let totalCost = 0;

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n⏹️  Stopping tracker...'));
    console.log(chalk.white(`📊 Session Summary:`));
    console.log(chalk.gray(`   Commands tracked: ${totalTracked}`));
    console.log(chalk.gray(`   Total tokens: ${totalTokens.toLocaleString()}`));
    console.log(chalk.gray(`   Total cost: $${totalCost.toFixed(6)}`));
    console.log(chalk.green('✅ Tracker stopped successfully'));
    process.exit(0);
  });

  // Start watching for Copilot usage
  console.log(chalk.green('🚀 Tracker started! (Press Ctrl+C to stop)'));
  console.log(chalk.gray('─'.repeat(60)));

  // Process existing sessions
  if (sessionFiles.length > 0) {
    console.log(chalk.blue('📂 Processing existing sessions...'));
    for (const sessionFile of sessionFiles) {
      await processSessionFile(sessionFile);
    }
    console.log(chalk.gray('─'.repeat(60)));
  }

  // Start monitoring for new sessions
  console.log(chalk.gray('👀 Watching for new Copilot sessions...\n'));

  // Set up periodic checking for new session files
  const checkInterval = setInterval(async () => {
    await checkForNewSessions();
  }, interval * 1000);

  // Initial check
  await checkForNewSessions();
}

async function processSessionFile(sessionFile: string): Promise<void> {
  try {
    const processor = new SessionProcessor();
    const sessionData = await processor.parseSessionFile(sessionFile);
    const metrics = processor.calculateSessionMetrics(sessionData);

    // Create usage object
    const usage: CopilotUsage = {
      timestamp: new Date(sessionData.startTime),
      model: 'github-copilot',
      promptTokens: Math.round(metrics.tokens * 0.3), // Estimate
      completionTokens: Math.round(metrics.tokens * 0.7), // Estimate
      totalTokens: metrics.tokens,
      cost: processor.calculateCost(metrics.tokens),
      sessionId: sessionData.sessionId,
      command: `Session ${sessionData.sessionId} (${metrics.prompts} prompts)`,
      duration: metrics.duration * 1000 // Convert to milliseconds
    };

    // Update counters
    totalTracked++;
    totalTokens += usage.totalTokens;
    totalCost += usage.cost;

    // Display the tracked session
    const timestamp = usage.timestamp.toLocaleTimeString();
    console.log(
      chalk.blue(`[${timestamp}]`) + ' ' +
      chalk.green('📄') + ' ' +
      chalk.white(`Session: ${usage.sessionId.substring(0, 8)}...`)
    );

    console.log(
      chalk.gray('  ') +
      chalk.yellow(`🎯 ${usage.totalTokens} tokens`) + ' ' +
      chalk.magenta(`💰 $${usage.cost.toFixed(6)}`) + ' ' +
      chalk.cyan(`📝 ${metrics.prompts} prompts`) + ' ' +
      chalk.blue(`⏱️ ${formatDuration(metrics.duration)}`)
    );

    // Show running totals every 5 sessions
    if (totalTracked % 5 === 0) {
      console.log(chalk.gray('─'.repeat(60)));
      console.log(
        chalk.white(`📊 Running totals: `) +
        chalk.gray(`${totalTracked} sessions, `) +
        chalk.yellow(`${totalTokens.toLocaleString()} tokens, `) +
        chalk.magenta(`$${totalCost.toFixed(6)}`)
      );
      console.log(chalk.gray('─'.repeat(60)));
    }

  } catch (error: any) {
    console.error(chalk.red(`❌ Error processing session file ${sessionFile}:`), error.message);
  }
}

async function checkForNewSessions(): Promise<void> {
  try {
    const processor = new SessionProcessor();
    const currentFiles = await processor.getSessionFiles();

    // Find new files (simplified approach - in production would track state)
    const newFiles = currentFiles.filter(file =>
      !processedFiles.has(file)
    );

    for (const newFile of newFiles) {
      processedFiles.add(newFile);
      await processSessionFile(newFile);
    }

    // Show status if no new activity
    if (newFiles.length === 0) {
      console.log(chalk.gray(`[${new Date().toLocaleTimeString()}] 👀 Watching for new sessions... (${currentFiles.length} total)`));
    }

  } catch (error: any) {
    console.error(chalk.red('❌ Error checking for new sessions:'), error.message);
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

// Global state to track processed files
let totalTracked = 0;
let totalTokens = 0;
let totalCost = 0;
const processedFiles = new Set<string>();