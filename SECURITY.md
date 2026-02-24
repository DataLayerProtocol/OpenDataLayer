# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | Yes                |

## Reporting a Vulnerability

If you discover a security vulnerability in OpenDataLayer, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email: **security@opendatalayer.org**

Include:
- Description of the vulnerability
- Steps to reproduce
- Affected package(s) and version(s)
- Potential impact assessment

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 5 business days
- **Fix or mitigation**: Depends on severity, but we aim for:
  - Critical: 7 days
  - High: 14 days
  - Medium/Low: Next scheduled release

## Scope

The following are considered security issues for OpenDataLayer:

- **Data leakage**: Events or context data exposed to unintended consumers
- **PII exposure**: Personally identifiable information not properly redacted or hashed
- **Consent bypass**: Events delivered to consumers without required consent
- **Schema injection**: Malicious payloads that bypass validation
- **Dependency vulnerabilities**: Known CVEs in direct dependencies

The following are generally NOT security issues:

- Bugs in preview/stub adapters (Adobe, Amplitude, Piwik, Tealium)
- Documentation errors
- Feature requests for additional privacy controls

## Disclosure Policy

We follow coordinated disclosure. After a fix is released, we will:

1. Publish a security advisory on GitHub
2. Credit the reporter (unless they prefer anonymity)
3. Release patched versions of affected packages
