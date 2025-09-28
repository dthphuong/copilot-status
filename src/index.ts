#!/usr/bin/env node

import { Command } from 'commander';
import { statsCommand } from './cli/stats.js';
import { dashboardCommand } from './cli/dashboard.js';
import { trackCommand } from './cli/track.js';
import chalk from 'chalk';

const VERSION = '1.0.0';

const program = new Command();

program
  .name('copilot-status')
  .description('GitHub Copilot CLI usage tracker and visualizer')
  .version(VERSION);

program
  .command('stats')
  .description('Show current day usage statistics')
  .option('-d, --date <date>', 'Date to show stats for (YYYY-MM-DD)', new Date().toISOString().split('T')[0])
  .option('-j, --json', 'Output in JSON format')
  .option('-o, --output <path>', 'Export JSON data to file (default: current directory)')
  .option('-v, --verbose', 'Show detailed information')
  .action((options) => {
  statsCommand(options);
});

program
  .command('dashboard') 
  .description('Live dashboard with real-time usage visualization')
  .option('-i, --interval <seconds>', 'Refresh interval in seconds', '30')
  .option('--compact', 'Use compact display mode')
  .action(dashboardCommand);

program
  .command('track')
  .description('Start tracking Copilot usage (background process)')
  .option('-f, --file <path>', 'Log file path', './copilot-status.log')
  .option('-i, --interval <seconds>', 'Tracking interval in seconds', '60')
  .action(trackCommand);


// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.cyan('🤖 GitHub Copilot CLI Usage Tracker\n'));
  program.outputHelp();
  console.log(`\n${chalk.gray('Examples:')}`);
    console.log(chalk.gray('  npm start -- stats                    # Show today\'s usage'));
  console.log(chalk.gray('  npm start -- stats --date 2024-01-15   # Show specific date'));
  console.log(chalk.gray('  npm start -- stats --output data.json  # Export data'));
  console.log(chalk.gray('  npm start -- dashboard                 # Live dashboard'));
  console.log(chalk.gray('  npm start -- track                    # Start background tracking'));
}

program.parse(process.argv);