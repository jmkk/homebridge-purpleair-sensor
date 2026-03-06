# Changelog

## [3.3.0]
### Changed
- Make sensor refresh interval configurable.
- Refreshed dependencies.

## [3.2.1]
### Refreshed dependencies.
### Node.js 24 support

## [3.1.1]
### Fixed
- Fixed double "None" conversion configuration.

### Changed
- Refreshed dependencies.

## [3.1.0]
### Changed
- Refreshed dependencies.
- Verified compatibility with Homebridge v2.

## [3.0.2]
### Fixed
- Fixed stale accessory data when restored from cache.

## [3.0.1]
### Fixed
- Fixed fetching VOC for local sensors.

## [3.0.0]
### Changed
- Major rewrite converting the plugin to a Platform plugin.

### Added
- Humidity reporting.
- Temperature reporting.
- ALT-CF3 conversion.

## [2.1.0]
### Changed
- Only fetch API fields required for core plugin functionality.

## [2.0.2]
### Added
- Verbose network error logging.

## [2.0.1]
### Changed
- Refreshed dependencies.
- Now requires Node.js >= 14.8.1.

## [2.0.0]
### Changed
- Migrated to the new PurpleAir.com API for remote sensors.

### Notes
- A PurpleAir read API key is required for remote sensors.
- Local sensors can still be used without an API key.

## [1.7.0]
### Added
- Support for direct access to local sensors.

## [1.6.2]
### Added
- Support for EPA conversion.

## [1.5.0]
### Added
- Support for private sensors.

## [1.4.0]
### Added
- AQandU conversion.
- LRAPA conversion.

## [1.3.0]
### Added
- Unit tests for parsing.
- Ability to report averages in addition to realtime values.

## [1.2.0]
### Added
- Verbose logging option.

## [1.1.0]
### Added
- Option to report AQI value in the PM2.5 density field.

### Notes
- HomeKit officially supports PM2.5 density rather than AQI.

## [1.0.0]
### Added
- Initial release.
