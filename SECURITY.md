# Security

Report vulnerabilities privately through the repository Security tab when private reporting is available.
Otherwise contact the maintainer through their GitHub profile to arrange a private report; do not post
credentials, exploit details or personal data in a public issue.

This is an experimental local, single-player browser game. There is no account, multiplayer server,
save service or authentication system. The Vite server is a development tool and binds to loopback by default.
It is not a production hosting or internet access-control service. Static production output is in `dist/`.
Do not place secrets or private files in `public/`; those files are served and copied into the game build.

Keep dependencies current and run `npm run audit` before publication. Disclose the affected revision,
reproduction steps and expected impact privately, with secrets removed.
