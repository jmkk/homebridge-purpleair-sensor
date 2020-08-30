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
  
    private readonly log: Logging;
    private readonly name: string;
    private readonly sensor: string;
  
    private readonly service: Service;
    private readonly informationService: Service;
  
    constructor(log: Logging, config: AccessoryConfig, api: API) {
      this.log = log;
      this.sensor = config.sensor;
      this.name = config.name;
      this.service = new hap.Service.AirQualitySensor(this.name);

      this.log('Initializing PurpleAirSensor', this.name, this.sensor, ' update every ', config.updateIntervalSecs, 'secs');

      // this.service.getCharacteristic(hap.Characteristic.AirQuality)
      //   .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
      //     this.sensorReading.fetch();
      //     log.info('Last reading: ' + this.sensorReading);
      //     callback(undefined, this.sensorReading.airQualityHomekitReading);
      //   });

      // this.service.getCharacteristic(hap.Characteristic.PM2_5Density)
      //   .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
      //     this.sensorReading.fetch();
      //     log.info('Last reading: ' + this.sensorReading);
      //     this.service.setCharacteristic(hap.Characteristic.ProductData, 'PM2.5: ' + this.sensorReading.pm25 + 'ug/m3');
      //     callback(undefined, this.sensorReading.aqi);
      //   });

      // this.service.getCharacteristic(hap.Characteristic.VOCDensity)
      //   .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
      //     this.sensorReading.fetch();
      //     log.info('Last reading: ' + this.sensorReading);
      //     callback(undefined, this.sensorReading.voc);
      //   });

      this.informationService = new hap.Service.AccessoryInformation()
        .setCharacteristic(hap.Characteristic.Manufacturer, 'PurpleAir')
        .setCharacteristic(hap.Characteristic.Model, 'PurpleAir')
        .setCharacteristic(hap.Characteristic.SerialNumber, this.sensor);

      setInterval(() => {
        this.update();
      }, config.updateIntervalSecs * 1000);

      this.update();
    }

    update() {
      const url = 'https://www.purpleair.com/json?show=' + this.sensor;

      this.log(`Fetching URL ${url}`);
      axios.get(url).then(resp => {
        const sensorReading = new SensorReading(this.sensor, resp.data);
        this.log(`Received new sensor reading ${sensorReading}`);
        sensorReading.updateService(this.service);
      }).catch(err => {
        this.log(err);
      });
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
}


class SensorReading {
  public readonly pm25 = 0;
  public readonly voc = 0;
  public readonly updateTime: Date;

  constructor(public readonly sensor: string, public readonly data) {
    this.pm25 = data.results[0].PM2_5Value;
    this.voc = data.results[1].Voc;
    this.updateTime = new Date();
  }

  updateService(service: Service) {
    service.setCharacteristic(hap.Characteristic.AirQuality, this.airQualityHomekitReading);
    service.setCharacteristic(hap.Characteristic.PM2_5Density, this.aqi);
    service.setCharacteristic(hap.Characteristic.VOCDensity, this.voc);
    service.setCharacteristic(hap.Characteristic.ProductData, `Last update: ${this.updateTime}\n${this}`);
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
