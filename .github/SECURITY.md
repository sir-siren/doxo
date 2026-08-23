# Security Policy

## Scope

Doxo is a fully client-side web app: it runs entirely in the browser, has no backend, no server-side storage, and no accounts. Game state and stats live only in your browser's `localStorage`. That limits the realistic attack surface, but reports are still welcome for things like:

- Cross-site scripting (XSS) or other injection issues
- Dependency vulnerabilities with a real exploit path in this app
- Anything that could corrupt or leak data from `localStorage` in an unexpected way

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security reports. Instead, report it privately via [GitHub's private vulnerability reporting](https://github.com/sir-siren/doxo/security/advisories/new) on this repo, or reach out directly through the contact on the [maintainer's GitHub profile](https://github.com/sir-siren).

Include as much detail as you can: steps to reproduce, affected version/commit, and potential impact.

## Response

This is a solo-maintained project, so response times aren't guaranteed, but reports will be looked at and acknowledged as soon as reasonably possible.
