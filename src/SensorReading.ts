
export function parsePurpleAirJson(data) {
  return new SensorReading(
    data.results[0].ID,
    parseFloat(data.results[0].PM2_5Value),
    parseFloat(data.results[1].Voc),
  );
}

export class SensorReading {
  public readonly updateTimeMs: number;

  /**
   * Constructor
   * @param sensor sensor station number (digits)
   * @param data json data returned by PurpleAir JSON API
   */
  constructor(
      public readonly sensor: string,
      public readonly pm25: number,
      public readonly voc: number) {
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
