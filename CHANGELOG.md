# Changelog

All notable changes to the Astro Maintenance integration will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### [2.0.0] - 2025-01-XX

### Changed

- **BREAKING CHANGE**: Custom Handlebars templates must now be imported using `?raw` suffix and passed as content instead of file paths
- Removed filesystem-based template loading for improved serverless compatibility
- Updated template detection logic to differentiate between template content and redirect paths

### Added

- Support for imported template content via `import template from './path.hbs?raw'`
- Better error handling and fallback behavior for custom templates
- Warning messages for deprecated file path usage
- Migration guide documentation

### Removed

- **BREAKING CHANGE**: File path-based custom templates (e.g., `"./templates/custom.hbs"`) are no longer supported
- Filesystem dependencies (`fs`, `path`) removed from runtime

### [1.2.0] - 2025-05-29

### Added

- Add dark mode support
- Add support for social links

### [1.1.1] - 2025-05-26

### Fixed

- Support for astro add with default options

## [1.1.0] - 2025-05-20

### Added

- Environment variables support for all configuration options
  - All options can now be set using environment variables with the `MAINTENANCE_` prefix
  - Environment variables take precedence over programmatically defined options
  - Detailed documentation added for all supported environment variables
- Comprehensive test suite for environment variables functionality

### Changed

- Made `enabled` option optional with a default value of `true`
- Improved documentation with environment variables section and examples

## [1.0.1] - 2025-04-15

### Fixed

- Adapter compatibility issues by migrating to Astro's middleware API
- Integration now works consistently across all Astro deployment environments

### Changed

- Refactored internal implementation to use middleware instead of server hooks
- Enhanced error handling and logging

## [1.0.0] - 2025-04-01

### Added

- Initial release of the Astro Maintenance integration
- Core maintenance page functionality with three built-in templates:
  - Simple maintenance page
  - Countdown timer
  - Under construction
- Customization options for title, description, logo, and contact information
- Override parameter for bypassing maintenance mode
- Support for custom templates via Handlebars
- Integration with Astro's configuration system
