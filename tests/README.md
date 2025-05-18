# Testing Astro Maintenance Integration

This directory contains the Playwright test suite for the Astro Maintenance integration. The tests verify that the integration functions correctly across different configuration options and scenarios.

## Test Structure

- `integration.spec.ts` - Main test file containing all test cases
- `astro-project/` - Base directory where temporary Astro projects are created
  - Each test creates a unique subdirectory with a UUID to prevent conflicts

## How Testing Works

The testing approach:

1. **Setup**: Creates a minimal Astro project with unique directory names for each test
2. **Configuration**: Configures different integration options between tests
3. **Verification**: Checks that the expected behavior occurs with each configuration
4. **Cleanup**: Automatically removes test projects after completion

## Test Coverage

The test suite verifies:

- Default template rendering
- Countdown functionality (future and past dates)
- Override parameter behavior
- Cookie-based persistence
- Custom logo support
- Static asset handling (allowed and blocked assets)
- Route-specific behaviors

## Running Tests

From the project root:

```bash
# Install dependencies if you haven't already
npm install

# Install Playwright browsers
npm run install:browsers

# Run all tests
npm run test

# Run tests with UI mode
npm run test:ui

# Run tests with visible browser
npm run test:headed

# Debug tests
npm run test:debug
```

## Adding New Tests

To add new tests:

1. Review the existing tests in `integration.spec.ts`
2. Add new test cases following the same pattern
3. Each test should:
   - Configure the integration with specific options
   - Verify the expected behavior
   - Clean up after itself when needed

## Notes

- Tests require Node.js to be installed
- Tests dynamically create and build an Astro project, which may take some time
- Each test gets its own unique Astro project instance to prevent conflicts
- The server is started for each test and stopped afterward
- Test projects are automatically cleaned up after completion

## Troubleshooting

If tests fail:

- Check if the server port (4321) is already in use
- Ensure you have sufficient permissions to create and delete folders
- Look at the Playwright report for detailed error information
- Directory issues:
  - If you see `ENOENT: no such file or directory, uv_cwd` errors, the test is trying to run commands in a directory that doesn't exist
  - If project creation fails, try running tests one at a time with `npm run test -- --workers=1`
  - If cleanup fails between tests, manually delete the `tests/astro-project` directory
- NPM/Node issues:
  - Try using a different Node.js version if you encounter compatibility issues
  - If NPM processes hang, you may need to terminate them manually before running tests again