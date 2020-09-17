export declare function parsePurpleAirJson(data: any, averages?: string, conversion?: string): SensorReading;
export declare class SensorReading {
    readonly sensor: string;
    readonly pm25: number;
    readonly voc: number;
    readonly conversion: string;
    readonly updateTimeMs: number;
    /**
     * Constructor
     * @param sensor sensor station number (digits)
     * @param pm25 sensor pm 2.5 value (PM2_5Value)
     * @param voc sensor Voc value
     * @param conversion conversion ("None", "AQandU", or "LRAPA"). Default to None.
     */
    constructor(sensor: string, pm25: number, voc: number, conversion: string);
    toString: () => string;
    get aqi(): number;
    get airQualityHomekitReading(): number;
    static aqiToHomekit(aqi: number): number;
    static pmToAQandU(pm: number): number;
    static pmToLRAPA(pm: number): number;
    static pmToAQI(pm: number): number;
    static calcAQI(Cp: number, Ih: number, Il: number, BPh: number, BPl: number): number;
}
//# sourceMappingURL=SensorReading.d.ts.map