import { parsePurpleAirJson, SensorReading } from './SensorReading';

import testIndoorData from './test-indoor-with-voc.json';
import testIndoorWithoutVocData from './test-indoor-without-voc.json';
import testOutdoorData from './test-outdoor.json';
import nearbyData from './test-62393.json';
import nearbyData2 from './test-67533.json';
import nearbyData3 from './test-68495.json';
import testLocalInside from './test-local-inside.json';
import testLocalOutside from './test-local-outside.json';

test('indoor sensor with VOC', () => {
  const reading = parsePurpleAirJson(testIndoorData);
  expect(reading.pm25).toBe(10.7);
  expect(reading.voc).toBe(81.0);
});

test('indoor sensor without VOC', () => {
  const reading = parsePurpleAirJson(testIndoorWithoutVocData);
  expect(reading.pm25).toBe(10.7);
  expect(reading.voc).toBe(null);
});


test('outdoor sensor', () => {
  const reading = parsePurpleAirJson(testOutdoorData);
  expect(reading.pm25).toBe(9.7);
  expect(reading.voc).toBe(110.6);
});

test('10m averages', () => {
  const reading = parsePurpleAirJson(testIndoorData, '10m');
  expect(reading.pm25).toBe(11.1);
});

test('30m averages', () => {
  const reading = parsePurpleAirJson(testIndoorData, '30m');
  expect(reading.pm25).toBe(13.0);
});

test('60m averages', () => {
  const reading = parsePurpleAirJson(testIndoorData, '60m');
  expect(reading.pm25).toBe(15.0);
});

test('default to no conversion', () => {
  const reading = parsePurpleAirJson(testIndoorData);
  expect(Math.round(reading.aqi)).toBe(45);
});

test('AQI excellent', () => {
  const reading = new SensorReading('1234', 6.86, NaN, NaN, NaN, 'None');
  expect(Math.round(reading.aqi)).toBe(29);
  expect(reading.airQualityHomekitReading).toBe(1);
});

test('AQI good', () => {
  const reading = new SensorReading('1234', 13.1, NaN, NaN, NaN, 'None');
  expect(Math.round(reading.aqi)).toBe(53);
  expect(reading.airQualityHomekitReading).toBe(2);
});

test('AQI fair', () => {
  const reading = new SensorReading('1234', 35.9, NaN, NaN, NaN, 'None');
  expect(Math.round(reading.aqi)).toBe(102);
  expect(reading.airQualityHomekitReading).toBe(3);
});

test('AQI inferior', () => {
  const reading = new SensorReading('1234', 65.1, NaN, NaN, NaN, 'None');
  expect(Math.round(reading.aqi)).toBe(156);
  expect(reading.airQualityHomekitReading).toBe(4);
});

test('AQI poor', () => {
  const reading = new SensorReading('1234', 154.5, NaN, NaN, NaN, 'None');
  expect(Math.round(reading.aqi)).toBe(205);
  expect(reading.airQualityHomekitReading).toBe(5);
});

test('AQandU excellent', () => {
  const reading = new SensorReading('1234', 6.86, NaN, NaN, NaN, 'AQandU');
  expect(Math.round(reading.aqi)).toBe(33);
  expect(reading.airQualityHomekitReading).toBe(1);
});

test('AQandU good', () => {
  const reading = new SensorReading('1234', 13.1, NaN, NaN, NaN, 'AQandU');
  expect(Math.round(reading.aqi)).toBe(53);
  expect(reading.airQualityHomekitReading).toBe(2);
});

test('AQandU good 2', () => {
  const reading = new SensorReading('1234', 35.9, NaN, NaN, NaN, 'AQandU');
  expect(Math.round(reading.aqi)).toBe(90);
  expect(reading.airQualityHomekitReading).toBe(2);
});

test('AQandU fair', () => {
  const reading = new SensorReading('1234', 65.1, NaN, NaN, NaN, 'AQandU');
  expect(Math.round(reading.aqi)).toBe(145);
  expect(reading.airQualityHomekitReading).toBe(3);
});

test('AQandU inferior', () => {
  const reading = new SensorReading('1234', 154.5, NaN, NaN, NaN, 'AQandU');
  expect(Math.round(reading.aqi)).toBe(186);
  expect(reading.airQualityHomekitReading).toBe(4);
});

test('AQandU poor', () => {
  const reading = new SensorReading('1234', 200.5, NaN, NaN, NaN, 'AQandU');
  expect(Math.round(reading.aqi)).toBe(209);
  expect(reading.airQualityHomekitReading).toBe(5);
});

test('Nearby 36 None', () => {
  const reading = parsePurpleAirJson(nearbyData, 'realtime', 'None');
  expect(reading.pm25).toBe(8.7);
  expect(reading.aqi).toBe(36);
  expect(reading.airQualityHomekitReading).toBe(1);
});

test('Nearby 158 AQandU', () => {
  const reading = parsePurpleAirJson(nearbyData, 'realtime', 'AQandU');
  expect(reading.pm25).toBe(8.7);
  expect(reading.aqi).toBe(39);
  expect(reading.airQualityHomekitReading).toBe(1);
});

test('Nearby 156 LRAPA', () => {
  const reading = parsePurpleAirJson(nearbyData, 'realtime', 'LRAPA');
  expect(reading.pm25).toBe(8.7);
  expect(reading.aqi).toBe(0);
  expect(reading.airQualityHomekitReading).toBe(1);
});

test('Nearby 90 None', () => {
  const reading = parsePurpleAirJson(nearbyData2, 'realtime', 'None');
  expect(reading.pm25).toBe(3.3);
  expect(reading.aqi).toBe(14);
  expect(reading.airQualityHomekitReading).toBe(1);
});

test('Nearby 81 EPA', () => {
  const reading = parsePurpleAirJson(nearbyData2, 'realtime', 'AQandU');
  expect(reading.pm25).toBe(3.3);
  expect(reading.aqi).toBe(22);
  expect(reading.airQualityHomekitReading).toBe(1);
});

test('Nearby 81 AQandU', () => {
  const reading = parsePurpleAirJson(nearbyData2, 'realtime', 'AQandU');
  expect(reading.pm25).toBe(3.3);
  expect(reading.aqi).toBe(22);
  expect(reading.airQualityHomekitReading).toBe(1);
});

test('Nearby 58 LRAPA', () => {
  const reading = parsePurpleAirJson(nearbyData2, 'realtime', 'LRAPA');
  expect(reading.pm25).toBe(3.3);
  expect(reading.aqi).toBe(0);
  expect(reading.airQualityHomekitReading).toBe(1);
});

test('Nearby 25 Woodsmoke', () => {
  const reading = parsePurpleAirJson(nearbyData3, 'realtime', 'WOODSMOKE');
  expect(reading.pm25).toBe(2.2);
  expect(reading.aqi).toBe(0);
});

test('Nearby 29 EPA', () => {
  const reading = parsePurpleAirJson(nearbyData3, 'realtime', 'EPA');
  expect(reading.pm25).toBe(2.2);
  expect(reading.aqi).toBe(0);
});

test('local inside sensor', () => {
  const reading = parsePurpleAirJson(testLocalInside, 'realtime', 'None', true);
  expect(reading.aqi).toBe(28);
  expect(reading.pm25).toBe(6.67);
});

test('local outside sensor', () => {
  const reading = parsePurpleAirJson(testLocalOutside, 'realtime', 'None', true);
  expect(reading.aqi).toBe(9);
  expect(reading.pm25).toBe(2.16);
});
