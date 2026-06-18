<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
[specs/001-trend-intelligence-mvp/plan.md](../specs/001-trend-intelligence-mvp/plan.md)

Key implementation details:
- **Tech Stack**: NestJS (TypeScript), PostgreSQL with TimescaleDB, Python microservice (pytrends), Redis, OpenAI
- **Architecture**: Microservices with lifecycle classification engine, prediction scoring, acceleration metrics, pluggable provider pattern
- **Core Features**: Trend prediction (not detection), lifecycle stages (Seed/Emerging/Growing/Viral/Saturated/Declining), prediction scores (0-100)
- **Constitution**: All 6 principles satisfied (see plan.md for compliance checklist)
- **Data Model**: See [data-model.md](../specs/001-trend-intelligence-mvp/data-model.md)
- **API Contracts**: See [contracts/rest-api.md](../specs/001-trend-intelligence-mvp/contracts/rest-api.md)
- **Validation**: See [quickstart.md](../specs/001-trend-intelligence-mvp/quickstart.md)
<!-- SPECKIT END -->
