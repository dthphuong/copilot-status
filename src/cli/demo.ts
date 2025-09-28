import chalk from 'chalk';
import ora from 'ora';
import { UsageLogger } from '../utils/logger.js';
import { CopilotUsage } from '../utils/types.js';
import { subDays, format, addHours, addMinutes } from 'date-fns';

interface DemoOptions {
  days: string;
  file: string;
}

export async function demoCommand(options: DemoOptions) {
  const days = parseInt(options.days);
  const logger = new UsageLogger(options.file);

  console.log(chalk.cyan('🎭 Generating Demo Data for GitHub Copilot Usage Tracker\n'));

  const spinner = ora('Creating realistic usage patterns...').start();

  try {
    await logger.ensureLogFile();

    const demoCommands = [
      'gh copilot suggest "deploy application to kubernetes"',
      'gh copilot explain "async/await pattern in JavaScript"',
      'gh copilot review ./src/components/UserProfile.tsx',
      'gh copilot chat "optimize database query performance"',
      'gh copilot suggest "handle error cases in API calls"',
      'gh copilot explain "difference between map and forEach"',
      'gh copilot chat "best practices for React hooks"',
      'gh copilot suggest "implement authentication middleware"',
      'gh copilot review ./tests/integration.test.js',
      'gh copilot chat "explain memory leaks in Node.js"',
      'gh copilot suggest "create responsive CSS grid layout"',
      'gh copilot explain "how JWT tokens work"',
      'gh copilot chat "performance optimization strategies"',
      'gh copilot suggest "implement rate limiting"',
      'gh copilot explain "microservices architecture patterns"'
    ];

    const models = [
      'gpt-4',
      'gpt-3.5-turbo',
      'github-copilot-chat',
      'github-copilot-code'
    ];

    let totalGenerated = 0;

    for (let day = 0; day < days; day++) {
      const targetDate = subDays(new Date(), day);
      const commandsPerDay = Math.floor(Math.random() * 15) + 5; // 5-20 commands per day

      spinner.text = `Generating day ${day + 1}/${days} (${format(targetDate, 'MMM dd')})...`;

      for (let cmd = 0; cmd < commandsPerDay; cmd++) {
        // Generate realistic working hours (9 AM to 6 PM with some variation)
        const workingHours = Math.floor(Math.random() * 9) + 9; // 9-17
        const minutes = Math.floor(Math.random() * 60);
        const timestamp = addMinutes(addHours(targetDate, workingHours), minutes);

        // Select random command and model
        const command = demoCommands[Math.floor(Math.random() * demoCommands.length)];
        const model = models[Math.floor(Math.random() * models.length)];

        // Generate realistic token usage based on command complexity
        const promptTokens = Math.floor(command.length * 0.75) + Math.floor(Math.random() * 200);
        const completionTokens = Math.floor(promptTokens * (0.3 + Math.random() * 1.5));
        const totalTokens = promptTokens + completionTokens;

        // Calculate cost based on model
        const costPerToken = getCostPerToken(model);
        const cost = totalTokens * costPerToken;

        // Generate realistic response time
        const duration = Math.floor(Math.random() * 3000) + 500; // 500ms to 3.5s

        const sessionId = `demo_session_${Math.floor(Math.random() * 5) + 1}`;

        const usage: CopilotUsage = {
          timestamp,
          model,
          promptTokens,
          completionTokens,
          totalTokens,
          cost,
          sessionId,
          command,
          duration
        };

        await logger.logUsage(usage);
        totalGenerated++;
      }
    }

    spinner.succeed(`Generated ${totalGenerated} demo usage entries over ${days} days`);

    console.log(chalk.green('\n✅ Demo data created successfully!'));
    console.log(chalk.gray(`📁 Saved to: ${options.file}`));
    console.log(chalk.yellow('\n🚀 Try these commands now:'));
    console.log(chalk.gray('  copilot-usage stats --verbose    # View detailed statistics'));
    console.log(chalk.gray('  copilot-usage dashboard          # Launch live dashboard'));
    console.log(chalk.gray(`  copilot-usage stats --date ${format(subDays(new Date(), 2), 'yyyy-MM-dd')}  # View past days`));

  } catch (error) {
    spinner.fail('Failed to generate demo data');
    console.error(chalk.red('❌ Error:'), error);
    process.exit(1);
  }
}

function getCostPerToken(model: string): number {
  // Cost per token in USD (approximate values)
  const costs = {
    'gpt-4': 0.00003,
    'gpt-3.5-turbo': 0.000002,
    'github-copilot-chat': 0.000001,
    'github-copilot-code': 0.0000005
  };
  return costs[model as keyof typeof costs] || 0.000001;
}