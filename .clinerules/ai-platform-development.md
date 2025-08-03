## Brief overview
Development guidelines for AI-driven platforms using Next.js, React, TypeScript, and modern full-stack architecture. These rules focus on building scalable, type-safe applications with AI integration capabilities.

## Communication requirements
- All conversations with Cline must be conducted in Chinese
- Code comments and documentation should be in Chinese
- Error messages and user-facing text must be in Chinese
- Variable and function names should follow English conventions
- API documentation should be in Chinese

## Tech stack preferences
- Use Next.js 15 with App Router for full-stack applications
- Prefer React 19 with TypeScript for type safety
- Use Prisma ORM with PostgreSQL for database operations
- Implement Ant Design for UI components with Tailwind CSS for styling
- Use Zustand for lightweight state management
- Integrate OpenAI API for AI capabilities
- Use Zod for runtime validation and schema definition

## Project structure
- Follow Next.js App Router conventions with `src/app` directory
- Organize API routes under `src/app/api` with RESTful patterns
- Place shared utilities in `src/lib` directory
- Store state management in `src/store` directory
- Use `prisma/schema.prisma` for database models
- Generate Prisma client to `src/generated/prisma` directory

## Database design patterns
- Use descriptive model names with clear relationships
- Implement proper foreign key constraints with cascade operations
- Use enums for status fields and categorical data
- Include `createdAt` and `updatedAt` timestamps on all models
- Use `@map` directive for table naming conventions
- Implement proper indexing for query performance

## API development standards
- Use Next.js API routes with proper HTTP methods (GET, POST, PUT, DELETE)
- Implement Zod schemas for request validation
- Return consistent JSON responses with proper error handling
- Use try-catch blocks with meaningful error messages
- Include proper status codes (200, 201, 400, 404, 500)
- Implement proper TypeScript types for request/response

## Frontend component patterns
- Use functional components with React hooks
- Implement proper loading states and error handling
- Use Ant Design components consistently
- Apply Tailwind CSS for custom styling
- Create reusable components with proper TypeScript interfaces
- Implement proper form validation with Ant Design Form

## State management approach
- Use Zustand for global state with TypeScript interfaces
- Implement separate stores for different domains (projects, requirements, tasks)
- Use devtools middleware for debugging
- Keep state flat and normalized
- Implement proper loading and error states

## AI integration patterns
- Create dedicated service files for AI operations (e.g., `src/lib/openai.ts`)
- Use structured prompts with clear instructions
- Implement proper error handling for AI API calls
- Parse AI responses with fallback mechanisms
- Use TypeScript interfaces for AI response types

## Error handling standards
- Implement comprehensive try-catch blocks in API routes
- Use meaningful error messages in both English and Chinese
- Log errors to console with proper context
- Return user-friendly error messages
- Handle database connection errors gracefully

## Code organization principles
- Use barrel exports for clean imports
- Implement proper TypeScript interfaces and types
- Use descriptive variable and function names
- Keep functions focused and single-purpose
- Implement proper separation of concerns

## Development workflow
- Generate Prisma client after schema changes
- Use environment variables for configuration
- Implement proper TypeScript checking
- Use consistent naming conventions (camelCase for variables, PascalCase for components)
- Create comprehensive README documentation

## UI/UX preferences
- Use Ant Design's design system consistently
- Implement responsive design with proper breakpoints
- Use consistent color schemes and spacing
- Provide clear loading indicators and feedback
- Implement proper navigation and breadcrumbs

## Performance considerations
- Implement proper data fetching patterns with loading states
- Use React hooks efficiently to avoid unnecessary re-renders
- Optimize database queries with proper includes and selects
- Implement pagination for large data sets
- Use proper caching strategies where appropriate
