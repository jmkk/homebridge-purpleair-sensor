"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SensorReading_1 = require("./SensorReading");
const test_indoor_with_voc_json_1 = __importDefault(require("./test-indoor-with-voc.json"));
const test_outdoor_json_1 = __importDefault(require("./test-outdoor.json"));
const test_62393_json_1 = __importDefault(require("./test-62393.json"));
test('indoor sensor with VOC', () => {
    const reading = SensorReading_1.parsePurpleAirJson(test_indoor_with_voc_json_1.default);
    expect(reading.pm25).toBe(6.86);
    expect(reading.voc).toBe(81.0);
});
test('outdoor sensor', () => {
    const reading = SensorReading_1.parsePurpleAirJson(test_outdoor_json_1.default);
    expect(reading.pm25).toBe(46.96);
    expect(reading.voc).toBe(NaN);
});
test('10m averages', () => {
    const reading = SensorReading_1.parsePurpleAirJson(test_indoor_with_voc_json_1.default, '10m');
    expect(reading.pm25).toBe(6.83);
});
test('30m averages', () => {
    const reading = SensorReading_1.parsePurpleAirJson(test_indoor_with_voc_json_1.default, '30m');
    expect(reading.pm25).toBe(7.61);
});
test('60m averages', () => {
    const reading = SensorReading_1.parsePurpleAirJson(test_indoor_with_voc_json_1.default, '60m');
    expect(reading.pm25).toBe(9.37);
});
test('default to no conversion', () => {
    const reading = SensorReading_1.parsePurpleAirJson(test_indoor_with_voc_json_1.default);
    expect(Math.round(reading.aqi)).toBe(29);
});
test('AQI excellent', () => {
    const reading = new SensorReading_1.SensorReading('1234', 6.86, NaN, 'None');
    expect(Math.round(reading.aqi)).toBe(29);
    expect(reading.airQualityHomekitReading).toBe(1);
});
test('AQI good', () => {
    const reading = new SensorReading_1.SensorReading('1234', 13.1, NaN, 'None');
    expect(Math.round(reading.aqi)).toBe(53);
    expect(reading.airQualityHomekitReading).toBe(2);
});
test('AQI fair', () => {
    const reading = new SensorReading_1.SensorReading('1234', 35.9, NaN, 'None');
    expect(Math.round(reading.aqi)).toBe(102);
    expect(reading.airQualityHomekitReading).toBe(3);
});
test('AQI inferior', () => {
    const reading = new SensorReading_1.SensorReading('1234', 65.1, NaN, 'None');
    expect(Math.round(reading.aqi)).toBe(156);
    expect(reading.airQualityHomekitReading).toBe(4);
});
test('AQI poor', () => {
    const reading = new SensorReading_1.SensorReading('1234', 154.5, NaN, 'None');
    expect(Math.round(reading.aqi)).toBe(205);
    expect(reading.airQualityHomekitReading).toBe(5);
});
test('AQandU excellent', () => {
    const reading = new SensorReading_1.SensorReading('1234', 6.86, NaN, 'AQandU');
    expect(Math.round(reading.aqi)).toBe(33);
    expect(reading.airQualityHomekitReading).toBe(1);
});
test('AQandU good', () => {
    const reading = new SensorReading_1.SensorReading('1234', 13.1, NaN, 'AQandU');
    expect(Math.round(reading.aqi)).toBe(53);
    expect(reading.airQualityHomekitReading).toBe(2);
});
test('AQandU good 2', () => {
    const reading = new SensorReading_1.SensorReading('1234', 35.9, NaN, 'AQandU');
    expect(Math.round(reading.aqi)).toBe(90);
    expect(reading.airQualityHomekitReading).toBe(2);
});
test('AQandU fair', () => {
    const reading = new SensorReading_1.SensorReading('1234', 65.1, NaN, 'AQandU');
    expect(Math.round(reading.aqi)).toBe(145);
    expect(reading.airQualityHomekitReading).toBe(3);
});
test('AQandU inferior', () => {
    const reading = new SensorReading_1.SensorReading('1234', 154.5, NaN, 'AQandU');
    expect(Math.round(reading.aqi)).toBe(186);
    expect(reading.airQualityHomekitReading).toBe(4);
});
test('AQandU poor', () => {
    const reading = new SensorReading_1.SensorReading('1234', 200.5, NaN, 'AQandU');
    expect(Math.round(reading.aqi)).toBe(209);
    expect(reading.airQualityHomekitReading).toBe(5);
});
test('Nearby 167 None', () => {
    const reading = SensorReading_1.parsePurpleAirJson(test_62393_json_1.default, 'realtime', 'None');
    expect(reading.pm25).toBe(86.47);
    expect(reading.aqi).toBe(167);
    expect(reading.airQualityHomekitReading).toBe(4);
});
test('Nearby 158 AQandU', () => {
    const reading = SensorReading_1.parsePurpleAirJson(test_62393_json_1.default, 'realtime', 'AQandU');
    expect(reading.pm25).toBe(86.47);
    expect(reading.aqi).toBe(158);
    expect(reading.airQualityHomekitReading).toBe(4);
});
test('Nearby 118 LRAPA', () => {
    const reading = SensorReading_1.parsePurpleAirJson(test_62393_json_1.default, 'realtime', 'LRAPA');
    expect(reading.pm25).toBe(86.47);
    expect(reading.aqi).toBe(118);
    expect(reading.airQualityHomekitReading).toBe(3);
});
//# sourceMappingURL=SensorReading.test.js.map