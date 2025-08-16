# Coding Standards and Best Practices

## Code Style and Formatting

- Use ESLint and Prettier configurations already set up in the project
- Follow consistent naming conventions:
  - Components: PascalCase (e.g., `KanbanBoard.svelte`)
  - Variables/functions: camelCase (e.g., `taskItems`, `handleDragStart`)
  - Constants: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS`)
  - CSS classes: kebab-case following TailwindCSS conventions

## TypeScript Guidelines

- Define interfaces for all data structures
- Use proper typing for component props
- Implement type guards for API responses
- Avoid `any` type - use `unknown` when necessary
- Export types from dedicated type files

## Error Handling Standards

- Implement try-catch blocks for async operations
- Provide user-friendly error messages
- Log errors appropriately for debugging
- Handle network failures gracefully
- Validate user inputs before processing

## Performance Considerations

- Keep drag operations under 300ms response time
- Optimize animations for 60fps performance
- Use proper key attributes for list rendering
- Implement lazy loading where appropriate
- Minimize bundle size through tree shaking

> **Note**: For complete Svelte 5, SvelteKit 2, and modern framework patterns, see `modern-stack-guide.md`
