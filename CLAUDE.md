# meetie - CLAUDE.md

## Project Overview
- **Name**: meetie
- **Type**: SaaS/비즈니스 툴
- **Level**: Dynamic (bkend.ai BaaS + Next.js Fullstack)
- **bkit Version**: v1.6.1

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: bkend.ai BaaS (REST API, MongoDB, JWT Auth)
- **State**: Zustand + TanStack Query
- **Deployment**: Vercel (frontend) + bkend.ai (backend)

## Development Methodology
- **PDCA Cycle**: Plan → Design → Do → Check → Act
- **Documents**: docs/ folder (plan, design, analysis, report)
- **QA**: Zero Script QA (Docker log-based)

## Code Conventions
- TypeScript strict mode
- Functional components only (no class components)
- Custom hooks for business logic
- `bkend.ts` client for all API calls
- Environment variables via `.env.local`

## Project Structure
```
src/
├── app/           # Next.js App Router
│   ├── (auth)/    # Auth routes (login, register)
│   └── (main)/    # Protected routes (dashboard, settings)
├── components/
│   ├── ui/        # Reusable UI components
│   └── features/  # Feature-specific components
├── hooks/         # Custom React hooks
├── lib/           # Utilities (bkend.ts client)
├── stores/        # Zustand stores
└── types/         # TypeScript type definitions
docs/
├── 01-plan/       # PDCA Plan documents
├── 02-design/     # Data model, API spec
├── 03-analysis/   # Gap analysis
└── 04-report/     # Completion reports
```

## bkend.ai Configuration
- MCP: `.mcp.json` (HTTP transport)
- API Base: `https://api.bkend.ai/v1`
- Project ID: `NEXT_PUBLIC_BKEND_PROJECT_ID` (set in .env.local)

## Key Rules
1. Always create Plan/Design docs before implementing new features
2. Run gap analysis after implementation (target: ≥90% match)
3. Use `bkend.ts` client for all API calls - never call API directly
4. Protected routes must use `ProtectedRoute` component
5. Never commit `.env.local` or sensitive credentials
