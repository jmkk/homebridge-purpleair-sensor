/**
 * This is the name of the platform that users will use to register the plugin in the Homebridge config.json
 */
export const PLATFORM_NAME = 'PurpleAirSensor';

/**
 * This must match the name of your plugin as defined the package.json
 */
export const PLUGIN_NAME = 'homebridge-purpleair-sensor';


/**
 * This is the default update interval in seconds - 5 minutes.
 */
export const DEFAULT_UPDATE_INTERVAL_SECS = 5 * 60;

/**
 * Never update more frequently than the following value - 30 seconds.
 */
export const MIN_UPDATE_INTERVAL_SECS = 30;

/**
 * Timeout after which to consider a sensor or API failed - 1 hour.
 */
export const SENSOR_FAILURE_TIMEOUT_SECS = 60 * 60;

/**
 * The base URL for the PurpleAir API.
 */
export const PURPLEAIR_API_BASE_URL = 'https://api.purpleair.com/v1/sensors';
