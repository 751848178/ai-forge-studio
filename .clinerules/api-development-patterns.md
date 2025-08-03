## Brief overview
API development patterns and best practices for Next.js API routes in AI-driven platforms, focusing on RESTful design, error handling, and type safety.

## API route structure
- Use Next.js App Router API conventions under `src/app/api`
- Implement proper HTTP methods (GET, POST, PUT, DELETE)
- Use dynamic routes with proper parameter handling
- Implement consistent URL patterns and naming conventions
- Group related endpoints in logical directories

## Request validation patterns
- Use Zod schemas for all request body validation
- Implement proper query parameter validation
- Validate file uploads and multipart data
- Use TypeScript interfaces for request/response types
- Implement proper error messages for validation failures

## Response formatting standards
- Return consistent JSON response structures
- Use proper HTTP status codes (200, 201, 400, 404, 500)
- Implement standardized error response format
- Include proper headers for CORS and content type
- Use pagination metadata for list endpoints

## Error handling strategies
- Implement comprehensive try-catch blocks
- Log errors with proper context and stack traces
- Return user-friendly error messages
- Handle database connection errors gracefully
- Implement proper error boundaries for unexpected failures

## Database integration patterns
- Use Prisma client with proper transaction handling
- Implement proper query optimization with includes/selects
- Use database transactions for multi-step operations
- Handle concurrent access and race conditions
- Implement proper connection pooling and cleanup

## Authentication and authorization
- Implement proper JWT token validation
- Use middleware for route protection
- Implement role-based access control
- Handle session management properly
- Secure sensitive endpoints with proper validation

## Performance optimization
- Implement proper caching strategies
- Use database query optimization
- Implement request rate limiting
- Use proper pagination for large datasets
- Optimize response payload size

## Testing patterns
- Write unit tests for API route handlers
- Implement integration tests for database operations
- Use proper mocking for external services
- Test error scenarios and edge cases
- Implement API contract testing

## Documentation standards
- Document all API endpoints with clear descriptions
- Include request/response examples
- Document error codes and messages
- Provide authentication requirements
- Include rate limiting information

## Communication requirements
- All API documentation must be in Chinese
- Error messages returned to clients should be in Chinese
- Code comments and internal documentation should be in Chinese
- Variable names should follow English conventions
- Log messages should include Chinese descriptions for debugging
