import { parsePurpleAirJson, SensorReading } from './SensorReading';

import testIndoorData from './test-indoor-with-voc.json';
import testIndoorWithoutVocData from './test-indoor-without-voc.json';
import testOutdoorData from './test-outdoor.json';
import nearbyData from './test-62393.json';

test('indoor sensor with VOC', () => {
  const reading = parsePurpleAirJson(testIndoorData);
  expect(reading.pm25).toBe(6.86);
  expect(reading.voc).toBe(81.0);
});

test('indoor sensor without VOC', () => {
  const reading = parsePurpleAirJson(testIndoorWithoutVocData);
  expect(reading.pm25).toBe(6.86);
  expect(reading.voc).toBe(null);
});


test('outdoor sensor', () => {
  const reading = parsePurpleAirJson(testOutdoorData);
  expect(reading.pm25).toBe(46.96);
  expect(reading.voc).toBe(null);
});

test('10m averages', () => {
  const reading = parsePurpleAirJson(testIndoorData, '10m');
  expect(reading.pm25).toBe(6.83);
});

test('30m averages', () => {
  const reading = parsePurpleAirJson(testIndoorData, '30m');
  expect(reading.pm25).toBe(7.61);
});

test('60m averages', () => {
  const reading = parsePurpleAirJson(testIndoorData, '60m');
  expect(reading.pm25).toBe(9.37);
});

test('default to no conversion', () => {
  const reading = parsePurpleAirJson(testIndoorData);
  expect(Math.round(reading.aqi)).toBe(29);
});

test('AQI excellent', () => {
  const reading = new SensorReading('1234', 6.86, NaN, 'None');
  expect(Math.round(reading.aqi)).toBe(29);
  expect(reading.airQualityHomekitReading).toBe(1);
});

test('AQI good', () => {
  const reading = new SensorReading('1234', 13.1, NaN, 'None');
  expect(Math.round(reading.aqi)).toBe(53);
  expect(reading.airQualityHomekitReading).toBe(2);
});

test('AQI fair', () => {
  const reading = new SensorReading('1234', 35.9, NaN, 'None');
  expect(Math.round(reading.aqi)).toBe(102);
  expect(reading.airQualityHomekitReading).toBe(3);
});

test('AQI inferior', () => {
  const reading = new SensorReading('1234', 65.1, NaN, 'None');
  expect(Math.round(reading.aqi)).toBe(156);
  expect(reading.airQualityHomekitReading).toBe(4);
});

test('AQI poor', () => {
  const reading = new SensorReading('1234', 154.5, NaN, 'None');
  expect(Math.round(reading.aqi)).toBe(205);
  expect(reading.airQualityHomekitReading).toBe(5);
});

test('AQandU excellent', () => {
  const reading = new SensorReading('1234', 6.86, NaN, 'AQandU');
  expect(Math.round(reading.aqi)).toBe(33);
  expect(reading.airQualityHomekitReading).toBe(1);
});

test('AQandU good', () => {
  const reading = new SensorReading('1234', 13.1, NaN, 'AQandU');
  expect(Math.round(reading.aqi)).toBe(53);
  expect(reading.airQualityHomekitReading).toBe(2);
});

test('AQandU good 2', () => {
  const reading = new SensorReading('1234', 35.9, NaN, 'AQandU');
  expect(Math.round(reading.aqi)).toBe(90);
  expect(reading.airQualityHomekitReading).toBe(2);
});

test('AQandU fair', () => {
  const reading = new SensorReading('1234', 65.1, NaN, 'AQandU');
  expect(Math.round(reading.aqi)).toBe(145);
  expect(reading.airQualityHomekitReading).toBe(3);
});

test('AQandU inferior', () => {
  const reading = new SensorReading('1234', 154.5, NaN, 'AQandU');
  expect(Math.round(reading.aqi)).toBe(186);
  expect(reading.airQualityHomekitReading).toBe(4);
});

test('AQandU poor', () => {
  const reading = new SensorReading('1234', 200.5, NaN, 'AQandU');
  expect(Math.round(reading.aqi)).toBe(209);
  expect(reading.airQualityHomekitReading).toBe(5);
});

test('Nearby 167 None', () => {
  const reading = parsePurpleAirJson(nearbyData, 'realtime', 'None');
  expect(reading.pm25).toBe(86.47);
  expect(reading.aqi).toBe(167);
  expect(reading.airQualityHomekitReading).toBe(4);
});

test('Nearby 158 AQandU', () => {
  const reading = parsePurpleAirJson(nearbyData, 'realtime', 'AQandU');
  expect(reading.pm25).toBe(86.47);
  expect(reading.aqi).toBe(158);
  expect(reading.airQualityHomekitReading).toBe(4);
});

test('Nearby 118 LRAPA', () => {
  const reading = parsePurpleAirJson(nearbyData, 'realtime', 'LRAPA');
  expect(reading.pm25).toBe(86.47);
  expect(reading.aqi).toBe(118);
  expect(reading.airQualityHomekitReading).toBe(3);
});
