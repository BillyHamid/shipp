# ADR-001 — NestJS as the backend framework

- **Status**: Accepted
- **Date**: 2026-05-27
- **Deciders**: Architecture lead

## Context

We need a Node.js backend framework that supports:
- Modular DI (large team scaling)
- Strong TypeScript ergonomics
- First-class WebSocket integration
- CQRS / event-driven patterns
- Mature ecosystem for JWT, validation, OpenAPI, jobs

Candidates: NestJS, Fastify (bare), tRPC + Express, AdonisJS.

## Decision

Use **NestJS 10** for `apps/api`.

## Rationale

| Criterion | NestJS | Fastify bare | tRPC | AdonisJS |
|---|---|---|---|---|
| TS native | ✅ | ⚠️ | ✅ | ✅ |
| DI | ✅ | ❌ | ❌ | ✅ |
| WebSocket gateway | ✅ | manual | manual | ⚠️ |
| CQRS module official | ✅ | ❌ | ❌ | ❌ |
| Swagger generator | ✅ | manual | n/a | ⚠️ |
| Maturity | ✅ | ✅ | ⚠️ | ⚠️ |
| Team familiarity | ✅ | ✅ | ⚠️ | ❌ |

NestJS provides the structural conventions an ERP needs (modules, providers, guards, interceptors, pipes) and an excellent CQRS module aligned with our event-driven approach.

## Consequences

- Higher initial learning curve for devs unfamiliar with decorators / Angular-style modules.
- Slightly heavier than Fastify bare (overhead is irrelevant for our load profile).
- Excellent long-term maintainability with clear module boundaries.

## Alternatives rejected

- **Fastify bare**: faster, but DIY for DI, modules, guards, validation. Too much boilerplate for an ERP.
- **tRPC**: great for tightly-coupled mono-team apps, but we have 3 separate frontends + a public API; full REST + WS is more appropriate.
- **AdonisJS**: closer to Laravel ergonomics (familiar to current team), but smaller ecosystem and weaker WS / CQRS support.
