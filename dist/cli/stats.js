import chalk from 'chalk';
import Table from 'cli-table3';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { SessionProcessor } from '../utils/session-processor.js';
export async function statsCommand(options) {
    const processor = new SessionProcessor();
    try {
        console.log(chalk.cyan(`\n📊 GitHub Copilot Usage Stats for ${options.date}\n`));
        const stats = await processor.getUsageByDate(options.date);
        if (options.output) {
            await exportToJsonFile(stats, options.output, options.date);
        }
        if (options.json) {
            console.log(JSON.stringify(stats, null, 2));
            return;
        }
        if (stats.totalPrompts === 0) {
            console.log(chalk.yellow('⚠️  No usage data found for this date'));
            console.log(chalk.gray('   Make sure Copilot CLI is installed and session data exists in ~/.copilot/history-session-state/'));
            return;
        }
        displayOverview(stats);
        if (options.verbose) {
            displayDetailedBreakdown(stats);
        }
        displayVisualization(stats);
    }
    catch (error) {
        console.error(chalk.red('❌ Error retrieving stats:'), error);
        process.exit(1);
    }
}
function displayOverview(stats) {
    const table = new Table({
        chars: {
            'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
            'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
            'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
            'right': '║', 'right-mid': '╢', 'middle': '│'
        },
        style: { head: ['cyan'] }
    });
    const avgResponseTime = stats.totalDuration / stats.totalPrompts / 1000;
    const costPerPrompt = stats.totalCost / stats.totalPrompts;
    table.push(['📝 Total Prompts', chalk.green(stats.totalPrompts.toLocaleString())], ['🎯 Tokens Used', chalk.yellow(stats.totalTokens.toLocaleString())], ['💰 Total Cost', chalk.magenta(`$${stats.totalCost.toFixed(4)}`)], ['⚡ Avg Response Time', chalk.blue(`${avgResponseTime.toFixed(2)}s`)], ['💵 Cost per Prompt', chalk.cyan(`$${costPerPrompt.toFixed(6)}`)], ['🔄 Unique Sessions', chalk.white(stats.uniqueSessions.toString())], ['📊 Avg Prompt Tokens', chalk.gray(Math.round(stats.averagePromptTokens).toLocaleString())], ['✨ Avg Completion Tokens', chalk.gray(Math.round(stats.averageCompletionTokens).toLocaleString())]);
    console.log(table.toString());
    console.log();
}
function displayDetailedBreakdown(stats) {
    if (Object.keys(stats.commands).length > 0) {
        console.log(chalk.cyan('🛠️  Command Usage:'));
        const commandTable = new Table({
            head: ['Command', 'Count', 'Percentage'],
            style: { head: ['cyan'] }
        });
        const sortedCommands = Object.entries(stats.commands)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);
        sortedCommands.forEach(([command, count]) => {
            const percentage = ((count / stats.totalPrompts) * 100).toFixed(1);
            const shortCommand = command.length > 50 ? command.substring(0, 47) + '...' : command;
            commandTable.push([
                shortCommand,
                count.toString(),
                `${percentage}%`
            ]);
        });
        console.log(commandTable.toString());
        console.log();
    }
    if (Object.keys(stats.models).length > 0) {
        console.log(chalk.cyan('🤖 Model Usage:'));
        const modelTable = new Table({
            head: ['Model', 'Requests', 'Percentage'],
            style: { head: ['cyan'] }
        });
        Object.entries(stats.models)
            .sort(([, a], [, b]) => b - a)
            .forEach(([model, count]) => {
            const percentage = ((count / stats.totalPrompts) * 100).toFixed(1);
            modelTable.push([
                model,
                count.toString(),
                `${percentage}%`
            ]);
        });
        console.log(modelTable.toString());
        console.log();
    }
}
function displayVisualization(stats) {
    console.log(chalk.cyan('📊 Usage Visualization:'));
    displayTokenVisualization(stats);
    displayDurationVisualization(stats);
    displayMessageBreakdown(stats);
    console.log();
}
function displayTokenVisualization(stats) {
    const maxTokens = Math.max(50000, stats.totalTokens);
    const barLength = 30;
    const tokenBarLength = Math.round((stats.totalTokens / maxTokens) * barLength);
    const tokenBar = '█'.repeat(tokenBarLength) + '░'.repeat(barLength - tokenBarLength);
    console.log(chalk.white('Tokens: ') + tokenBar + ' ' + chalk.yellow(stats.totalTokens.toLocaleString()));
}
function displayDurationVisualization(stats) {
    const totalSeconds = stats.totalDuration;
    const formattedDuration = formatDuration(totalSeconds);
    console.log(chalk.white('Duration: ') + formattedDuration);
}
function displayMessageBreakdown(stats) {
    const totalMessages = stats.totalPrompts;
    const barLength = 20;
    const messageBarLength = Math.min(barLength, Math.round((totalMessages / 100) * barLength));
    const messageBar = '█'.repeat(messageBarLength) + '░'.repeat(barLength - messageBarLength);
    console.log(chalk.white('Messages: ') + messageBar + ' ' + chalk.green(totalMessages.toLocaleString()));
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
async function exportToJsonFile(stats, outputPath, date) {
    try {
        let finalPath = outputPath;
        if (outputPath.endsWith('/') || !outputPath.includes('.')) {
            const fileName = `copilot-stats-${date}.json`;
            finalPath = outputPath.endsWith('/') ? join(outputPath, fileName) : join(outputPath, fileName);
        }
        if (!finalPath.endsWith('.json')) {
            finalPath += '.json';
        }
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                generatedBy: 'copilot-status',
                version: '1.0.0',
                statsDate: date
            },
            data: stats
        };
        writeFileSync(finalPath, JSON.stringify(exportData, null, 2));
        console.log(chalk.green(`✅ Data exported to: ${finalPath}`));
    }
    catch (error) {
        console.error(chalk.red('❌ Failed to export data:'), error);
        throw error;
    }
}
