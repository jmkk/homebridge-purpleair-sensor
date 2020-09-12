# PurpleAir Homebridge Accessory Plugin

This is a Homebridge accessory plugin for monitoring air quality in Apple HomeKit. It creates virtual HomeKit
air quality sensors based on real PurpleAir sensors. One setup, you can also configure home automation
based on air quality changes.

This project was inspired by [SANdood's homebridge-purpleair](https://github.com/SANdood/homebridge-purpleair),
but with a few changes:

1. Support [homebridge-config-ui-x](https://www.npmjs.com/package/homebridge-config-ui-x)
   so the entire project can be configured in its UI.
2. Support VOC sensor reading.
3. Support different averages, from realtime data, all the way to 1 hour average.
3. When the sensor is opened by HomeKit, this plugin will dynamically try to refresh the sensor values. However,
   it reuses the last updated value if it was fetched within 30 secs. This was done to prevent sending too many
   API requests to PurpleAir's servers. If the sensor is not opened by HomeKit, the plugin will update its value
   every 5 minutes by default.
4. Allow reporting AQI value instead of PM2.5 density in HomeKit. The author is more used to reading AQI value,
   but HomeKit has only a field for PM2.5 density value. The plugin allows you to configure displaying AQI value
   in the density field.
5. Work with multiple sensors.
6. Rewritten in TypeScript, with some unit tests.


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

If you want to configure manually by editing config.json file, add one entry per sensor you want to add to HomeKit
to the `accessories` section. As an example:

```json
"accessories": [
    {
        "accessory": "PurpleAirSensor",
        "sensor": "12345",
        "name": "PurpleAir Indoor Sensor",
        "averages": "realtime"
    },
    {
        "accessory": "PurpleAirSensor",
        "sensor": "54321",
        "name": "PurpleAir Outdoor Sensor",
        "averages": "10m"
    }
],
```

You can set the following fields:

- `accessory` (required): must be `PurpleAirSensor`
- `sensor` (required): the sensor number. Find the sensor number by going to <a href='https://www.purpleair.com/map'>PurpleAir's map</a> -> click on a sensor -> Look at the URL. It's the number right after 'select='.
- `name` (required): name of the sensor.
- `averages` (optional, default realtime): sensor reading averages. Supports the following values:
  - `realtime`
  - `10m`: 10 Minute Average
  - `30m`: 30 Minute Average
  - `60m`: One Hour Average
- `aqiInsteadOfDensity` (optional, default false): if true, use the PM2.5 density field to report AQI instead.
- `updateIntervalSecs` (optional, default 300): number of seconds the plugin will wait before updating the sensor value again.
- `verboseLogging` (optional, default false): if true, log all information at info level so you can see through homebridge logs what the plugin is doing without running homebridge in debug mode.


# Development Notes

A few useful commands:

```
sudo npm run watch

# publish new version
npm login
sudo npm publish
```


# Changelog

- 1.3.0: Added unit tests for parsing and ability to report averages in addition to realtime values.
- 1.2.1: Fix installation instruction.
- 1.2.0: Verbose logging option.
- 1.1.1: README updates.
- 1.1.0: Allow reporting AQI value in the field for PM2.5 density. I personally like the AQI value because I'm more used to it, but technically HomeKit only supports PM2.5 density rather than AQI.
- 1.0.2: README updates.
- 1.0.0: Initial version.
