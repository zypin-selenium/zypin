# Zypin Selenium

Framework for Selenium-based test automation with AI assistance and zero configuration.

## For End Users

```bash
npx @zypin-selenium/cli init
```

See [templates/zypin/README.md](templates/zypin/README.md) for usage documentation.

## Monorepo Structure

**templates/zypin/** - User project template, source of truth for package versions

**packages/** - Framework packages (cli, selenium)

## For Contributors

Read [docs/contribution-guide.md](docs/contribution-guide.md) for architecture overview and contribution workflow.

Read [docs/coding-standards.md](docs/coding-standards.md) for code patterns and conventions.

## Backlog

- [ ] Add MCP tools for AI agent (openBrowser, closeBrowser, driver access)
- [ ] Add more test templates (playwright, visual regression)
- [ ] Improve error messages when Java not installed
- [ ] Add parallel test execution support
- [ ] Support custom Selenium Grid URLs
- [ ] Add screenshot on test failure
- [ ] Implement test retry mechanism
- [ ] Add HTML test report generation
