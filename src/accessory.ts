import * as AxiosLogger from 'axios-logger';
import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  HAP,
  Logging,
  Service,
} from 'homebridge';

import axios from 'axios';

import { parsePurpleAirJson, SensorReading } from './SensorReading';

let hap: HAP;

export = (api: API) => {
  hap = api.hap;
  api.registerAccessory('PurpleAirSensor', PurpleAirSensor);
};

class PurpleAirSensor implements AccessoryPlugin {

  // By default, only fetch new data every 5 mins.
  static readonly DEFAULT_UPDATE_INTERVAL_SECS = 300;

  // Never update more frequently than the following value.
  static readonly MIN_UPDATE_INTERVAL_MS = 30 * 1000;

  private readonly logger: Logging;
  private readonly log: (message: string) => void;
  private readonly name: string;
  private readonly sensor: string;
  private readonly key?: string;

  private readonly averages: string;
  private readonly conversion: string;

  // Report AQI in the density field. See config.schema.json for the motivation.
  private readonly aqiInsteadOfDensity: boolean = false;

  private readonly updateIntervalMs: number;
  private readonly service: Service;
  private readonly informationService: Service;
  private lastReading?: SensorReading;

  constructor(logger: Logging, config: AccessoryConfig, api: API) {
    this.logger = logger;
    this.sensor = config.sensor;
    this.key = config.key;
    this.name = config.name;
    this.service = new hap.Service.AirQualitySensor(this.name);

    if (config.updateIntervalSecs) {
      this.updateIntervalMs = config.updateIntervalSecs * 1000;
    } else {
      this.updateIntervalMs = PurpleAirSensor.DEFAULT_UPDATE_INTERVAL_SECS * 1000;
    }

    this.averages = config.averages;
    this.conversion = config.conversion;
    this.aqiInsteadOfDensity = config.aqiInsteadOfDensity ? config.aqiInsteadOfDensity : false;

    // eslint-disable-next-line max-len
    this.logger.info(`Initializing PurpleAirSensor ${this.name} ${this.sensor} update every ${this.updateIntervalMs} ms using ${this.averages} averages and ${this.conversion} conversion`);

    if (config.verboseLogging) {
      this.log = (msg: string) => this.logger.info(msg);
      this.logger.info('Use verbose logging');
    } else {
      this.log = (msg: string) => this.logger.debug(msg);
    }

    this.service.getCharacteristic(hap.Characteristic.StatusActive)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        if (this.lastReading !== undefined) {
          this.update();
          callback(null, this.lastReadingActive);
        } else {
          callback(null, false);
        }
      });

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, 'PurpleAir')
      .setCharacteristic(hap.Characteristic.Model, 'PurpleAir')
      .setCharacteristic(hap.Characteristic.SerialNumber, this.sensor);

    setInterval(() => {
      this.update(); 
    }, this.updateIntervalMs);

    this.update();
  }

  update() {
    const url = 'https://www.purpleair.com/json';

    const axiosInstance = axios.create();

    axiosInstance.interceptors.request.use((request) => {
      // write down your request intercept.
      return AxiosLogger.requestLogger(request, {
        logger: this.log
      });
    });

    if (this.lastReading !== undefined && this.lastReading.updateTimeMs > Date.now() - PurpleAirSensor.MIN_UPDATE_INTERVAL_MS) {
      this.log(`Skipping a fetch because the last update was ${Date.now() - this.lastReading.updateTimeMs} ms ago`);
    } else {
      this.log(`Fetching`);

      axiosInstance.get(url, {
        params: {
          show: this.sensor,
          key: this.key,
        },
      }).then(resp => {
        if (!resp.data.results[0]) {
          throw new Error('No sensor found')
        }

        this.lastReading = parsePurpleAirJson(resp.data, this.averages, this.conversion);
        this.log(`Received new sensor reading ${this.lastReading}`);
        this.updateHomeKit(this.aqiInsteadOfDensity);
      }).catch(err => {
        this.logger.error(`Fetching ${url}: ${err}`);
        this.lastReading = undefined;
        this.updateHomeKit(this.aqiInsteadOfDensity);
      });
    }
  }

  /*
    * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
    * Typical this only ever happens at the pairing process.
    */
  identify(): void {
    this.logger('Identify!');
  }

  /*
    * This method is called directly after creation of this instance.
    * It should return all services which should be added to the accessory.
    */
  getServices(): Service[] {
    return [
      this.informationService,
      this.service,
    ];
  }

  get lastReadingActive(): boolean {
    return this.lastReading ? this.lastReading.updateTimeMs > Date.now() - this.updateIntervalMs : false;
  }

  updateHomeKit(aqiInsteadOfDensity: boolean) {
    if (this.lastReading !== undefined) {
      this.service.setCharacteristic(hap.Characteristic.AirQuality, this.lastReading.airQualityHomekitReading);
      if (aqiInsteadOfDensity) {
        this.service.setCharacteristic(hap.Characteristic.PM2_5Density, this.lastReading.aqi);
      } else {
        this.service.setCharacteristic(hap.Characteristic.PM2_5Density, this.lastReading.pm25);
      }
      this.service.setCharacteristic(hap.Characteristic.VOCDensity, this.lastReading.voc);
      this.service.setCharacteristic(hap.Characteristic.StatusActive, this.lastReadingActive);
      this.service.setCharacteristic(hap.Characteristic.StatusFault, 0);
    } else {
      this.service.setCharacteristic(hap.Characteristic.StatusActive, false);
      this.service.setCharacteristic(hap.Characteristic.StatusFault, 1);
    }
  }
}
