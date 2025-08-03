## Brief overview
Best practices and patterns for React hooks usage in AI-driven platforms, focusing on performance, maintainability, and proper state management.

## Custom hooks design patterns
- Create custom hooks for reusable logic (e.g., `useApi`, `useLocalStorage`, `useDebounce`)
- Prefix all custom hooks with "use" following React conventions
- Return objects with named properties instead of arrays for better readability
- Implement proper cleanup in useEffect to prevent memory leaks
- Use TypeScript interfaces for hook return types and parameters

## State management hooks
- Use useState for local component state only
- Prefer useReducer for complex state logic with multiple sub-values
- Implement proper state initialization with lazy initial state when expensive
- Use useCallback for event handlers to prevent unnecessary re-renders
- Use useMemo for expensive calculations and object/array dependencies

## Effect hooks best practices
- Keep useEffect focused on single concerns
- Always include proper dependency arrays to avoid stale closures
- Use cleanup functions for subscriptions, timers, and event listeners
- Separate effects for different concerns rather than combining them
- Use useLayoutEffect only when DOM measurements are needed

## Performance optimization hooks
- Use React.memo for components that receive stable props
- Implement useCallback for functions passed as props to memoized components
- Use useMemo for expensive computations and stable object references
- Avoid creating objects/arrays in render without memoization
- Use useTransition for non-urgent state updates in React 18+

## Data fetching patterns
- Create custom hooks for API calls (e.g., `useProjects`, `useRequirements`)
- Implement loading, error, and success states consistently
- Use AbortController for request cancellation in cleanup
- Cache responses appropriately to avoid unnecessary requests
- Handle race conditions with proper cleanup and state checks

## Form handling hooks
- Use controlled components with useState for form state
- Implement custom validation hooks with proper error handling
- Use useRef for uncontrolled components when performance is critical
- Create reusable form hooks for common patterns
- Integrate with Ant Design Form for complex forms

## Communication requirements
- All code comments and documentation must be in Chinese
- Variable and function names should be in English following conventions
- Error messages and user-facing text should be in Chinese
- API documentation and inline comments should be in Chinese
