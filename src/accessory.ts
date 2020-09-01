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

import axios from '../node_modules/axios';

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

  private readonly log: Logging;
  private readonly name: string;
  private readonly sensor: string;

  // Report AQI in the density field. See config.schema.json for the motivation.
  private readonly aqiInsteadOfDensity: boolean = false;

  private readonly updateIntervalMs: number;
  private readonly service: Service;
  private readonly informationService: Service;
  private lastReading?: SensorReading;

  constructor(log: Logging, config: AccessoryConfig, api: API) {
    this.log = log;
    this.sensor = config.sensor;
    this.name = config.name;
    this.service = new hap.Service.AirQualitySensor(this.name);

    if (config.updateIntervalSecs) {
      this.updateIntervalMs = config.updateIntervalSecs * 1000;
    } else {
      this.updateIntervalMs = PurpleAirSensor.DEFAULT_UPDATE_INTERVAL_SECS * 1000;
    }

    this.aqiInsteadOfDensity = config.aqiInsteadOfDensity ? config.aqiInsteadOfDensity : false;

    this.log('Initializing PurpleAirSensor', this.name, this.sensor, ' update every ', this.updateIntervalMs, 'ms');

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
    const url = 'https://www.purpleair.com/json?show=' + this.sensor;

    if (this.lastReading !== undefined && this.lastReading.updateTimeMs > Date.now() - PurpleAirSensor.MIN_UPDATE_INTERVAL_MS) {
      this.log.debug(`Skipping a fetch because the last update was ${Date.now() - this.lastReading.updateTimeMs} ms ago`);
    } else {
      this.log.debug(`Fetching ${url}`);

      axios.get(url).then(resp => {
        this.lastReading = new SensorReading(this.sensor, resp.data);
        this.log.debug(`Received new sensor reading ${this.lastReading}`);
        this.updateHomeKit(this.aqiInsteadOfDensity);
      }).catch(err => {
        this.log.error(`Fetching ${url}: ${err}`);
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
    this.log('Identify!');
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


class SensorReading {
  public readonly pm25 = 0;
  public readonly voc = 0;
  public readonly updateTimeMs: number;

  /**
   * Constructor
   * @param sensor sensor station number (digits)
   * @param data json data returned by PurpleAir JSON API
   */
  constructor(public readonly sensor: string, public readonly data) {
    this.pm25 = data.results[0].PM2_5Value;
    this.voc = data.results[1].Voc;
    this.updateTimeMs = Date.now();
  }

  public toString = () : string => {
    return `SensorReading(AQI=${this.aqi.toFixed(0)}, PM25=${this.pm25}u/m3, VOC=${this.voc})`;
  }

  get aqi(): number {
    return SensorReading.pmToAQI(this.pm25);
  }

  get airQualityHomekitReading(): number {
    return SensorReading.aqiToHomekit(this.aqi);
  }

  static aqiToHomekit(aqi: number): number {
    // This calculation was lifted from https://github.com/SANdood/homebridge-purpleair.
    if (aqi === undefined) {
      return 0; // Error or unknown response
    } else if (aqi <= 50) {
      return 1; // Return EXCELLENT
    } else if (aqi <= 100) {
      return 2; // Return GOOD
    } else if (aqi <= 150) {
      return 3; // Return FAIR
    } else if (aqi <= 200) {
      return 4; // Return INFERIOR
    } else if (aqi > 200) {
      return 5; // Return POOR (Homekit only goes to cat 5, so combined the last two AQI cats of Very Unhealty and Hazardous.
    }
    return 0;
  }
  
  static pmToAQI(pm: number): number {
    // This calculation was lifted from https://github.com/SANdood/homebridge-purpleair.
    let aqi: number;
    if (pm > 500) {
      aqi = 500;
    } else if (pm > 350.5) {
      aqi = this.remap(pm, 350.5, 500.5, 400, 500);
    } else if (pm > 250.5) {
      aqi = this.remap(pm, 250.5, 350.5, 300, 400);
    } else if (pm > 150.5) {
      aqi = this.remap(pm, 150.5, 250.5, 200, 300);
    } else if (pm > 55.5) {
      aqi = this.remap(pm, 55.5, 150.5, 150, 200);
    } else if (pm > 35.5) {
      aqi = this.remap(pm, 35.5, 55.5, 100, 150);
    } else if (pm > 12) {
      aqi = this.remap(pm, 12, 35.5, 50, 100);
    } else if (pm > 0) {
      aqi = this.remap(pm, 0, 12, 0, 50);
    } else {
      aqi = 0; 
    }
    return aqi;
  }

  static remap(value: number, fromLow: number, fromHigh: number, toLow: number, toHigh: number): number {
    // This calculation was lifted from https://github.com/SANdood/homebridge-purpleair.
    const fromRange = fromHigh - fromLow;
    const toRange = toHigh - toLow;
    const scaleFactor = toRange / fromRange;

    // Re-zero the value within the from range
    let tmpValue = value - fromLow;
    // Rescale the value to the to range
    tmpValue *= scaleFactor;
    // Re-zero back to the to range
    return tmpValue + toLow;
  }
}
