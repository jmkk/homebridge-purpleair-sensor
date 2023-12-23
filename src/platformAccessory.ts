import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import axios, { AxiosError } from 'axios';
import { PurpleAirPlatform } from './platform';
import { DEFAULT_UPDATE_INTERVAL_SECS, PURPLEAIR_API_BASE_URL, MIN_UPDATE_INTERVAL_SECS, SENSOR_FAILURE_TIMEOUT_SECS } from './settings';
import { parsePurpleAirJson } from './SensorReading';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class PurpleAirPlatformAccessory {
  private service: Service;
  private humidity?: Service;
  private temperature?: Service;

  constructor(
    private readonly platform: PurpleAirPlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'PurpleAir')
      .setCharacteristic(this.platform.Characteristic.Model, 'PurpleAir')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.sensor.sensorID || 'n/a');

    this.platform.log.debug(this.accessory.displayName + ': ' + 'Configuring air quality service');
    this.service = this.accessory.getService(this.platform.Service.AirQualitySensor)
      || this.accessory.addService(this.platform.Service.AirQualitySensor);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
    this.service.getCharacteristic(this.platform.Characteristic.StatusActive)
      .onGet(this.getStatusActive.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.AirQuality)
      .onGet(this.getAirQuality.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.PM2_5Density)
      .onGet(this.getPM2_5Density.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.VOCDensity)
      .onGet(this.getVOCDensity.bind(this));
    if (this.accessory.context.sensor.humidity) {
      this.service.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
        .onGet(this.getCurrentRelativeHumidity.bind(this));
    } else {
      const humidityCharacteristic = this.service.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity);
      if (humidityCharacteristic) {
        this.service.removeCharacteristic(humidityCharacteristic);
      }
    }

    const humidityService = this.accessory.getService(this.platform.Service.HumiditySensor);
    if (this.accessory.context.sensor.humidity) {
      this.debugLog('Configuring humidity service');
      this.humidity = humidityService || this.accessory.addService(this.platform.Service.HumiditySensor);
      this.humidity.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
      this.humidity.getCharacteristic(this.platform.Characteristic.StatusActive).
        onGet(this.getStatusActive.bind(this));
      this.humidity.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
        .onGet(this.getCurrentRelativeHumidity.bind(this));
    } else {
      this.debugLog('Skipping configuring humidity service');
      if (humidityService) {
        this.platform.log.debug('Removing humidity service');
        this.accessory.removeService(humidityService);
        this.humidity = undefined;
      }
    }

    const temperatureService = this.accessory.getService(this.platform.Service.TemperatureSensor);
    if (this.accessory.context.sensor.temperature) {
      this.debugLog('Configuring temperature service');
      this.temperature = temperatureService || this.accessory.addService(this.platform.Service.TemperatureSensor);
      this.temperature.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
      this.temperature.getCharacteristic(this.platform.Characteristic.StatusActive).
        onGet(this.getStatusActive.bind(this));
      this.temperature.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
        .onGet(this.getCurrentTemperature.bind(this));
    } else {
      this.debugLog('Skipping configuring temperature service');
      if (temperatureService) {
        this.debugLog('Removing temperature service');
        this.accessory.removeService(temperatureService);
        this.temperature = undefined;
      }
    }

    const interval = DEFAULT_UPDATE_INTERVAL_SECS * 1000;
    this.infoLog('Scheduling updates every ' + interval/1000/60 + ' minutes');
    setInterval(() => {
      this.update();
    }, interval);

    this.update();
  }

  debugLog(message: string) {
    this.platform.log.debug(this.accessory.displayName + ': ' + message);
  }

  infoLog(message: string) {
    this.platform.log.info(this.accessory.displayName + ': ' + message);
  }

  errorLog(message: string) {
    this.platform.log.error(this.accessory.displayName + ': ' + message);
  }

  async getAirQuality(): Promise<CharacteristicValue> {
    this.debugLog('getAirQuality');

    const lastReading = this.accessory.context.lastReading;
    if (lastReading !== undefined && lastReading.airQualityHomekitReading !== undefined) {
      return lastReading.airQualityHomekitReading;
    }

    return this.platform.Characteristic.AirQuality.UNKNOWN;
  }

  async getPM2_5Density(): Promise<CharacteristicValue> {
    this.debugLog('getPM2_5Density');

    const lastReading = this.accessory.context.lastReading;
    if (lastReading !== undefined) {
      if (this.platform.config.aqiInsteadOfDensity) {
        return lastReading.aqi || 0;
      } else {
        return lastReading.pm25 || 0;
      }
    }

    return 0;
  }

  async getVOCDensity(): Promise<CharacteristicValue> {
    this.debugLog('getVOCDensity');

    const lastReading = this.accessory.context.lastReading;
    if (lastReading !== undefined) {
      return lastReading.voc || 0;
    }

    return 0;
  }

  async getCurrentRelativeHumidity(): Promise<CharacteristicValue> {
    this.debugLog('getCurrentRelativeHumidity');

    const lastReading = this.accessory.context.lastReading;
    if (lastReading !== undefined) {
      return lastReading.humidity || 0;
    }

    return 0;
  }

  async getCurrentTemperature(): Promise<CharacteristicValue> {
    this.debugLog('getCurrentTemperature');

    const lastReading = this.accessory.context.lastReading;
    if (lastReading !== undefined) {
      return lastReading.temperature || 0;
    }

    return 0;
  }

  async update() {
    const lastReading = this.accessory.context.lastReading;

    if (lastReading !== undefined) {
      if (lastReading.updateTimeMs > Date.now() - MIN_UPDATE_INTERVAL_SECS * 1000) {
        this.infoLog('Skipping a fetch because the last update was ' +
          (Date.now() - lastReading.updateTimeMs) / 1000 + ' seconds ago');
        return;
      } else {
        this.infoLog('Refreshing sensor readings. Last update was ' +
        (Date.now() - lastReading.updateTimeMs) / 1000 + ' seconds ago');
      }
    } else {
      this.infoLog('Refreshing sensor readings. No previous update.');
    }

    const sensorConfig = this.accessory.context.sensor;
    const platformConfig = this.platform.config;

    let url = PURPLEAIR_API_BASE_URL;
    let usesLocalSensor = false;
    const axiosInstance = axios.create();

    if (sensorConfig.localIPAddress !== undefined) {
      url = 'http://' + sensorConfig.localIPAddress + '/json';
      usesLocalSensor = true;
    } else {
      if (sensorConfig.sensor) {
        url += '/' + sensorConfig.sensor;
      } else {
        this.errorLog('No sensor ID or local IP address configured. Check your configuration.');
        return;
      }

      if (platformConfig.apiReadKey) {
        axiosInstance.defaults.headers.common['X-API-Key'] = platformConfig.apiReadKey;
      } else {
        this.errorLog('No API Read Key or local IP address configured. Check your configuration.');
        return;
      }
    }

    axiosInstance.interceptors.request.use((request) => {
      this.debugLog(`Fetching url ${request.url} with params ${JSON.stringify(request.params)}`);
      return request;
    });

    try {
      let fields = 'voc,pm2.5,pm2.5_cf_1,pm2.5_10minute,pm2.5_30minute,pm2.5_60minute';
      if (sensorConfig.humidity) {
        fields += ',humidity';
      }

      if (sensorConfig.temperature) {
        fields += ',temperature';
      }

      if (platformConfig.conversion === 'ALT-CF3') {
        fields += ',pm2.5_alt';
      }

      const request_config = {
        params: {
          read_key: sensorConfig.key,
          fields: fields,
        },
      };

      const resp = await axiosInstance.get(url, request_config);

      if (!usesLocalSensor && resp.data.sensor === undefined) {
        throw new Error('No sensor found with ID ${this.sensor}');
      }

      this.accessory.context.lastReading = parsePurpleAirJson(resp.data, platformConfig.averages,
        platformConfig.conversion, usesLocalSensor);

      this.infoLog(`Received new sensor reading ${this.accessory.context.lastReading}`);
      this.updateHomeKit(platformConfig.aqiInsteadOfDensity);
    } catch (err) {
      if (err instanceof AxiosError && err.response) {
        this.errorLog(`Error fetching ${url}: ${JSON.stringify(err.response.data)}`);
      } else {
        this.errorLog(`Error fetching ${url}: ${err}`);
      }
    }
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getStatusActive(): Promise<CharacteristicValue> {
    let activeResult = false;

    if (this.accessory.context.lastReading) {
      const active = this.accessory.context.lastReading.updateTimeMs > Date.now() - MIN_UPDATE_INTERVAL_SECS * 1000;
      if (active) {
        activeResult = true;
      } else {
        const serviceError = this.accessory.context.lastReading.updateTimeMs > Date.now() - SENSOR_FAILURE_TIMEOUT_SECS * 1000;
        if (serviceError) {
          throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }
      }
    }

    this.debugLog(`getStatusActive reporting ${activeResult}`);
    return activeResult;
  }

  updateHomeKit(aqiInsteadOfDensity: boolean) {
    const lastReading = this.accessory.context.lastReading;
    this.debugLog(`Updating HomeKit with new sensor reading: ${lastReading}`);
    if (lastReading !== undefined) {
      this.service.updateCharacteristic(this.platform.Characteristic.AirQuality, lastReading.airQualityHomekitReading);

      if (aqiInsteadOfDensity) {
        this.service.updateCharacteristic(this.platform.Characteristic.PM2_5Density, lastReading.aqi);
      } else {
        this.service.updateCharacteristic(this.platform.Characteristic.PM2_5Density, lastReading.pm25);
      }

      if (lastReading.voc) {
        this.service.updateCharacteristic(this.platform.Characteristic.VOCDensity, lastReading.voc);
      }

      if (lastReading.humidity) {
        if (this.humidity) {
          this.humidity.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, lastReading.humidity);
        }

        // This not listed as optional characteristic for air quality sensor, but HomeApp does show it on the accessory's page
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, lastReading.humidity);
      }

      if (this.temperature && lastReading.temperature) {
        this.temperature.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, lastReading.temperature);
      }
    }
  }
}
