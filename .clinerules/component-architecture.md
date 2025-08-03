## Brief overview
Component architecture patterns and best practices for building scalable React components in AI-driven platforms with proper TypeScript integration.

## Component structure patterns
- Use functional components with TypeScript interfaces for props
- Implement proper component composition over inheritance
- Create atomic components that serve single purposes
- Use compound components for complex UI patterns
- Implement proper component hierarchy with clear data flow

## Props and interface design
- Define explicit TypeScript interfaces for all component props
- Use optional props with default values when appropriate
- Implement proper prop validation with TypeScript
- Avoid prop drilling by using context or state management
- Use generic types for reusable components

## Component organization
- Group related components in feature-based directories
- Use index.ts files for clean exports and barrel patterns
- Separate presentational and container components
- Create shared components in common directories
- Implement proper component naming conventions

## Styling patterns
- Use Ant Design components as base building blocks
- Apply Tailwind CSS for custom styling and spacing
- Implement consistent design tokens and color schemes
- Use CSS modules or styled-components for component-specific styles
- Create reusable style utilities and helper classes

## Event handling patterns
- Use useCallback for event handlers to prevent re-renders
- Implement proper event delegation for performance
- Handle async operations with proper loading states
- Use custom hooks for complex event logic
- Implement proper error boundaries for error handling

## Data flow patterns
- Pass data down through props and lift state up when needed
- Use context for deeply nested component communication
- Implement proper loading and error states for async data
- Use optimistic updates for better user experience
- Cache data appropriately to avoid unnecessary requests

## Accessibility patterns
- Implement proper ARIA attributes for screen readers
- Use semantic HTML elements when possible
- Ensure proper keyboard navigation support
- Implement proper focus management
- Use Ant Design's built-in accessibility features

## Testing patterns
- Write unit tests for component logic and rendering
- Use React Testing Library for component testing
- Implement proper mocking for external dependencies
- Test component interactions and user flows
- Use snapshot testing for UI regression prevention

## Performance optimization
- Use React.memo for expensive components
- Implement proper key props for list rendering
- Use lazy loading for code splitting
- Optimize bundle size with proper imports
- Implement proper image optimization and loading

## Communication requirements
- All component documentation must be in Chinese
- Component prop descriptions should be in Chinese
- Error messages and user-facing text must be in Chinese
- Code comments explaining component logic should be in Chinese
