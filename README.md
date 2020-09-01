# PurpleAir Homebridge Accessory Plugin

This is a Homebridge accessory plugin for monitoring air quality in Apple HomeKit. It creates virtual HomeKit
air quality sensors based on real PurpleAir sensors. One setup, you can also configure home automation
based on air quality changes.

This project was inspired by [SANdood's homebridge-purpleair](https://github.com/SANdood/homebridge-purpleair),
but with a few changes:

1. Support [homebridge-config-ui-x](https://www.npmjs.com/package/homebridge-config-ui-x)
   so the entire project can be configured in its UI.
2. Support VOC sensor reading.
3. When the sensor is opened by HomeKit, this plugin will dynamically try to refresh the sensor values. However,
   it reuses the last updated value if it was fetched within 30 secs. This was done to prevent sending too many
   API requests to PurpleAir's servers. If the sensor is not opened by HomeKit, the plugin will update its value
   every 5 minutes by default.
4. Allows reporting AQI value instead of PM2.5 density in HomeKit. The author is more used to reading AQI value,
   but HomeKit has only a field for PM2.5 density value. The plugin allows you to configure displaying AQI value
   in the density field.
5. Rewritten in TypeScript.


# Installation

The easiest way to install is through [homebridge-config-ui-x](https://www.npmjs.com/package/homebridge-config-ui-x) UI.
Search for `homebridge-purpleair-sensor` and just click install. Once done, configure it using the UI, and restart homebridge.

If you want to install manually via the command line, run the following:

```
sudo npm install -g --unsafe-perm homebridge  # remove sudo if your setup does not require it

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
        "name": "PurpleAir Indoor Sensor"
    },
    {
        "accessory": "PurpleAirSensor",
        "sensor": "54321",
        "name": "PurpleAir Outdoor Sensor"
    }
],
```

You can set the following fields:

- `accessory` (required): must be `PurpleAirSensor`
- `sensor` (required): the sensor number. Find the sensor number by going to <a href='https://www.purpleair.com/map'>PurpleAir's map</a> -> click on a sensor -> 'Get This Widget' -> 'JSON' and look at the URL. It's the number right after 'show'.
- `name` (required): name of the sensor.
- `aqiInsteadOfDensity` (optional, default false): If true, use the PM2.5 density field to report AQI instead.
- `updateIntervalSecs` (optional, default 300): number of seconds the plugin will wait before updating the sensor value again.


# Changelog

- 1.1.1: README updates.
- 1.1.0: Allow reporting AQI value in the field for PM2.5 density. I personally like the AQI value because I'm more used to it, but technically HomeKit only supports PM2.5 density rather than AQI.
- 1.0.2: README updates.
- 1.0.0: Initial version.
