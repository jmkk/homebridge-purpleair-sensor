# PurpleAir Homebridge Accessory Plugin

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

This is a Homebridge accessory plugin for monitoring air quality in Apple HomeKit. It creates virtual HomeKit
air quality sensors based on real PurpleAir sensors. Once setup, you can also configure home automation
based on air quality changes. It supports both using PurpleAir API (for sensors you do not own),
and also connecting to your own sensors directly on your home network.

This project was inspired by [SANdood's homebridge-purpleair](https://github.com/SANdood/homebridge-purpleair),
but with a few changes:

1. Support [homebridge-config-ui-x](https://www.npmjs.com/package/homebridge-config-ui-x)
   so the entire project can be configured in its UI.
2. Support private sensors.
3. Support VOC sensor reading.
4. Support different averages, from realtime data, all the way to 1 hour average.
5. Sensor data gets refreshed every 5 minutes.
6. Allow reporting AQI value instead of PM2.5 density in HomeKit. The author is more used to reading AQI value,
   but HomeKit has only a field for PM2.5 density value. The plugin allows you to configure displaying AQI value
   in the density field.
7. Work with multiple sensors.
8. Rewritten in TypeScript, with some unit tests.
9. Optionally reports humidity and temperature in addition to air quality.
10. Optionally supports local sensors on home network (no need for API read key).


# Installation

The easiest way to install is through [homebridge-config-ui-x](https://www.npmjs.com/package/homebridge-config-ui-x) UI.
Search for `homebridge-purpleair-sensor` and just click install. Once done, configure it using the UI, and restart homebridge.

If you want to install manually via the command line, run the following:

```
sudo npm install -g --unsafe-perm homebridge-purpleair-sensor

sudo service homebridge restart  # replace this with the command you need to restart homebridge
```


# Configuration

You can configure this plugin using [homebridge-config-ui-x](https://www.npmjs.com/package/homebridge-config-ui-x) UI.


# Development Notes

A few useful commands:

```
sudo npm run watch

# publish new version
npm login
sudo npm publish
```


# Changelog
- 3.1.1: Fixed double "None" conversion config, refreshed dependencies
- 3.1.0: Refreshed dependencies and verified Homebridge v2 compatibility
- 3.0.2: Fixed stale accessory data when restored from cache
- 3.0.1: Fixed fetching VOC for local sensors
- 3.0.0: Major rewwrite to convert to the Platform plugin. Added humidity and temperatures reporting. Added ALT-CF3 conversion.
- 2.1.0: Only fetch API fields needed for the core functionality of the plugin.
- 2.0.2: Verbose network error logging.
- 2.0.1: Refreshing dependencies, now requiring node >= 14.8.1
- 2.0.0: Use the new PurpleAir.com API for remote sensors. Note: you need to get your read API key from PurpleAir to use the new API, or you can choose to use local sensors without the API key.
- 1.7.0: Support for direct access to local sensors
- 1.6.2: Support EPA conversion.
- 1.5.0: Support private sensors.
- 1.4.0: Add AQandU and LRAPA conversions.
- 1.3.0: Added unit tests for parsing and ability to report averages in addition to realtime values.
- 1.2.0: Verbose logging option.
- 1.1.0: Allow reporting AQI value in the field for PM2.5 density. I personally like the AQI value because I'm more used to it, but technically HomeKit only supports PM2.5 density rather than AQI.
- 1.0.0: Initial version.
