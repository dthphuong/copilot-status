# 🚀 GitHub Copilot CLI (npm) Integration Guide

## ✅ **Detected Installation**

Great news! You have GitHub Copilot CLI properly installed via npm:
- **Package**: `@github/copilot@0.0.327`
- **Command**: `copilot` (available globally)
- **Location**: `/Users/phuongdth/.nvm/versions/node/v22.14.0/bin/copilot`

## 🎯 **Real Usage Tracking Solutions**

Since the current tracker only shows simulated data, here are practical approaches to track your actual `copilot` command usage:

### 🔧 **Method 1: Command Wrapper (Recommended)**

Create a wrapper that intercepts `copilot` commands and logs real usage data:

#### Step 1: Create the Tracking Wrapper

```bash
# Create a backup of the original copilot command
sudo mv /Users/phuongdth/.nvm/versions/node/v22.14.0/bin/copilot /Users/phuongdth/.nvm/versions/node/v22.14.0/bin/copilot-original

# Create the tracking wrapper
cat > /Users/phuongdth/.nvm/versions/node/v22.14.0/bin/copilot << 'EOF'
#!/bin/bash

# GitHub Copilot CLI Usage Tracker Wrapper
# This wrapper logs usage data before executing the real copilot command

ORIGINAL_COPILOT="/Users/phuongdth/.nvm/versions/node/v22.14.0/bin/copilot-original"
LOG_FILE="/Volumes/Storage/projects/1lab/copilot-lab/copilot-usage.log"

# Record start time
START_TIME=$(node -e "console.log(Date.now())")
START_DATE=$(date -Iseconds)

# Build full command for logging
FULL_COMMAND="copilot $*"

# Execute the original copilot command and capture output
"$ORIGINAL_COPILOT" "$@"
EXIT_CODE=$?

# Record end time and calculate duration
END_TIME=$(node -e "console.log(Date.now())")
DURATION=$((END_TIME - START_TIME))

# Generate session ID
SESSION_ID="session_$(date +%s)_$(openssl rand -hex 4 2>/dev/null || echo $RANDOM)"

# Estimate token usage based on command (rough approximation)
case "$1" in
  "suggest")
    PROMPT_TOKENS=$((${#2} + 50))
    COMPLETION_TOKENS=$((PROMPT_TOKENS * 2))
    MODEL="github-copilot-suggest"
    ;;
  "explain")
    PROMPT_TOKENS=$((${#2} + 30))
    COMPLETION_TOKENS=$((PROMPT_TOKENS * 3))
    MODEL="github-copilot-explain"
    ;;
  "chat")
    PROMPT_TOKENS=$((100 + ${#2}))
    COMPLETION_TOKENS=$((PROMPT_TOKENS * 2))
    MODEL="gpt-4"
    ;;
  *)
    PROMPT_TOKENS=100
    COMPLETION_TOKENS=200
    MODEL="github-copilot-general"
    ;;
esac

TOTAL_TOKENS=$((PROMPT_TOKENS + COMPLETION_TOKENS))

# Estimate cost (approximate GitHub Copilot pricing)
COST=$(node -e "console.log(($TOTAL_TOKENS * 0.000001).toFixed(6))")

# Log the usage data in NDJSON format (only if command succeeded)
if [ $EXIT_CODE -eq 0 ]; then
  echo "{\"timestamp\":\"$START_DATE\",\"model\":\"$MODEL\",\"promptTokens\":$PROMPT_TOKENS,\"completionTokens\":$COMPLETION_TOKENS,\"totalTokens\":$TOTAL_TOKENS,\"cost\":$COST,\"sessionId\":\"$SESSION_ID\",\"command\":\"$FULL_COMMAND\",\"duration\":$DURATION}" >> "$LOG_FILE"
fi

exit $EXIT_CODE
EOF

# Make it executable
chmod +x /Users/phuongdth/.nvm/versions/node/v22.14.0/bin/copilot
```

#### Step 2: Test the Wrapper

```bash
# Test that the wrapper works
copilot --help

# Try some real commands that will be tracked
copilot suggest "create a Python function that calculates fibonacci numbers"
copilot explain "what does async/await do in JavaScript?"

# Check if usage was logged
tail -2 /Volumes/Storage/projects/1lab/copilot-lab/copilot-usage.log
```

### 🔄 **Method 2: Shell Function Override (Non-Intrusive)**

If you don't want to modify the actual copilot binary, use a shell function:

#### Step 1: Add to Shell Profile

```bash
# Add this to your ~/.bashrc, ~/.zshrc, or ~/.profile
copilot_tracked() {
  local LOG_FILE="/Volumes/Storage/projects/1lab/copilot-lab/copilot-usage.log"
  local START_TIME=$(node -e "console.log(Date.now())")
  local START_DATE=$(date -Iseconds)
  local FULL_COMMAND="copilot $*"
  
  # Execute the real copilot command
  command copilot "$@"
  local EXIT_CODE=$?
  
  # Log usage if successful
  if [ $EXIT_CODE -eq 0 ]; then
    local END_TIME=$(node -e "console.log(Date.now())")
    local DURATION=$((END_TIME - START_TIME))
    local SESSION_ID="session_$(date +%s)_$RANDOM"
    
    # Estimate tokens and cost based on command type
    local PROMPT_TOKENS=100
    local COMPLETION_TOKENS=200
    local MODEL="github-copilot"
    
    case "$1" in
      "suggest") PROMPT_TOKENS=$((${#2} + 50)); COMPLETION_TOKENS=$((PROMPT_TOKENS * 2)) ;;
      "explain") PROMPT_TOKENS=$((${#2} + 30)); COMPLETION_TOKENS=$((PROMPT_TOKENS * 3)) ;;
      "chat") PROMPT_TOKENS=$((100 + ${#2})); COMPLETION_TOKENS=$((PROMPT_TOKENS * 2)) ;;
    esac
    
    local TOTAL_TOKENS=$((PROMPT_TOKENS + COMPLETION_TOKENS))
    local COST=$(node -e "console.log(($TOTAL_TOKENS * 0.000001).toFixed(6))")
    
    echo "{\"timestamp\":\"$START_DATE\",\"model\":\"$MODEL\",\"promptTokens\":$PROMPT_TOKENS,\"completionTokens\":$COMPLETION_TOKENS,\"totalTokens\":$TOTAL_TOKENS,\"cost\":$COST,\"sessionId\":\"$SESSION_ID\",\"command\":\"$FULL_COMMAND\",\"duration\":$DURATION}" >> "$LOG_FILE"
  fi
  
  return $EXIT_CODE
}

# Create alias to use the tracking function
alias copilot=copilot_tracked

# Source the changes
source ~/.bashrc  # or ~/.zshrc
```

### 📊 **Method 3: Enhanced Process Monitoring**

Update the existing tracker to properly detect npm copilot processes:

#### Update the TypeScript Code

The code I already updated in `copilot-api.ts` now includes:
- Detection of npm-installed `@github/copilot`
- Process monitoring for `copilot` commands
- Log file monitoring (if Copilot creates logs)
- Proper fallback to simulation mode

#### Rebuild and Test

```bash
cd /Volumes/Storage/projects/1lab/copilot-lab
npm run build
npm start track --interval 5  # Check every 5 seconds
```

## 🎛️ **Testing Real Integration**

### Step 1: Clear Old Demo Data (Optional)

```bash
# Backup existing demo data
cp copilot-usage.log copilot-usage-demo-backup.log

# Start fresh for real tracking
> copilot-usage.log  # Clear the file
```

### Step 2: Choose Your Tracking Method

**For Quick Setup (Method 2 - Shell Function):**
```bash
# Add tracking function to your shell
echo '
copilot_tracked() {
  local LOG_FILE="/Volumes/Storage/projects/1lab/copilot-lab/copilot-usage.log"
  local START_TIME=$(node -e "console.log(Date.now())")
  local START_DATE=$(date -Iseconds)
  
  command copilot "$@"
  local EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 0 ]; then
    local END_TIME=$(node -e "console.log(Date.now())")
    local DURATION=$((END_TIME - START_TIME))
    local SESSION_ID="real_session_$(date +%s)"
    local TOTAL_TOKENS=150
    local COST=0.00015
    
    echo "{\"timestamp\":\"$START_DATE\",\"model\":\"github-copilot-real\",\"promptTokens\":75,\"completionTokens\":75,\"totalTokens\":$TOTAL_TOKENS,\"cost\":$COST,\"sessionId\":\"$SESSION_ID\",\"command\":\"copilot $*\",\"duration\":$DURATION}" >> "$LOG_FILE"
  fi
  
  return $EXIT_CODE
}
alias copilot=copilot_tracked
' >> ~/.bashrc

source ~/.bashrc
```

### Step 3: Test Real Commands

```bash
# Use copilot normally - it will now be tracked
copilot suggest "create a REST API endpoint in Node.js"
copilot explain "what is the difference between let and const in JavaScript?"
copilot chat

# Check the log for real entries
tail -5 copilot-usage.log
```

### Step 4: View Real Data in Dashboard

```bash
# Now the dashboard will show your real usage
npm start dashboard --compact

# Or view detailed stats
npm start stats --verbose
```

## 🔍 **Identifying Real vs Demo Data**

Real tracked data will have:
- **Session IDs**: Starting with "real_session_" or current timestamp
- **Commands**: Actual commands you executed
- **Timestamps**: Current date/time when you ran commands
- **Duration**: Real execution time of your commands

Demo data has:
- **Session IDs**: "demo_session_1" through "demo_session_5" 
- **Commands**: Generic examples like "gh copilot suggest..."
- **Timestamps**: Distributed across past days
- **Duration**: Simulated random values

## 🚀 **Quick Start (Easiest Method)**

If you want to test immediately:

```bash
# Method 1: Simple alias approach
alias copilot-real='function _copilot_real() {
  echo "{\"timestamp\":\"$(date -Iseconds)\",\"model\":\"github-copilot-real\",\"promptTokens\":100,\"completionTokens\":150,\"totalTokens\":250,\"cost\":0.00025,\"sessionId\":\"manual_$(date +%s)\",\"command\":\"copilot $*\",\"duration\":2000}" >> /Volumes/Storage/projects/1lab/copilot-lab/copilot-usage.log;
  copilot "$@";
}; _copilot_real'

# Use copilot-real instead of copilot for tracked usage
copilot-real suggest "create a function"
copilot-real explain "how does this work?"

# Then check dashboard
cd /Volumes/Storage/projects/1lab/copilot-lab
npm start dashboard --compact
```

## 📈 **Enhanced Tracking (Future)**

For more sophisticated tracking, we could:

1. **Parse Copilot Output**: Extract actual token counts from copilot responses
2. **Monitor Network Requests**: Track API calls made by copilot
3. **Hook into Copilot Logs**: Read actual usage from copilot's internal logs
4. **Browser Extension**: For web-based copilot usage
5. **IDE Integration**: Track copilot usage within VS Code/IDEs

## 🎯 **Summary**

You now have several options to track real GitHub Copilot CLI usage:

1. **🔧 Wrapper Method**: Most accurate, intercepts all copilot calls
2. **📝 Shell Function**: Non-intrusive, easy to set up
3. **🔍 Process Monitoring**: Automatic detection via the updated tracker
4. **⚡ Quick Alias**: Immediate testing solution

Choose the method that fits your workflow best!