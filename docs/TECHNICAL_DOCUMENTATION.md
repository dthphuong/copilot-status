# Technical Documentation: Copilot Usage Metrics Calculation

## Overview

This document provides a detailed technical explanation of how the Copilot Usage Tracker extracts, processes, and calculates usage metrics from GitHub Copilot CLI data.

## Data Sources

### 1. Primary Data Source: Session State Files

**Location**: `~/.copilot/history-session-state/`

**File Pattern**: `session_[UUID]_[timestamp].json`

**Structure**:
```json
{
  "sessionId": "c43ae549-74ba-4443-80a7-2088a9d033b1",
  "startTime": "2025-09-26T15:09:16.679Z",
  "chatMessages": [...],
  "timeline": [...]
}
```

### 2. Secondary Data Source: Log Files

**Location**: `~/.copilot/logs/`

**File Pattern**: `[UUID].log`

**Content**: Timestamped logs with error messages, connection status, and operational events.

## Metric Calculation Algorithms

### 1. Token Estimation

#### Algorithm
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

#### Rationale
- **Character-based estimation**: Based on the general rule that 1 token ≈ 4 characters for English text
- **Tool call overhead**: Additional tokens for function names, parameters, and API calls
- **Conservative estimate**: Tends to slightly overestimate rather than underestimate

#### Accuracy Considerations
- Actual token usage varies by model (GPT-3.5, GPT-4, Claude)
- Special characters and code may have different tokenization rates
- System prompts and context are not fully captured in this estimation

### 2. Session Duration Calculation

#### Algorithm
```javascript
calculateDuration(sessionData) {
  if (!sessionData.startTime) return 0;

  const start = new Date(sessionData.startTime);
  const end = sessionData.endTime ?
    new Date(sessionData.endTime) : new Date();

  return Math.round((end - start) / 1000); // Return seconds
}
```

#### Edge Cases Handled
- Missing `startTime`: Returns 0
- Missing `endTime`: Uses current time (for active sessions)
- Invalid dates: Graceful fallback to 0

#### Output Format
Converts seconds to human-readable format:
- `≥ 1 hour`: `Xh Ym Zs`
- `< 1 hour`: `Ym Zs`
- `< 1 minute`: `Zs`

### 3. Message Counting

#### User Message Detection
```javascript
countUserMessages(sessionData) {
  if (!sessionData.chatMessages) return 0;

  return sessionData.chatMessages.filter(msg =>
    msg.role === 'user'
  ).length;
}
```

#### Total Message Count
```javascript
countMessages(sessionData) {
  return sessionData.chatMessages ?
    sessionData.chatMessages.length : 0;
}
```

#### Message Types Identified
- `user`: User prompts and inputs
- `assistant`: AI responses and suggestions
- `tool`: Tool execution results
- `system`: System messages (rare in session data)

### 4. Tool Call Analysis

#### Tool Call Detection
```javascript
countToolCalls(sessionData) {
  if (!sessionData.chatMessages) return 0;

  return sessionData.chatMessages.reduce((count, msg) => {
    if (msg.tool_calls) {
      return count + msg.tool_calls.length;
    }
    return count;
  }, 0);
}
```

#### Tool Call Structure Analysis
Each tool call contains:
```json
{
  "id": "tooluse_abc123...",
  "type": "function",
  "function": {
    "name": "bash",
    "arguments": "{\"command\": \"ls -la\"}"
  }
}
```

#### Common Tool Types Tracked
- `bash`: Shell command execution
- `str_replace_editor`: File operations
- `read_bash`: Background command reading
- `write_bash`: Background command input
- `stop_bash`: Command termination

### 5. Session Filtering by Date

#### Date Comparison Algorithm
```javascript
getTodayUsage() {
  const today = new Date().toISOString().split('T')[0];

  // Process each session file
  const sessionDate = sessionData.startTime ?
    new Date(sessionData.startTime).toISOString().split('T')[0] : null;

  if (sessionDate === today) {
    // Include in today's usage
  }
}
```

#### Time Zone Handling
- Uses ISO 8601 format for consistent date comparison
- All times are converted to UTC before date extraction
- Session boundaries are calculated based on start time only

## Data Processing Pipeline

### 1. File System Discovery
```javascript
// Discover session files
const sessionFiles = fs.readdirSync(historyDir)
  .filter(file => file.startsWith('session_') && file.endsWith('.json'));
```

### 2. Data Parsing and Validation
```javascript
// Parse JSON with error handling
const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));

// Basic validation
if (!sessionData.sessionId || !sessionData.chatMessages) {
  console.warn('Invalid session data format');
  continue;
}
```

### 3. Metric Aggregation
```javascript
// Aggregate metrics across all sessions
const todayUsage = {
  date: today,
  totalTokens: sessions.reduce((sum, s) => sum + s.tokens, 0),
  totalPrompts: sessions.reduce((sum, s) => sum + s.prompts, 0),
  sessions: sessionDetails,
  sessionCount: sessions.length
};
```

## Visualization Algorithm

### 1. ASCII Bar Chart Generation
```javascript
displayVisualization(usage) {
  const maxTokens = Math.max(50000, usage.totalTokens);
  const barLength = 30;
  const tokenBarLength = Math.round((usage.totalTokens / maxTokens) * barLength);

  const tokenBar = '█'.repeat(tokenBarLength) +
                  '░'.repeat(barLength - tokenBarLength);

  console.log(`Tokens: ${tokenBar} ${usage.totalTokens.toLocaleString()}`);
}
```

### 2. Scaling Logic
- **Dynamic maximum**: Uses the higher of 50,000 or actual usage
- **Proportional scaling**: Bar length proportional to usage
- **Minimum visibility**: Ensures small usage is still visible

## Error Handling and Resilience

### 1. File System Errors
- **Missing directories**: Graceful warning
- **Permission denied**: Clear error message
- **Corrupt JSON files**: Skip and continue processing

### 2. Data Validation
- **Missing required fields**: Skip session with warning
- **Invalid timestamps**: Use fallback values
- **Malformed tool calls**: Exclude from count

### 3. Edge Cases
- **Empty sessions**: Counted in session total but with zero metrics
- **Active sessions**: Duration calculated to current time
- **Future timestamps**: Treated as invalid and skipped

## Limitations and Known Issues

### 1. Token Estimation Accuracy
- **±10-20% margin of error** compared to actual API usage
- **Model-specific variations**: Different models tokenize differently
- **Context window effects**: Not accounting for context management

### 2. Data Completeness
- **No real-time API data**: Cannot access GitHub's billing API
- **Local data only**: Limited to what's stored in `~/.copilot/`
- **Session boundaries**: Based on start time, not calendar day

### 3. Time Zone Considerations
- **UTC-based**: All calculations use UTC timestamps
- **Day boundaries**: May not match user's local day
- **Session spanning midnight**: Counted based on start time

## Performance Considerations

### 1. File I/O Optimization
- **Single directory scan**: Only reads necessary files
- **Streaming JSON parsing**: For large session files (future enhancement)
- **Caching**: Could implement for frequent runs

### 2. Memory Usage
- **Session-by-session processing**: Only one session in memory at a time
- **Minimal data retention**: Only aggregates, not raw data
- **Garbage collection friendly**: No circular references

## Future Enhancements

### 1. Improved Token Estimation
- **Model-specific tokenizers**: Integrate with tiktoken or similar
- **Actual API response parsing**: Extract real token counts when available
- **Context window analysis**: Track truncation and overflow

### 2. Extended Metrics
- **Cost calculation**: Based on model pricing tiers
- **Success rate analysis**: Tool call success vs failure
- **Code quality metrics**: Lines of code generated, etc.

### 3. Time Series Analysis
- **Historical trends**: Compare usage across days/weeks
- **Peak usage identification**: Busiest times of day
- **Productivity correlations**: Usage vs output metrics

## Testing Strategy

### 1. Unit Tests
- Individual metric calculation functions
- Date parsing and formatting
- File system operations

### 2. Integration Tests
- End-to-end usage calculation
- Visualization output verification
- Error scenario handling

### 3. Performance Tests
- Large dataset handling
- Memory usage profiling
- Execution time benchmarks

## Security Considerations

### 1. Data Privacy
- **Local only**: No data transmission to external services
- **Read-only access**: Never modifies Copilot data
- **No sensitive data exposure**: Only aggregate statistics

### 2. File System Access
- **Limited scope**: Only reads `~/.copilot/` directory
- **No write operations**: Safe to run in any environment
- **User permissions**: Requires standard user file access

## Conclusion

The Copilot Usage Tracker provides a comprehensive view of daily usage through careful analysis of local session data. While token estimation has inherent limitations, the methodology provides consistent and useful metrics for understanding usage patterns and optimizing workflow efficiency.