# Backlog & Next Steps

## Context & Vision

Zypin Selenium Framework is a minimal, zero-config Selenium testing framework for JavaScript with:
- Auto Grid management (spawn on demand)
- BDD support with predefined Cucumber steps
- Template-based project structure with monorepo support
- Compressed, maintainable codebase

### Design Decisions
- **Minimal dependencies**: Prefer native Node.js APIs
- **Zero config**: Smart defaults, no config files needed
- **Pure Selenium syntax**: Users learn real Selenium, not abstractions
- **Compressed code**: Follow coding-style.md for brevity
- **Monorepo structure**: tests/ folder with workspaces

---

## Completed Work

### Phase 0-1: Core Infrastructure ✅
- [x] Monorepo setup with npm workspaces
- [x] Coding style guide with compression techniques
- [x] CLI with template detection and folder support
- [x] Serve package (Grid + Tunnel auto-start)

### Phase 2-3: Selenium Packages ✅
- [x] @zypin-selenium/selenium (57 lines)
  - Auto Grid detection & spawn
  - Re-export selenium-webdriver
  - ENV support (ZYPIN_GRID_URL)
- [x] @zypin-selenium/selenium-bdd (132 lines)
  - 25+ predefined Cucumber steps
  - Auto hooks (Before/After)
  - Navigation, Click, Input, Select, Checkbox, Radio, Hover, Scroll
  - Assertions, Wait, Screenshot

### Templates ✅
- [x] create-zypin: Base template with workspaces
- [x] create-selenium: Basic Selenium testing
- [x] create-bdd: BDD/Cucumber testing

**Total code**: ~450 lines (highly compressed)

---

## Next Steps (Priority Order)

### 1. Template Placeholder Implementation 🔄

**create-selenium/example.test.js**:
```javascript
// TODO: Implement example Selenium test
// Requirements:
// - Import { createDriver, quit, By } from '@zypin-selenium/selenium'
// - Navigate to a public URL (e.g., google.com)
// - Demonstrate basic interactions (find element, sendKeys, click)
// - Show assertions (verify title/text)
// - Proper cleanup with quit()
```

**create-bdd/example.feature**:
```gherkin
# TODO: Implement example BDD feature
# Requirements:
# - Use predefined steps from @zypin-selenium/selenium-bdd
# - Demonstrate common scenarios:
#   - Navigation (Given I navigate to)
#   - Interactions (When I click, I type)
#   - Assertions (Then I should see)
# - Keep it simple for beginners
```

**create-bdd/support/world.js**:
```javascript
// Import predefined Cucumber steps
import '@zypin-selenium/selenium-bdd';

// TODO: Add custom step definitions if needed
// import { Given, When, Then } from '@cucumber/cucumber';
```

---

### 2. Visual Testing Package 📋

**Package: @zypin-selenium/visual**
- Baseline screenshot management
- Pixelmatch integration
- CLI commands for baseline update
- Diff image generation
- Threshold configuration

**Template: create-visual**
- Visual comparison test examples
- Baseline folder structure
- suite.json configuration example

---

### 3. Documentation 📚

**Package READMEs** (4 packages):
- @zypin-selenium/cli: Usage, commands, template flow
- @zypin-selenium/serve: Grid/Tunnel startup, ENV vars
- @zypin-selenium/selenium: API reference, examples
- @zypin-selenium/selenium-bdd: Step definitions list, custom steps

**Main README.md**:
- Quick start guide
- Architecture overview
- Package descriptions
- Template usage flow
- Examples

---

### 4. Test Command Implementation 🔧

**CLI test command** (currently placeholder):
```javascript
// src/test.js - needs full implementation
// Requirements:
// - Detect template type (selenium/bdd/visual)
// - Run appropriate test runner
// - Support path argument (file/folder)
// - Handle exit codes properly
```

**Test runners**:
- Selenium: Node execution of .test.js files
- BDD: Cucumber CLI wrapper
- Visual: Custom runner with Pixelmatch

---

### 5. Developer Experience Improvements 🎯

**Precommit hooks**:
- Auto version bump on file changes
- Lint/format code
- Validate package.json

**Error handling**:
- Better error messages
- Helpful suggestions
- Debug mode with verbose logging

**Performance**:
- Parallel test execution
- Grid connection pooling
- Faster template copying

---

### 6. Testing & Quality 🧪

**Unit tests**:
- CLI logic (template detection, version check)
- Selenium helpers
- BDD step definitions

**Integration tests**:
- Template initialization flow
- Grid auto-start behavior
- E2E scenarios

**CI/CD**:
- GitHub Actions workflow
- Automated publishing to npm
- Version management

---

## Technical Debt

### Current Limitations
1. **No error recovery**: Grid spawn failures not handled gracefully
2. **No logging**: Silent failures hard to debug
3. **Hardcoded values**: Selenium version, port numbers
4. **No cleanup**: Spawned Grid processes might leak on errors
5. **Limited validation**: Template compatibility not fully checked

### Future Enhancements
1. **Multi-browser support**: Parallel execution across browsers
2. **Cloud integration**: BrowserStack, Sauce Labs support
3. **Video recording**: Test execution recording
4. **HTML reports**: Better test result visualization
5. **Live reload**: Watch mode for development
6. **Headless by default**: Add --headed flag for debugging
7. **Mobile testing**: Appium integration

---

## Architecture Notes

### Package Dependencies
```
@zypin-selenium/cli
  └─ commander, fs-extra

@zypin-selenium/serve
  └─ (none - native only)

@zypin-selenium/selenium
  └─ selenium-webdriver
  └─ spawns: @zypin-selenium/serve

@zypin-selenium/selenium-bdd
  └─ @cucumber/cucumber
  └─ @zypin-selenium/selenium
```

### Template Flow
```
1. User: npx @zypin-selenium/create-zypin my-project
   → Creates my-project/ folder
   → Copies template files
   → Sets up workspaces

2. User: cd my-project && npx @zypin-selenium/create-selenium selenium
   → Checks tests/ exists
   → Creates tests/selenium/
   → Copies selenium template

3. User: npm install
   → Installs all workspace dependencies

4. User: cd tests/selenium && npm test
   → Runs Selenium tests
   → Auto-spawns Grid if needed
```

---

## Token Budget Remaining
~79,000 tokens (~40%)

Sufficient for:
- Template placeholder implementation
- BACKLOG.md creation (this file)
- Basic documentation
- Testing current work

Visual testing package and full documentation deferred to next session.
