import { parsePurpleAirJson, SensorReading } from './SensorReading';

import testIndoorData from './test-indoor-with-voc.json';
import testOutdoorData from './test-outdoor.json';

test('indoor sensor with VOC', () => {
  // eslint-disable-next-line max-len
  const reading = parsePurpleAirJson(testIndoorData);
  expect(reading.pm25).toBe(6.86);
  expect(reading.voc).toBe(81.0);
});

test('outdoor sensor', () => {
  // eslint-disable-next-line max-len
  const reading = parsePurpleAirJson(testOutdoorData);
  expect(reading.pm25).toBe(46.96);
  expect(reading.voc).toBe(NaN);
});

test('AQI excellent', () => {
  const reading = new SensorReading('1234', 6.86, NaN);
  expect(Math.round(reading.aqi)).toBe(29);
  expect(reading.airQualityHomekitReading).toBe(1);
});

test('AQI good', () => {
  const reading = new SensorReading('1234', 13.1, NaN);
  expect(Math.round(reading.aqi)).toBe(52);
  expect(reading.airQualityHomekitReading).toBe(2);
});

test('AQI fair', () => {
  const reading = new SensorReading('1234', 35.9, NaN);
  expect(Math.round(reading.aqi)).toBe(101);
  expect(reading.airQualityHomekitReading).toBe(3);
});

test('AQI inferior', () => {
  const reading = new SensorReading('1234', 65.1, NaN);
  expect(Math.round(reading.aqi)).toBe(155);
  expect(reading.airQualityHomekitReading).toBe(4);
});

test('AQI poor', () => {
  const reading = new SensorReading('1234', 154.5, NaN);
  expect(Math.round(reading.aqi)).toBe(204);
  expect(reading.airQualityHomekitReading).toBe(5);
});
