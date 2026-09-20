# Security

Please do not post credentials, personal data, or an exploitable vulnerability in a public issue. Use this repository's **Security → Report a vulnerability** option when available, or contact the repository owner privately before sharing details.

Include the affected page or file, reproduction steps, impact, and a suggested fix if you have one. Never test against other visitors' data or attempt to write to the production database.

## Boundaries

- The development server binds to `127.0.0.1` and accepts only GET and HEAD. It is a local preview, not an Internet-facing application server.
- `public/` is public. Nothing placed there may contain a secret.
- The Firebase endpoint in `studio-config.js` is a public read endpoint, not an authorization credential. Production rules must deny visitor writes.
- Publishing credentials and any future model keys belong only in a trusted backend or secret store.
- Pull request checks have read-only repository permission and do not deploy or publish conversations.
- Garden saves belong to the visitor's browser. They are not uploaded by the game.

Model tools, repository-writing agents, and automatic deployments require a separate security review before they are enabled.
