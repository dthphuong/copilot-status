#!/usr/bin/env node
import { Command } from 'commander';
import { statsCommand } from './cli/stats.js';
import { dashboardCommand } from './cli/dashboard.js';
import { trackCommand } from './cli/track.js';
import { demoCommand } from './cli/demo.js';
import chalk from 'chalk';
const VERSION = '1.0.0';
const program = new Command();
program
    .name('copilot-usage')
    .description('GitHub Copilot CLI usage tracker and visualizer')
    .version(VERSION);
program
    .command('stats')
    .description('Show current day usage statistics')
    .option('-d, --date <date>', 'Date to show stats for (YYYY-MM-DD)', new Date().toISOString().split('T')[0])
    .option('-j, --json', 'Output in JSON format')
    .option('-v, --verbose', 'Show detailed information')
    .action(statsCommand);
program
    .command('dashboard')
    .description('Live dashboard with real-time usage visualization')
    .option('-i, --interval <seconds>', 'Refresh interval in seconds', '30')
    .option('--compact', 'Use compact display mode')
    .action(dashboardCommand);
program
    .command('track')
    .description('Start tracking Copilot usage (background process)')
    .option('-f, --file <path>', 'Log file path', './copilot-usage.log')
    .option('-i, --interval <seconds>', 'Tracking interval in seconds', '60')
    .action(trackCommand);
program
    .command('demo')
    .description('Generate demo data to showcase the tracker features')
    .option('-d, --days <number>', 'Number of days of demo data to generate', '7')
    .option('-f, --file <path>', 'Log file path', './copilot-usage.log')
    .action(demoCommand);
if (!process.argv.slice(2).length) {
    console.log(chalk.cyan('🤖 GitHub Copilot CLI Usage Tracker\n'));
    program.outputHelp();
    console.log(`\n${chalk.gray('Examples:')}`);
    console.log(chalk.gray('  copilot-usage demo               # Generate demo data'));
    console.log(chalk.gray('  copilot-usage stats              # Show today\'s usage'));
    console.log(chalk.gray('  copilot-usage stats --date 2024-01-15  # Show specific date'));
    console.log(chalk.gray('  copilot-usage dashboard          # Live dashboard'));
    console.log(chalk.gray('  copilot-usage track              # Start background tracking'));
}
program.parse(process.argv);
