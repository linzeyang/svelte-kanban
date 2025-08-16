# AI Integration Guidelines

## Core AI Features
1. **Requirement Breakdown**: Convert natural language input to structured tasks
2. **Story Optimization**: Enhance user stories with AI suggestions
3. **Processing Feedback**: Provide real-time user feedback during AI operations

## API Configuration Strategy
- Use environment variables for API configuration
- Support OpenAI-compatible APIs (OpenRouter, etc.)
- Implement 60-second timeout limits for AI operations
- Include retry logic for transient failures

## Error Handling Patterns
- Network errors: Show retry option
- API rate limits: Implement backoff strategy
- Invalid responses: Fallback to manual input
- Timeout errors: Allow extended processing time
- Authentication errors: Guide user to check API key

## User Experience Guidelines
- Accept natural language input through modal interface
- Provide real-time processing feedback with progress indicators
- Allow users to accept or reject AI suggestions
- Maintain original content structure while improving clarity
- Handle optimization failures gracefully

> **Note**: For complete AI service implementation, API routes, and data structures, see `modern-stack-guide.md`
