
export function parsePurpleAirJson(data, averages?: string, conversion?: string) {
  const conv = conversion ?? 'None';
  const pm25 = (() => {
    switch (averages) {
      case '10m': return JSON.parse(data.results[0].Stats).v1;
      case '30m': return JSON.parse(data.results[0].Stats).v2;
      case '60m': return JSON.parse(data.results[0].Stats).v3;
      default: return parseFloat(data.results[0].PM2_5Value);
    }
  })();

  const sensor = data.results[0].ID;
  const voc = parseFloat(data.results[1].Voc);
  return new SensorReading(sensor, pm25, voc, conv);
}

export class SensorReading {
  public readonly updateTimeMs: number;

  /**
   * Constructor
   * @param sensor sensor station number (digits)
   * @param pm25 sensor pm 2.5 value (PM2_5Value)
   * @param voc sensor Voc value
   * @param conversion conversion ("None", "AQandU", or "LRAPA"). Default to None.
   */
  constructor(
      public readonly sensor: string,
      public readonly pm25: number,
      public readonly voc: number,
      public readonly conversion: string) {
    this.updateTimeMs = Date.now();
  }

  public toString = () : string => {
    return `SensorReading(AQI=${this.aqi.toFixed(0)}, PM25=${this.pm25}u/m3, VOC=${this.voc})`;
  }

  get aqi(): number {
    switch (this.conversion) {
      case 'AQandU' : {
        return SensorReading.pmToAQandU(this.pm25);
      }
      case 'LRAPA': {
        return SensorReading.pmToLRAPA(this.pm25);
      }
      default: {
        return SensorReading.pmToAQI(this.pm25);
      }
    }
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

  static pmToAQandU(pm: number): number {
    // formula found on https://www.purpleair.com/map, shown when you hover on the `?` next to `Conversion`
    return this.pmToAQI(0.778 * pm + 2.65);
  }

  static pmToLRAPA(pm: number): number {
    // formula found on https://www.purpleair.com/map, shown when you hover on the `?` next to `Conversion`
    return this.pmToAQI(0.5 * pm - 0.66);
  }
  
  static pmToAQI(pm: number): number {
    let aqi: number;

    if (pm > 350.5) {
      aqi = this.calcAQI(pm, 500, 401, 500, 350.5);
    } else if (pm > 250.5) {
      aqi = this.calcAQI(pm, 400, 301, 350.4, 250.5);
    } else if (pm > 150.5) {
      aqi = this.calcAQI(pm, 300, 201, 250.4, 150.5);
    } else if (pm > 55.5) {
      aqi = this.calcAQI(pm, 200, 151, 150.4, 55.5);
    } else if (pm > 35.5) {
      aqi = this.calcAQI(pm, 150, 101, 55.4, 35.5);
    } else if (pm > 12.1) {
      aqi = this.calcAQI(pm, 100, 51, 35.4, 12.1);
    } else if (pm >= 0) {
      aqi = this.calcAQI(pm, 50, 0, 12, 0);
    } else {
      aqi = 0;
    }

    return aqi;
  }

  static calcAQI(Cp: number, Ih: number, Il: number, BPh: number, BPl: number): number {
    // The AQI equation https://forum.airnowtech.org/t/the-aqi-equation/169
    // c = concentration, I = AQI, and BP = breakpoint
    const a = Ih - Il;
    const b = BPh - BPl;
    const c = Cp - BPl;
    return Math.round((a / b) * c + Il);
  }
}
