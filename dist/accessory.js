"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const AxiosLogger = __importStar(require("axios-logger"));
const axios_1 = __importDefault(require("axios"));
const SensorReading_1 = require("./SensorReading");
let hap;
class PurpleAirSensor {
    constructor(logger, config, api) {
        // Report AQI in the density field. See config.schema.json for the motivation.
        this.aqiInsteadOfDensity = false;
        this.logger = logger;
        this.sensor = config.sensor;
        this.key = config.key;
        this.name = config.name;
        this.service = new hap.Service.AirQualitySensor(this.name);
        if (config.updateIntervalSecs) {
            this.updateIntervalMs = config.updateIntervalSecs * 1000;
        }
        else {
            this.updateIntervalMs = PurpleAirSensor.DEFAULT_UPDATE_INTERVAL_SECS * 1000;
        }
        this.averages = config.averages;
        this.conversion = config.conversion;
        this.aqiInsteadOfDensity = config.aqiInsteadOfDensity ? config.aqiInsteadOfDensity : false;
        // eslint-disable-next-line max-len
        this.logger.info(`Initializing PurpleAirSensor ${this.name} ${this.sensor} update every ${this.updateIntervalMs} ms using ${this.averages} averages and ${this.conversion} conversion`);
        if (config.verboseLogging) {
            this.log = (msg) => this.logger.info(msg);
            this.logger.info('Use verbose logging');
        }
        else {
            this.log = (msg) => this.logger.debug(msg);
        }
        this.service.getCharacteristic(hap.Characteristic.StatusActive)
            .on("get" /* GET */, (callback) => {
            if (this.lastReading !== undefined) {
                this.update();
                callback(null, this.lastReadingActive);
            }
            else {
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
        const axiosInstance = axios_1.default.create();
        axiosInstance.interceptors.request.use((request) => {
            // write down your request intercept.
            return AxiosLogger.requestLogger(request, {
                logger: this.log
            });
        });
        if (this.lastReading !== undefined && this.lastReading.updateTimeMs > Date.now() - PurpleAirSensor.MIN_UPDATE_INTERVAL_MS) {
            this.log(`Skipping a fetch because the last update was ${Date.now() - this.lastReading.updateTimeMs} ms ago`);
        }
        else {
            this.log(`Fetching`);
            axiosInstance.get(url, {
                params: {
                    show: this.sensor,
                    key: this.key,
                },
            }).then(resp => {
                if (!resp.data.results[0]) {
                    throw new Error('No sensor found');
                }
                this.lastReading = SensorReading_1.parsePurpleAirJson(resp.data, this.averages, this.conversion);
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
    identify() {
        this.logger('Identify!');
    }
    /*
      * This method is called directly after creation of this instance.
      * It should return all services which should be added to the accessory.
      */
    getServices() {
        return [
            this.informationService,
            this.service,
        ];
    }
    get lastReadingActive() {
        return this.lastReading ? this.lastReading.updateTimeMs > Date.now() - this.updateIntervalMs : false;
    }
    updateHomeKit(aqiInsteadOfDensity) {
        if (this.lastReading !== undefined) {
            this.service.setCharacteristic(hap.Characteristic.AirQuality, this.lastReading.airQualityHomekitReading);
            if (aqiInsteadOfDensity) {
                this.service.setCharacteristic(hap.Characteristic.PM2_5Density, this.lastReading.aqi);
            }
            else {
                this.service.setCharacteristic(hap.Characteristic.PM2_5Density, this.lastReading.pm25);
            }
            this.service.setCharacteristic(hap.Characteristic.VOCDensity, this.lastReading.voc);
            this.service.setCharacteristic(hap.Characteristic.StatusActive, this.lastReadingActive);
            this.service.setCharacteristic(hap.Characteristic.StatusFault, 0);
        }
        else {
            this.service.setCharacteristic(hap.Characteristic.StatusActive, false);
            this.service.setCharacteristic(hap.Characteristic.StatusFault, 1);
        }
    }
}
// By default, only fetch new data every 5 mins.
PurpleAirSensor.DEFAULT_UPDATE_INTERVAL_SECS = 300;
// Never update more frequently than the following value.
PurpleAirSensor.MIN_UPDATE_INTERVAL_MS = 30 * 1000;
module.exports = (api) => {
    hap = api.hap;
    api.registerAccessory('PurpleAirSensor', PurpleAirSensor);
};
//# sourceMappingURL=accessory.js.map