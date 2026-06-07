# Contributing

GridSplat™ is a child-centered education tool. Code should be stable, readable, accessible, and easy to maintain.

## Standards

- Use TypeScript for application code.
- Keep UI controls keyboard reachable and touch friendly.
- Prefer small, focused modules over broad shared abstractions.
- Keep dependencies pinned in `package.json`.
- Do not commit secrets, tokens, or real student data.
- Keep browser-only behavior compatible with a static hosting model.

## Before Committing

Run:

```bash
npm run lint
npm test
npm run build
```

Use `npm run format` to check Prettier formatting.
