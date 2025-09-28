# 🤖 Copilot Status

<div align="center">

**A beautiful, informative console app to visualize GitHub Copilot CLI usage statistics**

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)

*Real-time tracking of tokens, prompts, costs, and usage patterns*

</div>

## ⚡ Quick Start

```bash
# Install dependencies and build
npm install && npm run build

# View today's usage statistics (from actual Copilot session data)
npm start stats --verbose

# View usage in JSON format
npm start stats --json

# View usage for a specific date
npm start stats --date 2024-01-15

# Export usage data to JSON file
npm start stats --output ./usage-data.json

# Export usage for specific date
npm start stats --date 2024-01-15 --output ./jan-15-stats.json

# Launch the live dashboard
npm start dashboard --compact

# Start background usage tracking
npm start track
```

## 📋 Features

### 🔧 Core Functionality
- **📊 Usage Statistics** - Track prompts, tokens, costs, and response times from actual Copilot session data
- **📈 Live Dashboard** - Real-time metrics with beautiful visualizations
- **🕒 Background Tracking** - Continuous monitoring of Copilot usage
- **💾 Data Source** - Direct analysis of GitHub Copilot CLI session files (`~/.copilot/history-session-state/`)
- **🎨 Rich Visualizations** - Colorful charts, progress bars, and tables with ASCII art
- **🧮 Accurate Metrics** - Token estimation using documented algorithms (1 token ≈ 4 characters + tool call overhead)

### 📊 Detailed Analytics
- **Token Usage**: Accurate token estimation using character-based calculation (1 token ≈ 4 chars)
- **Cost Tracking**: Real-time cost monitoring based on actual token usage
- **Session Analysis**: Multiple session tracking with duration calculation
- **Message Analysis**: User, assistant, tool, and system message counting
- **Tool Call Tracking**: Analysis of bash, str_replace_editor, and other tool executions
- **Session Duration**: Precise timing from session start to end (or current time)
- **Hourly Breakdown**: Activity patterns throughout the day with UTC timezone handling
- **Date Filtering**: Filter usage by specific dates with ISO 8601 validation

### 🎛️ Dashboard Views

#### Compact Dashboard
```
🤖 GitHub Copilot Dashboard (Compact) #42
════════════════════════════════════════════════════════════
⚡ TPM: 1154 ⏱️ Resp: 2193ms ✅ Success: 96.4% 💰 Burn: $10.10/h
🧠 Context: ██████████████░░░░░░░░░░░░░░░░ 48.3%
📝 Today: 25 prompts, 8,442 tokens, $0.1285
────────────────────────────────────────────────────────────
```

#### Full Dashboard
```
⚡ Real-time Metrics:
  🎯 Tokens/min: 1154
  ⏱️ Avg Response: 2193ms
  ✅ Success Rate: 96.4%
  💰 Cost Burn Rate: $10.10/hour
  🧠 Context Usage: ████████████████████████░░░░░░ 80.2%

📊 Today's Statistics:
  📝 Total Prompts: 25
  🎯 Total Tokens: 8,442
  💰 Total Cost: $0.1285
  ⏱️ Avg Response: 1.85s
  💵 Cost/Prompt: $0.005140
  🔄 Sessions: 4

📈 Activity (Last 12 Hours):
  ████████████████████ ████████████████████
  11 12 13 14 15 16 17 18 19 20 21 22
```

## 🛠️ Commands

### `copilot-status stats`
Display comprehensive usage statistics for a specific day.

```bash
copilot-status stats --date 2024-01-15 --verbose
```

**Options:**
- `[date]`: Date to analyze (YYYY-MM-DD) (default: today)
- `-d, --date <YYYY-MM-DD>`: Date to analyze (default: today)
- `-j, --json`: Output raw JSON data
- `-o, --output <path>`: Export JSON data to file (default: current directory)
- `-v, --verbose`: Show detailed breakdowns and charts

**Example Output:**
```
📊 GitHub Copilot Usage Stats for 2024-01-15

╔══════════════════════════╤═══════════╗
║ 📝 Total Prompts         │ 42        ║
║ 🎯 Tokens Used           │ 12,847    ║
║ 💰 Total Cost            │ $0.1824   ║
║ ⚡ Avg Response Time     │ 1.65s     ║
║ 💵 Cost per Prompt       │ $0.004343 ║
║ 🔄 Unique Sessions       │ 6         ║
║ 📊 Avg Prompt Tokens     │ 306       ║
║ ✨ Avg Completion Tokens │ 12,541    ║
╚══════════════════════════╧═══════════╝

🤖 Model Usage:
┌─────────────────┬──────────┬────────────┐
│ Model           │ Requests │ Percentage │
├─────────────────┼──────────┼────────────┤
│ github-copilot  │ 42       │ 100.0%     │
└─────────────────┴──────────┴────────────┘

📊 Usage Visualization:
Tokens: ███████████████████████████░░░ 12,847
Duration: 5h 53m 25s
Messages: ████░░░░░░░░░░░░░░░░░░ 42

📈 Hourly Breakdown:
Peak usage: 14:00 with 8 prompts
```

**Export Examples:**
```bash
# Export to current directory (auto-generates filename)
copilot-status stats --output ./

# Export to specific file
copilot-status stats --output ./my-stats.json

# Export to directory (creates filename automatically)
copilot-status stats --output ./reports/

# Export with date filtering
copilot-status stats 2024-01-15 --output ./january-stats.json

# Export and display JSON
copilot-status stats --output ./backup.json --json
```

**Generated File Format:**
```json
{
  "metadata": {
    "exportDate": "2025-09-28T14:30:57.547Z",
    "generatedBy": "copilot-status",
    "version": "1.0.0",
    "statsDate": "2024-01-15"
  },
  "data": {
    "date": "2024-01-15",
    "totalPrompts": 42,
    "totalTokens": 12847,
    "totalCost": 0.1824,
    ...
  }
}
```

### `copilot-status dashboard`
Launch an interactive real-time dashboard with live metrics.

```bash
copilot-status dashboard --interval 30 --compact
```

**Options:**
- `--interval <seconds>`: Refresh interval (default: 30)
- `--compact`: Use compact single-screen display

**Features:**
- 🔄 Real-time metrics updates
- 📊 Live token usage and burn rates
- 💰 Cost tracking with hourly projections
- 🧠 Context window usage visualization
- 📈 Mini activity charts
- 🎨 Color-coded performance indicators

### `copilot-status track`
Start background tracking of Copilot CLI usage.

```bash
copilot-status track --file ./usage.log --interval 60
```

**Options:**
- `--file <path>`: Log file location (default: ./copilot-status.log)
- `--interval <seconds>`: Check interval (default: 60)

**Note:** Now analyzes actual GitHub Copilot CLI session data from `~/.copilot/history-session-state/`:
- Reads and parses session files (`session_[UUID]_[timestamp].json`)
- Extracts actual token usage from chat messages and tool calls
- Calculates session duration from start/end timestamps
- Counts user messages, assistant responses, and tool executions
- Validates session data and handles corrupt/missing files gracefully

## 📂 Data Sources

### Primary Data Source: Session Files
The tracker analyzes actual GitHub Copilot CLI session data stored in:

**Location**: `~/.copilot/history-session-state/`

**File Pattern**: `session_[UUID]_[timestamp].json`

**Session Structure:**
```json
{
  "sessionId": "c43ae549-74ba-4443-80a7-2088a9d033b1",
  "startTime": "2025-09-26T15:09:16.679Z",
  "endTime": "2025-09-26T15:15:45.123Z",
  "chatMessages": [
    {
      "role": "user",
      "content": "Create a React component for a todo list",
      "timestamp": "2025-09-26T15:09:16.679Z"
    },
    {
      "role": "assistant",
      "content": "I'll help you create a React todo list component...",
      "timestamp": "2025-09-26T15:09:18.123Z"
    },
    {
      "role": "tool",
      "tool_calls": [
        {
          "id": "tooluse_abc123",
          "type": "function",
          "function": {
            "name": "bash",
            "arguments": "{\"command\": \"npm install react-icons\"}"
          }
        }
      ]
    }
  ],
  "timeline": [...]
}
```

### Legacy Data Format (for background tracking)
Usage data is stored as newline-delimited JSON (NDJSON):

```json
{
  "timestamp": "2024-01-15T14:30:45.123Z",
  "model": "gpt-4",
  "promptTokens": 156,
  "completionTokens": 234,
  "totalTokens": 390,
  "cost": 0.0117,
  "sessionId": "session_1705328445_abc123def",
  "command": "gh copilot suggest \"deploy to kubernetes\"",
  "duration": 1850
}
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js 16+ (for running the tracker)
- GitHub CLI with Copilot extension (for actual usage tracking)

### Local Installation
```bash
git clone <repository-url>
cd copilot-status
npm install
npm run build
```

### Global Installation
```bash
npm install -g copilot-status
copilot-status --help
```

### GitHub Copilot CLI Setup
```bash
# Install GitHub CLI
brew install gh  # or your package manager

# Install Copilot extension
gh extension install github/gh-copilot

# Test Copilot
gh copilot suggest "hello world in Python"
```

## 🎨 Example Workflows

### Daily Usage Review
```bash
# Check yesterday's usage
copilot-status stats --date $(date -d "yesterday" +%Y-%m-%d) --verbose

# View this week's pattern
for i in {0..6}; do
  date=$(date -d "-$i days" +%Y-%m-%d)
  echo "=== $date ==="
  copilot-status stats --date $date | grep "Total Prompts\|Total Cost"
done
```

### Live Monitoring
```bash
# Start tracking in background
copilot-status track &

# Launch dashboard in another terminal
copilot-status dashboard --compact

# View real-time logs
tail -f copilot-status.log | jq .
```

### Cost Analysis
```bash
# Generate monthly report
copilot-status stats --json | jq '{
  date: .date,
  cost: .totalCost,
  prompts: .totalPrompts,
  costPerPrompt: (.totalCost / .totalPrompts)
}'
```

## 🔧 Development

### Project Structure
```
src/
├── cli/               # Command implementations
│   ├── stats.ts      # Statistics display
│   ├── dashboard.ts  # Live dashboard
│   └── track.ts      # Background tracking
├── utils/            # Core utilities
│   ├── types.ts      # TypeScript definitions
│   ├── logger.ts     # Data persistence
│   ├── copilot-api.ts # Copilot integration (legacy)
│   └── session-processor.ts # Session data processing
└── index.ts          # Main CLI entry point
```

### Key Components

#### Session Processor (`src/utils/session-processor.ts`)
- Reads and parses GitHub Copilot CLI session files
- Implements documented token estimation algorithm (1 token ≈ 4 characters + tool call overhead)
- Calculates session duration and message statistics
- Handles data validation and error recovery
- Supports date filtering and hourly breakdown analysis

#### Token Estimation Algorithm
```javascript
estimateTokens(sessionData) {
  let totalTokens = 0;

  for (const msg of sessionData.chatMessages) {
    // Content-based estimation: 1 token ≈ 4 characters
    if (msg.content) {
      totalTokens += Math.ceil(msg.content.length / 4);
    }

    // Tool call overhead: ~10 tokens per tool call
    if (msg.tool_calls) {
      totalTokens += msg.tool_calls.length * 10;
    }
  }

  return totalTokens;
}
```

### Building
```bash
npm run build    # Compile TypeScript
npm run dev      # Watch mode for development
```

### Testing
```bash
npm test         # Run help command test
npm start stats --verbose  # Test statistics
```

## 🤝 Contributing

We welcome contributions! Here are some areas where you can help:

- **🔗 Real Integration**: Connect to actual GitHub Copilot CLI telemetry
- **📊 Enhanced Analytics**: Add more visualization types and metrics
- **💾 Storage Options**: Support for database backends (SQLite, PostgreSQL)
- **🌐 Web Dashboard**: Create a web-based dashboard version
- **📱 Notifications**: Add alerts for cost thresholds or unusual usage
- **📈 Trends**: Historical analysis and usage trend predictions

### Development Setup
```bash
git clone <repository>
cd copilot-status
npm install
npm run build
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### Phase 1: Core Features ✅
- [x] Basic usage tracking simulation
- [x] Statistics display with tables and charts
- [x] Live dashboard with real-time updates
- [x] JSON data persistence

### Phase 2: Real Integration ✅
- [x] **Actual GitHub Copilot CLI session file analysis**
- [x] **Direct reading from `~/.copilot/history-session-state/`**
- [x] **Documented token estimation algorithm implementation**
- [x] **Session duration calculation and message counting**
- [x] **Tool call analysis and error handling**

### Phase 3: Advanced Features 🔮
- [ ] Web-based dashboard
- [ ] Database storage options
- [ ] Export to CSV/Excel
- [ ] Usage predictions and trends
- [ ] Team usage aggregation
- [ ] Cost optimization recommendations
- [ ] Integration with GitHub's official billing API
- [ ] Multi-day trend analysis

---

<div align="center">

**Made with ❤️ for GitHub Copilot CLI users**

*Track your AI usage, optimize your costs, visualize your productivity*

</div>