import type { BrickClass, HaystackTags } from '../types/enrichment.js';

/** A compiled semantic pattern for BACnet point classification */
export interface SemanticPattern {
  id: string;
  regex: RegExp;
  brickClass: BrickClass;
  haystackTags: HaystackTags;
  baseConfidence: number;
  /** Expected unit families for confidence boost/penalty */
  expectedUnits?: string[];
  category: string;
}

// --- Helpers ---

function brick(uri: string, label: string, category: string): BrickClass {
  return { uri: `https://brickschema.org/schema/Brick#${uri}`, label, category };
}

function tags(marker: string[], value: Record<string, string> = {}): HaystackTags {
  return { marker, value };
}

// --- Pattern definitions ---
// Each pattern is tuned against real data from Monarch Beach (Delta Controls) and Biscayne (Trane)

export const patterns: SemanticPattern[] = [

  // ============================================================
  // TEMPERATURE (30 patterns)
  // ============================================================
  {
    id: 'temp-space',
    regex: /\b(space|room|zone)\s*(temp|temperature)\b/i,
    brickClass: brick('Zone_Air_Temperature_Sensor', 'Zone Air Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'zone', 'air', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.95,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-space-camel',
    regex: /\bspaceTemperature\b/i,
    brickClass: brick('Zone_Air_Temperature_Sensor', 'Zone Air Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'zone', 'air', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.95,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-osa',
    regex: /\b(osa|outdoor\s*air|outside\s*air)\s*(temp|temperature)\b/i,
    brickClass: brick('Outside_Air_Temperature_Sensor', 'Outside Air Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'outside', 'air', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.95,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-outdoor-air-camel',
    regex: /\boutdoorAirTemp(erature)?\b/i,
    brickClass: brick('Outside_Air_Temperature_Sensor', 'Outside Air Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'outside', 'air', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.95,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-osa-wetbulb',
    regex: /\b(osa|outdoor\s*air|outside\s*air)\s*(temp)?\s*wetbulb\b/i,
    brickClass: brick('Outside_Air_Wet_Bulb_Temperature_Sensor', 'Outside Air Wet Bulb Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'outside', 'air', 'wetBulb', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.95,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-discharge',
    regex: /\b(discharge|dat|disch)\s*(air)?\s*(temp|temperature)\b/i,
    brickClass: brick('Discharge_Air_Temperature_Sensor', 'Discharge Air Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'discharge', 'air', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.92,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-discharge-camel',
    regex: /\bdischargeAirTemp(erature)?\b/i,
    brickClass: brick('Discharge_Air_Temperature_Sensor', 'Discharge Air Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'discharge', 'air', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.92,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-supply-air',
    regex: /\b(supply|sa)\s*(air)?\s*(temp|temperature)\b/i,
    brickClass: brick('Supply_Air_Temperature_Sensor', 'Supply Air Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'supply', 'air', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.92,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-return-air',
    regex: /\b(return|ra|ret)\s*(air)?\s*(temp|temperature)\b/i,
    brickClass: brick('Return_Air_Temperature_Sensor', 'Return Air Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'return', 'air', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.92,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-mixed-air',
    regex: /\b(mixed|ma)\s*(air)?\s*(temp|temperature)\b/i,
    brickClass: brick('Mixed_Air_Temperature_Sensor', 'Mixed Air Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'mixed', 'air', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.92,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-chws',
    regex: /\b(chws|chilled\s*water\s*supply|prim_chws|sec\d*_chws|schws\d*)\s*_?(temp|temperature)?\b/i,
    brickClass: brick('Chilled_Water_Supply_Temperature_Sensor', 'Chilled Water Supply Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'chilled', 'water', 'supply', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.90,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-chwr',
    regex: /\b(chwr|chilled\s*water\s*return|prim_chwr|schwr\d*)\s*_?(temp|temperature)?\b/i,
    brickClass: brick('Chilled_Water_Return_Temperature_Sensor', 'Chilled Water Return Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'chilled', 'water', 'return', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.90,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-hws',
    regex: /\b(hws|hot\s*water\s*supply)\s*_?(temp|temperature)?\b/i,
    brickClass: brick('Hot_Water_Supply_Temperature_Sensor', 'Hot Water Supply Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'hot', 'water', 'supply', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.90,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-hwr',
    regex: /\b(hwr|hot\s*water\s*return)\s*_?(temp|temperature)?\b/i,
    brickClass: brick('Hot_Water_Return_Temperature_Sensor', 'Hot Water Return Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'hot', 'water', 'return', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.90,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-cdws',
    regex: /\b(cdws|condenser\s*water\s*supply)\s*_?(temp|temperature)?\b/i,
    brickClass: brick('Condenser_Water_Supply_Temperature_Sensor', 'Condenser Water Supply Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'condenser', 'water', 'supply', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.90,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-cdwr',
    regex: /\b(cdwr|condenser\s*water\s*return)\s*_?(temp|temperature)?\b/i,
    brickClass: brick('Condenser_Water_Return_Temperature_Sensor', 'Condenser Water Return Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'condenser', 'water', 'return', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.90,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-condenser-sat-ref',
    regex: /\bcd_sat_ref_temp\b/i,
    brickClass: brick('Condenser_Water_Temperature_Sensor', 'Condenser Saturated Refrigerant Temperature', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'condenser', 'refrig', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.88,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-evap-sat-ref',
    regex: /\bevap_sat_ref_temp\b/i,
    brickClass: brick('Evaporator_Water_Temperature_Sensor', 'Evaporator Saturated Refrigerant Temperature', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'evaporator', 'refrig', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.88,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-generic',
    regex: /\b(temp|temperature)\b/i,
    brickClass: brick('Temperature_Sensor', 'Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'point'], { unit: 'fahrenheit' }),
    baseConfidence: 0.60,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },

  // ============================================================
  // SETPOINTS (25 patterns)
  // ============================================================
  {
    id: 'sp-occupied-heating',
    regex: /\boccupied\s*(heating|htg)\s*(temp\s*)?(setpoint|sp|spt|setpt)\b/i,
    brickClass: brick('Occupied_Heating_Temperature_Setpoint', 'Occupied Heating Temperature Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'temp', 'heating', 'occ', 'point']),
    baseConfidence: 0.95,
    category: 'setpoint',
  },
  {
    id: 'sp-occupied-heating-camel',
    regex: /\boccupiedHeatingSetpoint\b/i,
    brickClass: brick('Occupied_Heating_Temperature_Setpoint', 'Occupied Heating Temperature Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'temp', 'heating', 'occ', 'point']),
    baseConfidence: 0.95,
    category: 'setpoint',
  },
  {
    id: 'sp-occupied-cooling',
    regex: /\boccupied\s*(cooling|clg)\s*(temp\s*)?(setpoint|sp|spt|setpt)\b/i,
    brickClass: brick('Occupied_Cooling_Temperature_Setpoint', 'Occupied Cooling Temperature Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'temp', 'cooling', 'occ', 'point']),
    baseConfidence: 0.95,
    category: 'setpoint',
  },
  {
    id: 'sp-occupied-cooling-camel',
    regex: /\boccupiedCoolingSetpoint\b/i,
    brickClass: brick('Occupied_Cooling_Temperature_Setpoint', 'Occupied Cooling Temperature Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'temp', 'cooling', 'occ', 'point']),
    baseConfidence: 0.95,
    category: 'setpoint',
  },
  {
    id: 'sp-unoccupied-heating',
    regex: /\bunoccupied\s*(heating|htg)\s*(temp\s*)?(setpoint|sp|spt|setpt)\b/i,
    brickClass: brick('Unoccupied_Heating_Temperature_Setpoint', 'Unoccupied Heating Temperature Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'temp', 'heating', 'unocc', 'point']),
    baseConfidence: 0.95,
    category: 'setpoint',
  },
  {
    id: 'sp-unoccupied-cooling',
    regex: /\bunoccupied\s*(cooling|clg)\s*(temp\s*)?(setpoint|sp|spt|setpt)\b/i,
    brickClass: brick('Unoccupied_Cooling_Temperature_Setpoint', 'Unoccupied Cooling Temperature Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'temp', 'cooling', 'unocc', 'point']),
    baseConfidence: 0.95,
    category: 'setpoint',
  },
  {
    id: 'sp-sa-setpoint',
    regex: /\b(sa|supply\s*air)\s*_?(setpoint|sp|spt|setpt)\b/i,
    brickClass: brick('Supply_Air_Temperature_Setpoint', 'Supply Air Temperature Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'temp', 'supply', 'air', 'point']),
    baseConfidence: 0.90,
    category: 'setpoint',
  },
  {
    id: 'sp-duct-static',
    regex: /\b(duct\s*static|static\s*pressure)\s*_?(setpoint|sp|spt|setpt)\b/i,
    brickClass: brick('Duct_Static_Pressure_Setpoint', 'Duct Static Pressure Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'pressure', 'duct', 'static', 'point']),
    baseConfidence: 0.92,
    expectedUnits: ['inches-of-water', 'pascals'],
    category: 'setpoint',
  },
  {
    id: 'sp-condenser-water',
    regex: /\bcondenser\s*water\s*(setpoint|sp|spt|setpt)\b/i,
    brickClass: brick('Condenser_Water_Temperature_Setpoint', 'Condenser Water Temperature Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'temp', 'condenser', 'water', 'point']),
    baseConfidence: 0.92,
    category: 'setpoint',
  },
  {
    id: 'sp-dp-setpoint',
    regex: /\b(dp|differential\s*pressure)\s*_?(setpoint|sp|spt|setpt)\b/i,
    brickClass: brick('Differential_Pressure_Setpoint', 'Differential Pressure Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'pressure', 'differential', 'point']),
    baseConfidence: 0.90,
    expectedUnits: ['pounds-force-per-square-inch', 'kilopascals', 'pascals'],
    category: 'setpoint',
  },
  {
    id: 'sp-hws-setpoint',
    regex: /\b(hws|hot\s*water\s*supply)\s*_?(setpoint|sp|spt|setpt)\b/i,
    brickClass: brick('Hot_Water_Supply_Temperature_Setpoint', 'Hot Water Supply Temperature Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'temp', 'hot', 'water', 'supply', 'point']),
    baseConfidence: 0.90,
    category: 'setpoint',
  },
  {
    id: 'sp-space-temp-setpoint',
    regex: /\b(space|room|zone)\s*(temp|temperature)\s*(setpoint|sp|spt|setpt)\b/i,
    brickClass: brick('Zone_Air_Temperature_Setpoint', 'Zone Air Temperature Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'temp', 'zone', 'air', 'point']),
    baseConfidence: 0.95,
    category: 'setpoint',
  },
  {
    id: 'sp-space-temp-setpoint-camel',
    regex: /\bspaceTemperatureSetpoint\b/i,
    brickClass: brick('Zone_Air_Temperature_Setpoint', 'Zone Air Temperature Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'temp', 'zone', 'air', 'point']),
    baseConfidence: 0.95,
    category: 'setpoint',
  },
  {
    id: 'sp-airflow-setpoint',
    regex: /\b(airflow|air\s*flow|ventilation)\s*(setpoint|sp|spt|setpt)\b/i,
    brickClass: brick('Air_Flow_Setpoint', 'Air Flow Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'air', 'flow', 'point']),
    baseConfidence: 0.92,
    expectedUnits: ['cubic-feet-per-minute', 'liters-per-second'],
    category: 'setpoint',
  },
  {
    id: 'sp-co2-setpoint',
    regex: /\bco2\s*(setpoint|sp|spt|setpt)\b/i,
    brickClass: brick('CO2_Setpoint', 'CO2 Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'co2', 'point']),
    baseConfidence: 0.92,
    expectedUnits: ['parts-per-million'],
    category: 'setpoint',
  },
  {
    id: 'sp-humidity-setpoint',
    regex: /\b(humidity|humid)\s*(setpoint|sp|spt|setpt)\b/i,
    brickClass: brick('Humidity_Setpoint', 'Humidity Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'humidity', 'point']),
    baseConfidence: 0.90,
    expectedUnits: ['percent', 'percent-relative-humidity'],
    category: 'setpoint',
  },
  {
    id: 'sp-generic-setpoint',
    regex: /\b(setpoint|sp\b|spt\b|setpt)\b/i,
    brickClass: brick('Setpoint', 'Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'point']),
    baseConfidence: 0.55,
    category: 'setpoint',
  },

  // ============================================================
  // FLOW / CFM (15 patterns)
  // ============================================================
  {
    id: 'flow-discharge-air',
    regex: /\b(discharge\s*air\s*flow|disch\s*air\s*flow)\b/i,
    brickClass: brick('Discharge_Air_Flow_Sensor', 'Discharge Air Flow Sensor', 'Flow'),
    haystackTags: tags(['sensor', 'air', 'flow', 'discharge', 'point'], { unit: 'cfm' }),
    baseConfidence: 0.95,
    expectedUnits: ['cubic-feet-per-minute', 'liters-per-second'],
    category: 'flow',
  },
  {
    id: 'flow-airflow-sensor',
    regex: /\b(airflow|air\s*flow)\s*(ai|sensor|input)?\b/i,
    brickClass: brick('Air_Flow_Sensor', 'Air Flow Sensor', 'Flow'),
    haystackTags: tags(['sensor', 'air', 'flow', 'point'], { unit: 'cfm' }),
    baseConfidence: 0.88,
    expectedUnits: ['cubic-feet-per-minute', 'liters-per-second'],
    category: 'flow',
  },
  {
    id: 'flow-ventilation',
    regex: /\bventilation\s*(setpoint\s*active|ratio|flow)\b/i,
    brickClass: brick('Ventilation_Air_Flow_Sensor', 'Ventilation Air Flow Sensor', 'Flow'),
    haystackTags: tags(['sensor', 'air', 'flow', 'ventilation', 'point']),
    baseConfidence: 0.88,
    expectedUnits: ['cubic-feet-per-minute', 'liters-per-second', 'percent'],
    category: 'flow',
  },
  {
    id: 'flow-min-airflow',
    regex: /\bmin(imum)?\s*(airflow|air\s*flow)\b/i,
    brickClass: brick('Min_Air_Flow_Setpoint_Limit', 'Minimum Air Flow Setpoint Limit', 'Flow'),
    haystackTags: tags(['sp', 'air', 'flow', 'min', 'point']),
    baseConfidence: 0.90,
    expectedUnits: ['cubic-feet-per-minute', 'liters-per-second'],
    category: 'flow',
  },
  {
    id: 'flow-max-heating-airflow',
    regex: /\bmax\s*(heating|htg)\s*(airflow|air\s*flow)\b/i,
    brickClass: brick('Max_Heating_Air_Flow_Setpoint_Limit', 'Max Heating Air Flow Setpoint Limit', 'Flow'),
    haystackTags: tags(['sp', 'air', 'flow', 'max', 'heating', 'point']),
    baseConfidence: 0.92,
    expectedUnits: ['cubic-feet-per-minute', 'liters-per-second'],
    category: 'flow',
  },
  {
    id: 'flow-max-cooling-airflow',
    regex: /\bmax\s*(cooling|clg)\s*(airflow|air\s*flow)\b/i,
    brickClass: brick('Max_Cooling_Air_Flow_Setpoint_Limit', 'Max Cooling Air Flow Setpoint Limit', 'Flow'),
    haystackTags: tags(['sp', 'air', 'flow', 'max', 'cooling', 'point']),
    baseConfidence: 0.92,
    expectedUnits: ['cubic-feet-per-minute', 'liters-per-second'],
    category: 'flow',
  },
  {
    id: 'flow-airflow-error',
    regex: /\b(airflow|air\s*flow)\s*error\b/i,
    brickClass: brick('Air_Flow_Sensor', 'Air Flow Error', 'Flow'),
    haystackTags: tags(['sensor', 'air', 'flow', 'err', 'point']),
    baseConfidence: 0.85,
    category: 'flow',
  },
  {
    id: 'flow-water-gpm',
    regex: /\b(water\s*flow|gpm|gallons\s*per\s*minute)\b/i,
    brickClass: brick('Water_Flow_Sensor', 'Water Flow Sensor', 'Flow'),
    haystackTags: tags(['sensor', 'water', 'flow', 'point']),
    baseConfidence: 0.88,
    expectedUnits: ['us-gallons-per-minute'],
    category: 'flow',
  },
  {
    id: 'flow-cfm',
    regex: /\bcfm\b/i,
    brickClass: brick('Air_Flow_Sensor', 'Air Flow Sensor', 'Flow'),
    haystackTags: tags(['sensor', 'air', 'flow', 'point'], { unit: 'cfm' }),
    baseConfidence: 0.80,
    expectedUnits: ['cubic-feet-per-minute'],
    category: 'flow',
  },

  // ============================================================
  // PRESSURE (12 patterns)
  // ============================================================
  {
    id: 'press-duct-static',
    regex: /\b(duct|cd)?\s*static\s*pressure\b/i,
    brickClass: brick('Duct_Static_Pressure_Sensor', 'Duct Static Pressure Sensor', 'Pressure'),
    haystackTags: tags(['sensor', 'pressure', 'duct', 'static', 'point']),
    baseConfidence: 0.92,
    expectedUnits: ['inches-of-water', 'pascals'],
    category: 'pressure',
  },
  {
    id: 'press-differential',
    regex: /\b(differential|diff)\s*(press|pressure)\b/i,
    brickClass: brick('Differential_Pressure_Sensor', 'Differential Pressure Sensor', 'Pressure'),
    haystackTags: tags(['sensor', 'pressure', 'differential', 'point']),
    baseConfidence: 0.90,
    expectedUnits: ['pounds-force-per-square-inch', 'kilopascals', 'pascals'],
    category: 'pressure',
  },
  {
    id: 'press-chw-dp',
    regex: /\b(chill|chw|chilled)\s*(water)?\s*(differential|diff)?\s*(press|pressure|dp)\b/i,
    brickClass: brick('Chilled_Water_Differential_Pressure_Sensor', 'Chilled Water Differential Pressure Sensor', 'Pressure'),
    haystackTags: tags(['sensor', 'pressure', 'differential', 'chilled', 'water', 'point']),
    baseConfidence: 0.90,
    expectedUnits: ['pounds-force-per-square-inch', 'kilopascals'],
    category: 'pressure',
  },
  {
    id: 'press-cd-sat-ref',
    regex: /\bcd_sat_ref_press\b/i,
    brickClass: brick('Condenser_Pressure_Sensor', 'Condenser Saturated Refrigerant Pressure', 'Pressure'),
    haystackTags: tags(['sensor', 'pressure', 'condenser', 'refrig', 'point']),
    baseConfidence: 0.88,
    category: 'pressure',
  },
  {
    id: 'press-evap-sat-ref',
    regex: /\bevap_sat_ref_press\b/i,
    brickClass: brick('Evaporator_Pressure_Sensor', 'Evaporator Saturated Refrigerant Pressure', 'Pressure'),
    haystackTags: tags(['sensor', 'pressure', 'evaporator', 'refrig', 'point']),
    baseConfidence: 0.88,
    category: 'pressure',
  },
  {
    id: 'press-generic',
    regex: /\b(press|pressure|psi)\b/i,
    brickClass: brick('Pressure_Sensor', 'Pressure Sensor', 'Pressure'),
    haystackTags: tags(['sensor', 'pressure', 'point']),
    baseConfidence: 0.55,
    expectedUnits: ['inches-of-water', 'pascals', 'kilopascals', 'pounds-force-per-square-inch'],
    category: 'pressure',
  },

  // ============================================================
  // HUMIDITY (10 patterns)
  // ============================================================
  {
    id: 'humid-space',
    regex: /\b(space|room|zone)\s*(humidity|rh)\b/i,
    brickClass: brick('Zone_Air_Humidity_Sensor', 'Zone Air Humidity Sensor', 'Humidity'),
    haystackTags: tags(['sensor', 'humidity', 'zone', 'air', 'point']),
    baseConfidence: 0.95,
    expectedUnits: ['percent', 'percent-relative-humidity'],
    category: 'humidity',
  },
  {
    id: 'humid-space-camel',
    regex: /\bspaceHumidity\b/i,
    brickClass: brick('Zone_Air_Humidity_Sensor', 'Zone Air Humidity Sensor', 'Humidity'),
    haystackTags: tags(['sensor', 'humidity', 'zone', 'air', 'point']),
    baseConfidence: 0.95,
    expectedUnits: ['percent', 'percent-relative-humidity'],
    category: 'humidity',
  },
  {
    id: 'humid-osa',
    regex: /\b(osa|outdoor\s*air|outside\s*air)\s*(humidity|rh)\b/i,
    brickClass: brick('Outside_Air_Humidity_Sensor', 'Outside Air Humidity Sensor', 'Humidity'),
    haystackTags: tags(['sensor', 'humidity', 'outside', 'air', 'point']),
    baseConfidence: 0.95,
    expectedUnits: ['percent', 'percent-relative-humidity'],
    category: 'humidity',
  },
  {
    id: 'humid-outdoor-camel',
    regex: /\boutdoorAirHumidity\b/i,
    brickClass: brick('Outside_Air_Humidity_Sensor', 'Outside Air Humidity Sensor', 'Humidity'),
    haystackTags: tags(['sensor', 'humidity', 'outside', 'air', 'point']),
    baseConfidence: 0.95,
    expectedUnits: ['percent', 'percent-relative-humidity'],
    category: 'humidity',
  },
  {
    id: 'humid-dehumidify-sp',
    regex: /\bdehumidif(y|ication)\s*(start|stop)?\s*(setpoint|sp)\b/i,
    brickClass: brick('Dehumidification_Setpoint', 'Dehumidification Setpoint', 'Humidity'),
    haystackTags: tags(['sp', 'humidity', 'point']),
    baseConfidence: 0.90,
    category: 'humidity',
  },
  {
    id: 'humid-humidify-sp',
    regex: /\bhumidif(y|ication)\s*(start|stop)?\s*(setpoint|sp)\b/i,
    brickClass: brick('Humidification_Setpoint', 'Humidification Setpoint', 'Humidity'),
    haystackTags: tags(['sp', 'humidity', 'point']),
    baseConfidence: 0.90,
    category: 'humidity',
  },
  {
    id: 'humid-generic',
    regex: /\b(humidity|humid|rh)\b/i,
    brickClass: brick('Humidity_Sensor', 'Humidity Sensor', 'Humidity'),
    haystackTags: tags(['sensor', 'humidity', 'point']),
    baseConfidence: 0.60,
    expectedUnits: ['percent', 'percent-relative-humidity'],
    category: 'humidity',
  },

  // ============================================================
  // VALVE / DAMPER (18 patterns)
  // ============================================================
  {
    id: 'valve-chw',
    regex: /\b(chw|chilled\s*water)\s*_?(valve|vlv)\b/i,
    brickClass: brick('Chilled_Water_Valve', 'Chilled Water Valve', 'Valve'),
    haystackTags: tags(['cmd', 'valve', 'chilled', 'water', 'point']),
    baseConfidence: 0.95,
    expectedUnits: ['percent'],
    category: 'valve',
  },
  {
    id: 'valve-hw',
    regex: /\b(hw|hot\s*water)\s*_?(valve|vlv)\b/i,
    brickClass: brick('Hot_Water_Valve', 'Hot Water Valve', 'Valve'),
    haystackTags: tags(['cmd', 'valve', 'hot', 'water', 'point']),
    baseConfidence: 0.95,
    expectedUnits: ['percent'],
    category: 'valve',
  },
  {
    id: 'valve-reheat',
    regex: /\b(reheat)\s*(valve|vlv|position|command)\b/i,
    brickClass: brick('Reheat_Valve_Command', 'Reheat Valve Command', 'Valve'),
    haystackTags: tags(['cmd', 'valve', 'reheat', 'point']),
    baseConfidence: 0.92,
    expectedUnits: ['percent'],
    category: 'valve',
  },
  {
    id: 'valve-reheat-camel',
    regex: /\breheatValve(Command|Position)?\b/i,
    brickClass: brick('Reheat_Valve_Command', 'Reheat Valve Command', 'Valve'),
    haystackTags: tags(['cmd', 'valve', 'reheat', 'point']),
    baseConfidence: 0.92,
    expectedUnits: ['percent'],
    category: 'valve',
  },
  {
    id: 'valve-air-position',
    regex: /\bair\s*valve\s*position\s*(command)?\b/i,
    brickClass: brick('Damper_Position_Command', 'Air Valve Position Command', 'Valve'),
    haystackTags: tags(['cmd', 'damper', 'air', 'point']),
    baseConfidence: 0.92,
    expectedUnits: ['percent'],
    category: 'valve',
  },
  {
    id: 'damper-econ',
    regex: /\b(econ|economizer|outside\s*air)\s*_?(damper|dmpr)\b/i,
    brickClass: brick('Outside_Air_Damper', 'Economizer Damper', 'Damper'),
    haystackTags: tags(['cmd', 'damper', 'outside', 'air', 'economizer', 'point']),
    baseConfidence: 0.92,
    expectedUnits: ['percent'],
    category: 'valve',
  },
  {
    id: 'damper-return',
    regex: /\b(return|ra|ret)\s*(air)?\s*_?(damper|dmpr)\b/i,
    brickClass: brick('Return_Air_Damper', 'Return Air Damper', 'Damper'),
    haystackTags: tags(['cmd', 'damper', 'return', 'air', 'point']),
    baseConfidence: 0.90,
    expectedUnits: ['percent'],
    category: 'valve',
  },
  {
    id: 'damper-supply',
    regex: /\b(supply|sa)\s*(air)?\s*_?(damper|dmpr)\b/i,
    brickClass: brick('Supply_Air_Damper', 'Supply Air Damper', 'Damper'),
    haystackTags: tags(['cmd', 'damper', 'supply', 'air', 'point']),
    baseConfidence: 0.90,
    expectedUnits: ['percent'],
    category: 'valve',
  },
  {
    id: 'valve-generic',
    regex: /\b(valve|vlv)\b/i,
    brickClass: brick('Valve_Command', 'Valve Command', 'Valve'),
    haystackTags: tags(['cmd', 'valve', 'point']),
    baseConfidence: 0.60,
    category: 'valve',
  },
  {
    id: 'damper-generic',
    regex: /\b(damper|dmpr)\b/i,
    brickClass: brick('Damper_Position_Command', 'Damper Position Command', 'Damper'),
    haystackTags: tags(['cmd', 'damper', 'point']),
    baseConfidence: 0.60,
    category: 'valve',
  },

  // ============================================================
  // FAN / MOTOR / VFD (18 patterns)
  // ============================================================
  {
    id: 'fan-supply-status',
    regex: /\b(sf|supply\s*fan)\s*(fan)?\s*(status|sts)\b/i,
    brickClass: brick('Supply_Fan_Status', 'Supply Fan Status', 'Fan'),
    haystackTags: tags(['sensor', 'fan', 'supply', 'run', 'point']),
    baseConfidence: 0.95,
    category: 'fan',
  },
  {
    id: 'fan-return-status',
    regex: /\b(rf|return\s*fan)\s*(fan)?\s*(status|sts)\b/i,
    brickClass: brick('Return_Fan_Status', 'Return Fan Status', 'Fan'),
    haystackTags: tags(['sensor', 'fan', 'return', 'run', 'point']),
    baseConfidence: 0.95,
    category: 'fan',
  },
  {
    id: 'fan-supply-enable',
    regex: /\b(sf|supply\s*fan)\s*(fan)?\s*(enable|cmd|command)\b/i,
    brickClass: brick('Supply_Fan_Command', 'Supply Fan Command', 'Fan'),
    haystackTags: tags(['cmd', 'fan', 'supply', 'point']),
    baseConfidence: 0.92,
    category: 'fan',
  },
  {
    id: 'fan-return-enable',
    regex: /\b(rf|return\s*fan)\s*(fan)?\s*(enable|cmd|command)\b/i,
    brickClass: brick('Return_Fan_Command', 'Return Fan Command', 'Fan'),
    haystackTags: tags(['cmd', 'fan', 'return', 'point']),
    baseConfidence: 0.92,
    category: 'fan',
  },
  {
    id: 'fan-alarm',
    regex: /\b(fan)\s*(alarm|fault)\b/i,
    brickClass: brick('Fan_Alarm', 'Fan Alarm', 'Fan'),
    haystackTags: tags(['sensor', 'fan', 'alarm', 'point']),
    baseConfidence: 0.90,
    category: 'fan',
  },
  {
    id: 'fan-status-generic',
    regex: /\bfan\s*(status|sts)\b/i,
    brickClass: brick('Fan_Status', 'Fan Status', 'Fan'),
    haystackTags: tags(['sensor', 'fan', 'run', 'point']),
    baseConfidence: 0.88,
    category: 'fan',
  },
  {
    id: 'vfd-speed',
    regex: /\b(sf|rf|fan|pump)?\s*_?(speed|drive)\s*_?(percent|%|hz|hertz)?\b/i,
    brickClass: brick('Frequency_Command', 'VFD Speed Command', 'Motor'),
    haystackTags: tags(['cmd', 'motor', 'vfd', 'speed', 'point']),
    baseConfidence: 0.75,
    expectedUnits: ['percent', 'hertz'],
    category: 'fan',
  },
  {
    id: 'vfd-drive-hz',
    regex: /\bdrive\s*(hz|hertz|freq)\b/i,
    brickClass: brick('Frequency_Sensor', 'Drive Frequency Sensor', 'Motor'),
    haystackTags: tags(['sensor', 'motor', 'vfd', 'freq', 'point'], { unit: 'Hz' }),
    baseConfidence: 0.90,
    expectedUnits: ['hertz'],
    category: 'fan',
  },
  {
    id: 'vfd-drive-percent',
    regex: /\bdrive\s*(percent|%|pct)\b/i,
    brickClass: brick('Speed_Command', 'Drive Speed Command', 'Motor'),
    haystackTags: tags(['cmd', 'motor', 'vfd', 'speed', 'point']),
    baseConfidence: 0.88,
    expectedUnits: ['percent'],
    category: 'fan',
  },
  {
    id: 'fan-generic',
    regex: /\bfan\b/i,
    brickClass: brick('Fan', 'Fan', 'Fan'),
    haystackTags: tags(['equip', 'fan']),
    baseConfidence: 0.50,
    category: 'fan',
  },

  // ============================================================
  // POWER / ENERGY (15 patterns)
  // ============================================================
  {
    id: 'power-kw',
    regex: /\bkw\b(?!\s*h)/i,
    brickClass: brick('Electric_Power_Sensor', 'Electric Power Sensor', 'Power'),
    haystackTags: tags(['sensor', 'elec', 'power', 'point'], { unit: 'kW' }),
    baseConfidence: 0.92,
    expectedUnits: ['kilowatts'],
    category: 'power',
  },
  {
    id: 'power-kwh',
    regex: /kwh\b/i,
    brickClass: brick('Electric_Energy_Sensor', 'Electric Energy Sensor', 'Energy'),
    haystackTags: tags(['sensor', 'elec', 'energy', 'point'], { unit: 'kWh' }),
    baseConfidence: 0.95,
    expectedUnits: ['kilowatt-hours'],
    category: 'power',
  },
  {
    id: 'power-amps',
    regex: /\b(amps?|ampere|current)\b/i,
    brickClass: brick('Current_Sensor', 'Current Sensor', 'Power'),
    haystackTags: tags(['sensor', 'elec', 'current', 'point'], { unit: 'A' }),
    baseConfidence: 0.90,
    expectedUnits: ['amperes'],
    category: 'power',
  },
  {
    id: 'power-volts',
    regex: /\b(volts?|voltage)\b/i,
    brickClass: brick('Voltage_Sensor', 'Voltage Sensor', 'Power'),
    haystackTags: tags(['sensor', 'elec', 'volt', 'point'], { unit: 'V' }),
    baseConfidence: 0.90,
    expectedUnits: ['volts'],
    category: 'power',
  },
  {
    id: 'power-tonnage',
    regex: /\btonnage|tons\s*(refrigeration)?\b/i,
    brickClass: brick('Thermal_Power_Sensor', 'Tonnage Sensor', 'Power'),
    haystackTags: tags(['sensor', 'cooling', 'power', 'point'], { unit: 'ton' }),
    baseConfidence: 0.88,
    expectedUnits: ['tons', 'tons-refrigeration'],
    category: 'power',
  },

  // ============================================================
  // CO2 (5 patterns)
  // ============================================================
  {
    id: 'co2-room',
    regex: /\b(room|space|zone)\s*co2\b/i,
    brickClass: brick('CO2_Level_Sensor', 'Zone CO2 Level Sensor', 'AirQuality'),
    haystackTags: tags(['sensor', 'co2', 'zone', 'air', 'point']),
    baseConfidence: 0.95,
    expectedUnits: ['parts-per-million'],
    category: 'co2',
  },
  {
    id: 'co2-return-air',
    regex: /\b(return|ra)\s*(air)?\s*co2\b/i,
    brickClass: brick('Return_Air_CO2_Sensor', 'Return Air CO2 Sensor', 'AirQuality'),
    haystackTags: tags(['sensor', 'co2', 'return', 'air', 'point']),
    baseConfidence: 0.95,
    expectedUnits: ['parts-per-million'],
    category: 'co2',
  },
  {
    id: 'co2-generic',
    regex: /\bco2\b/i,
    brickClass: brick('CO2_Level_Sensor', 'CO2 Level Sensor', 'AirQuality'),
    haystackTags: tags(['sensor', 'co2', 'air', 'point']),
    baseConfidence: 0.70,
    expectedUnits: ['parts-per-million'],
    category: 'co2',
  },

  // ============================================================
  // OCCUPANCY (10 patterns)
  // ============================================================
  {
    id: 'occ-system-occupied',
    regex: /\b(system\s*)?occupied\b(?!\s*(heating|cooling|humid|setpoint|sp|spt))/i,
    brickClass: brick('Occupancy_Status', 'Occupancy Status', 'Occupancy'),
    haystackTags: tags(['sensor', 'occupied', 'point']),
    baseConfidence: 0.85,
    category: 'occupancy',
  },
  {
    id: 'occ-occupied-mode',
    regex: /\boccupied\s*mode\b/i,
    brickClass: brick('Occupancy_Mode_Status', 'Occupancy Mode Status', 'Occupancy'),
    haystackTags: tags(['sensor', 'occupied', 'mode', 'point']),
    baseConfidence: 0.90,
    category: 'occupancy',
  },
  {
    id: 'occ-standby',
    regex: /\bstandby\s*(mode|status)?\b/i,
    brickClass: brick('Standby_Mode_Status', 'Standby Mode Status', 'Occupancy'),
    haystackTags: tags(['sensor', 'standby', 'point']),
    baseConfidence: 0.80,
    category: 'occupancy',
  },

  // ============================================================
  // STATUS / ALARM (12 patterns)
  // ============================================================
  {
    id: 'alarm-chiller',
    regex: /\b(ch|chiller)\s*_?\d*\s*_?(alarm|fault)\b/i,
    brickClass: brick('Chiller_Alarm', 'Chiller Alarm', 'Alarm'),
    haystackTags: tags(['sensor', 'alarm', 'chiller', 'point']),
    baseConfidence: 0.92,
    category: 'alarm',
  },
  {
    id: 'alarm-generic',
    regex: /\b(alarm|fault|error)\b/i,
    brickClass: brick('Alarm', 'Alarm', 'Alarm'),
    haystackTags: tags(['sensor', 'alarm', 'point']),
    baseConfidence: 0.60,
    category: 'alarm',
  },
  {
    id: 'status-pump',
    regex: /\b(pump|cwp|schwp|pchwp|cdwp|hwp)\s*[-_]?\d*\s*[-_]?\s*(status|sts)\b/i,
    brickClass: brick('Pump_Status', 'Pump Status', 'Status'),
    haystackTags: tags(['sensor', 'pump', 'run', 'point']),
    baseConfidence: 0.92,
    category: 'status',
  },
  {
    id: 'status-chiller',
    regex: /\b(ch|chiller)\s*_?\d*\s*_?(status|sts)\b/i,
    brickClass: brick('Chiller_Status', 'Chiller Status', 'Status'),
    haystackTags: tags(['sensor', 'chiller', 'run', 'point']),
    baseConfidence: 0.90,
    category: 'status',
  },
  {
    id: 'status-generic',
    regex: /\b(status|sts)\b/i,
    brickClass: brick('Status', 'Status', 'Status'),
    haystackTags: tags(['sensor', 'point']),
    baseConfidence: 0.45,
    category: 'status',
  },

  // ============================================================
  // EQUIPMENT: CHILLER / COOLING TOWER / BOILER (15 patterns)
  // ============================================================
  {
    id: 'equip-ct-speed',
    regex: /\b(ct|cooling\s*tower)\s*_?\d*\s*_?(speed|drive)\b/i,
    brickClass: brick('Cooling_Tower_Fan_Speed_Command', 'Cooling Tower Fan Speed Command', 'CoolingTower'),
    haystackTags: tags(['cmd', 'coolingTower', 'fan', 'speed', 'point']),
    baseConfidence: 0.92,
    category: 'equipment',
  },
  {
    id: 'equip-ct-kw',
    regex: /\b(ct|cooling\s*tower)\s*_?\d*\s*_?(kw)\b/i,
    brickClass: brick('Electric_Power_Sensor', 'Cooling Tower Power Sensor', 'CoolingTower'),
    haystackTags: tags(['sensor', 'elec', 'power', 'coolingTower', 'point']),
    baseConfidence: 0.90,
    expectedUnits: ['kilowatts'],
    category: 'equipment',
  },
  {
    id: 'equip-pump-kw',
    regex: /\b(cwp|schwp|pchwp|cdwp|pump)\s*_?\d*\s*_?(kw)\b/i,
    brickClass: brick('Electric_Power_Sensor', 'Pump Power Sensor', 'Pump'),
    haystackTags: tags(['sensor', 'elec', 'power', 'pump', 'point']),
    baseConfidence: 0.90,
    expectedUnits: ['kilowatts'],
    category: 'equipment',
  },
  {
    id: 'equip-pump-speed',
    regex: /\b(pump|cwp|schwp|hw_pump)\s*_?(speed|drive)\b/i,
    brickClass: brick('Pump_Speed_Command', 'Pump Speed Command', 'Pump'),
    haystackTags: tags(['cmd', 'pump', 'speed', 'point']),
    baseConfidence: 0.90,
    expectedUnits: ['percent', 'hertz'],
    category: 'equipment',
  },

  // ============================================================
  // VAV-specific (10 patterns)
  // ============================================================
  {
    id: 'vav-air-valve-size',
    regex: /\bair\s*valve\s*size\b/i,
    brickClass: brick('Air_Flow_Setpoint', 'VAV Air Valve Size', 'VAV'),
    haystackTags: tags(['point', 'vav', 'air', 'flow', 'max']),
    baseConfidence: 0.85,
    expectedUnits: ['cubic-feet-per-minute'],
    category: 'vav',
  },
  {
    id: 'vav-reheat-type',
    regex: /\breheat\s*type\b/i,
    brickClass: brick('Reheat_Type', 'Reheat Type', 'VAV'),
    haystackTags: tags(['point', 'vav', 'reheat']),
    baseConfidence: 0.85,
    category: 'vav',
  },
  {
    id: 'vav-supply-fan-type',
    regex: /\bsupply\s*fan\s*type\b/i,
    brickClass: brick('Supply_Fan_Type', 'Supply Fan Type', 'VAV'),
    haystackTags: tags(['point', 'vav', 'fan', 'supply']),
    baseConfidence: 0.85,
    category: 'vav',
  },

  // ============================================================
  // DIAGNOSTIC / COMMUNICATION (8 patterns)
  // ============================================================
  {
    id: 'diag-communication-link',
    regex: /\b(secondary\s*)?communication\s*(link|status)\b/i,
    brickClass: brick('Communication_Status', 'Communication Link Status', 'Diagnostic'),
    haystackTags: tags(['sensor', 'diagnostic', 'comm', 'point']),
    baseConfidence: 0.85,
    category: 'diagnostic',
  },
  {
    id: 'diag-override',
    regex: /\boverride\b/i,
    brickClass: brick('Override_Status', 'Override Status', 'Diagnostic'),
    haystackTags: tags(['sensor', 'override', 'point']),
    baseConfidence: 0.70,
    category: 'diagnostic',
  },

  // ============================================================
  // SCHEDULE (5 patterns)
  // ============================================================
  {
    id: 'sched-occupied',
    regex: /\b(occupied\s*)?schedule\b/i,
    brickClass: brick('Occupancy_Schedule', 'Occupancy Schedule', 'Schedule'),
    haystackTags: tags(['schedule', 'occ', 'point']),
    baseConfidence: 0.80,
    category: 'schedule',
  },

  // ============================================================
  // ENTHALPY / BTU (5 patterns)
  // ============================================================
  {
    id: 'enthalpy-generic',
    regex: /\benthalpy\b/i,
    brickClass: brick('Enthalpy_Sensor', 'Enthalpy Sensor', 'Enthalpy'),
    haystackTags: tags(['sensor', 'enthalpy', 'point']),
    baseConfidence: 0.88,
    expectedUnits: ['btus-per-pound-dry-air'],
    category: 'enthalpy',
  },

  // ============================================================
  // CHANGEOVER (3 patterns - Trane specific)
  // ============================================================
  {
    id: 'changeover-heat-deviation',
    regex: /\bchangeoverHeatDeviation\b/i,
    brickClass: brick('Changeover_Temperature_Deviation', 'Changeover Heat Deviation', 'Changeover'),
    haystackTags: tags(['sensor', 'temp', 'changeover', 'deviation', 'point']),
    baseConfidence: 0.85,
    category: 'changeover',
  },

  // ============================================================
  // DELTA TEMPERATURE (3 patterns)
  // ============================================================
  {
    id: 'delta-temp',
    regex: /\bdelta\s*(temp|temperature|t)\b/i,
    brickClass: brick('Temperature_Difference_Sensor', 'Temperature Difference Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'delta', 'point']),
    baseConfidence: 0.85,
    expectedUnits: ['delta-degrees-fahrenheit', 'degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },

  // ============================================================
  // PLAIN ENGLISH TEMPERATURE (Kahului-style camelCase/descriptive)
  // ============================================================
  {
    id: 'temp-leaving-evap',
    regex: /\b(Leaving|Lvg)\s*Evap(orator)?\s*Temp/i,
    brickClass: brick('Leaving_Evaporator_Water_Temperature_Sensor', 'Leaving Evaporator Temperature', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'leaving', 'evaporator', 'point']),
    baseConfidence: 0.93,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-entering-evap',
    regex: /\b(Entering|Ent)\s*Evap(orator)?\s*Temp/i,
    brickClass: brick('Entering_Evaporator_Water_Temperature_Sensor', 'Entering Evaporator Temperature', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'entering', 'evaporator', 'point']),
    baseConfidence: 0.93,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-leaving-cond',
    regex: /\b(Leaving|Lvg)\s*Cond(enser)?\s*Temp/i,
    brickClass: brick('Condenser_Water_Supply_Temperature_Sensor', 'Leaving Condenser Temperature', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'leaving', 'condenser', 'point']),
    baseConfidence: 0.93,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-entering-cond',
    regex: /\b(Entering|Ent)\s*Cond(enser)?\s*Temp/i,
    brickClass: brick('Condenser_Water_Return_Temperature_Sensor', 'Entering Condenser Temperature', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'entering', 'condenser', 'point']),
    baseConfidence: 0.93,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-entering-chw-loop',
    regex: /\b(Entering|Ent)\s*Ch(illed)?\s*w(ater)?\s*(Loop)?\s*Temp/i,
    brickClass: brick('Chilled_Water_Return_Temperature_Sensor', 'Entering CHW Loop Temperature', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'entering', 'chilled', 'water', 'point']),
    baseConfidence: 0.93,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-leaving-chw',
    regex: /\b(Leaving|Lvg)\s*CH?W\s*Temp(erature)?/i,
    brickClass: brick('Chilled_Water_Supply_Temperature_Sensor', 'Leaving CHW Temperature', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'leaving', 'chilled', 'water', 'point']),
    baseConfidence: 0.93,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-refrigerant',
    regex: /\bRefrigerant\s*Temp/i,
    brickClass: brick('Refrigerant_Temperature_Sensor', 'Refrigerant Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'refrig', 'point']),
    baseConfidence: 0.92,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-outdoor-feed',
    regex: /\bOutdoor\s*Temp(\s*Feed)?/i,
    brickClass: brick('Outside_Air_Temperature_Sensor', 'Outdoor Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'outside', 'air', 'point']),
    baseConfidence: 0.93,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-oa-temperature',
    regex: /\bOA\s*Temperature\b/i,
    brickClass: brick('Outside_Air_Temperature_Sensor', 'Outside Air Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'outside', 'air', 'point']),
    baseConfidence: 0.93,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-heatsink',
    regex: /\bHeat\s*sink\s*Temp/i,
    brickClass: brick('Temperature_Sensor', 'Heatsink Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'equip', 'point']),
    baseConfidence: 0.85,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },
  {
    id: 'temp-drive-motor',
    regex: /\b(DRIVE|MOTOR)\s*TEMP/i,
    brickClass: brick('Temperature_Sensor', 'Drive/Motor Temperature Sensor', 'Temperature'),
    haystackTags: tags(['sensor', 'temp', 'motor', 'point']),
    baseConfidence: 0.85,
    expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'],
    category: 'temperature',
  },

  // ============================================================
  // PLAIN ENGLISH SETPOINTS (Kahului style)
  // ============================================================
  {
    id: 'sp-cooling-setpoint',
    regex: /\bCooling\s*Set\s*Point/i,
    brickClass: brick('Cooling_Temperature_Setpoint', 'Cooling Temperature Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'temp', 'cooling', 'point']),
    baseConfidence: 0.93,
    category: 'setpoint',
  },
  {
    id: 'sp-heating-setpoint',
    regex: /\bHeating\s*Set\s*Point/i,
    brickClass: brick('Heating_Temperature_Setpoint', 'Heating Temperature Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'temp', 'heating', 'point']),
    baseConfidence: 0.93,
    category: 'setpoint',
  },
  {
    id: 'sp-condenser-temp-sp',
    regex: /\bCondenser\s*Temp\s*Set\s*Point/i,
    brickClass: brick('Condenser_Water_Temperature_Setpoint', 'Condenser Temperature Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'temp', 'condenser', 'point']),
    baseConfidence: 0.93,
    category: 'setpoint',
  },
  {
    id: 'sp-active-setpoint',
    regex: /\bActive\s*Set\s*Point/i,
    brickClass: brick('Temperature_Setpoint', 'Active Temperature Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'temp', 'active', 'point']),
    baseConfidence: 0.85,
    category: 'setpoint',
  },
  {
    id: 'sp-set-point-generic',
    regex: /\bSet[\s-]*Point\b/i,
    brickClass: brick('Setpoint', 'Setpoint', 'Setpoint'),
    haystackTags: tags(['sp', 'point']),
    baseConfidence: 0.55,
    category: 'setpoint',
  },

  // ============================================================
  // PLAIN ENGLISH POWER/ENERGY (Kahului style)
  // ============================================================
  {
    id: 'power-chiller-power',
    regex: /\b(Chiller|Compressor)\s*([-_]?\d+)?\s*Power/i,
    brickClass: brick('Electric_Power_Sensor', 'Chiller Power Sensor', 'Power'),
    haystackTags: tags(['sensor', 'elec', 'power', 'chiller', 'point'], { unit: 'kW' }),
    baseConfidence: 0.93,
    expectedUnits: ['kilowatts', 'watts'],
    category: 'power',
  },
  {
    id: 'power-total-power',
    regex: /\bTotal\s*Power\b/i,
    brickClass: brick('Electric_Power_Sensor', 'Total Power Sensor', 'Power'),
    haystackTags: tags(['sensor', 'elec', 'power', 'total', 'point']),
    baseConfidence: 0.90,
    expectedUnits: ['kilowatts', 'watts'],
    category: 'power',
  },
  {
    id: 'power-demand',
    regex: /\b(kW\s*)?Demand\b/i,
    brickClass: brick('Electric_Demand_Sensor', 'Electric Demand Sensor', 'Power'),
    haystackTags: tags(['sensor', 'elec', 'demand', 'point']),
    baseConfidence: 0.80,
    expectedUnits: ['kilowatts'],
    category: 'power',
  },
  {
    id: 'power-generic',
    regex: /\bPower\b/i,
    brickClass: brick('Electric_Power_Sensor', 'Power Sensor', 'Power'),
    haystackTags: tags(['sensor', 'elec', 'power', 'point']),
    baseConfidence: 0.55,
    expectedUnits: ['kilowatts', 'watts'],
    category: 'power',
  },
  {
    id: 'power-mwh',
    regex: /\bMWH\b/i,
    brickClass: brick('Electric_Energy_Sensor', 'MWh Energy Sensor', 'Energy'),
    haystackTags: tags(['sensor', 'elec', 'energy', 'point'], { unit: 'MWh' }),
    baseConfidence: 0.92,
    expectedUnits: ['megawatt-hours'],
    category: 'power',
  },
  {
    id: 'power-output-current',
    regex: /\bOutput\s*Current\b/i,
    brickClass: brick('Current_Sensor', 'Output Current Sensor', 'Power'),
    haystackTags: tags(['sensor', 'elec', 'current', 'point']),
    baseConfidence: 0.90,
    expectedUnits: ['amperes', 'milliamperes'],
    category: 'power',
  },
  {
    id: 'power-output-voltage',
    regex: /\bOutput\s*Voltage\b/i,
    brickClass: brick('Voltage_Sensor', 'Output Voltage Sensor', 'Power'),
    haystackTags: tags(['sensor', 'elec', 'volt', 'point']),
    baseConfidence: 0.90,
    expectedUnits: ['volts'],
    category: 'power',
  },
  {
    id: 'power-output-frequency',
    regex: /\bOutput\s*(Freq(uency)?|Speed)\b/i,
    brickClass: brick('Frequency_Sensor', 'Output Frequency Sensor', 'Motor'),
    haystackTags: tags(['sensor', 'motor', 'freq', 'point']),
    baseConfidence: 0.88,
    expectedUnits: ['hertz', 'revolutions-per-minute'],
    category: 'power',
  },
  {
    id: 'power-output-torque',
    regex: /\b(Output\s*)?Torque\b/i,
    brickClass: brick('Torque_Sensor', 'Torque Sensor', 'Motor'),
    haystackTags: tags(['sensor', 'motor', 'torque', 'point']),
    baseConfidence: 0.85,
    category: 'power',
  },

  // ============================================================
  // PLAIN ENGLISH ALARM/FAULT (Kahului style)
  // ============================================================
  {
    id: 'alarm-chiller-plain',
    regex: /\bChiller\s*Alarm/i,
    brickClass: brick('Chiller_Alarm', 'Chiller Alarm', 'Alarm'),
    haystackTags: tags(['sensor', 'alarm', 'chiller', 'point']),
    baseConfidence: 0.93,
    category: 'alarm',
  },
  {
    id: 'alarm-chiller-fault-plain',
    regex: /\bChiller\s*Fault/i,
    brickClass: brick('Chiller_Fault_Status', 'Chiller Fault', 'Alarm'),
    haystackTags: tags(['sensor', 'fault', 'chiller', 'point']),
    baseConfidence: 0.93,
    category: 'alarm',
  },
  {
    id: 'alarm-compressor',
    regex: /\bCompressor\s*([-_]?\d+)?\s*(Alarm|Fault)/i,
    brickClass: brick('Compressor_Alarm', 'Compressor Alarm/Fault', 'Alarm'),
    haystackTags: tags(['sensor', 'alarm', 'compressor', 'point']),
    baseConfidence: 0.92,
    category: 'alarm',
  },
  {
    id: 'alarm-bearing-fault',
    regex: /\bBearing\s*Fault/i,
    brickClass: brick('Motor_Alarm', 'Bearing Fault', 'Alarm'),
    haystackTags: tags(['sensor', 'alarm', 'motor', 'bearing', 'point']),
    baseConfidence: 0.90,
    category: 'alarm',
  },
  {
    id: 'alarm-vfd-fault',
    regex: /\bVFD\s*[-_]?\s*Fault/i,
    brickClass: brick('VFD_Alarm', 'VFD Fault', 'Alarm'),
    haystackTags: tags(['sensor', 'alarm', 'vfd', 'motor', 'point']),
    baseConfidence: 0.90,
    category: 'alarm',
  },
  {
    id: 'alarm-drip-pan',
    regex: /\bDrip\s*Pan\s*(Float\s*)?(Switch|Alarm)/i,
    brickClass: brick('Leak_Alarm', 'Drip Pan Alarm', 'Alarm'),
    haystackTags: tags(['sensor', 'alarm', 'leak', 'point']),
    baseConfidence: 0.88,
    category: 'alarm',
  },

  // ============================================================
  // PLAIN ENGLISH STATUS/STATE/RUN (Kahului style)
  // ============================================================
  {
    id: 'status-chiller-state',
    regex: /\bChiller\s*State/i,
    brickClass: brick('Chiller_Status', 'Chiller State', 'Status'),
    haystackTags: tags(['sensor', 'chiller', 'run', 'point']),
    baseConfidence: 0.90,
    category: 'status',
  },
  {
    id: 'status-chiller-mode',
    regex: /\bChiller\s*Mode/i,
    brickClass: brick('Chiller_Mode_Status', 'Chiller Mode', 'Status'),
    haystackTags: tags(['sensor', 'chiller', 'mode', 'point']),
    baseConfidence: 0.88,
    category: 'status',
  },
  {
    id: 'status-chiller-running',
    regex: /\bChiller\s*(Running|Run)\s*(State|Status)?/i,
    brickClass: brick('Chiller_On_Off_Status', 'Chiller Running State', 'Status'),
    haystackTags: tags(['sensor', 'chiller', 'run', 'point']),
    baseConfidence: 0.92,
    category: 'status',
  },
  {
    id: 'status-chiller-enable',
    regex: /\bChiller\s*Enable\s*(State|Status|Command)?/i,
    brickClass: brick('Chiller_On_Off_Command', 'Chiller Enable Command', 'Status'),
    haystackTags: tags(['cmd', 'chiller', 'enable', 'point']),
    baseConfidence: 0.90,
    category: 'status',
  },
  {
    id: 'status-compressor-state',
    regex: /\bCompressor\s*([-_]?\d+)?\s*State/i,
    brickClass: brick('Compressor_Status', 'Compressor State', 'Status'),
    haystackTags: tags(['sensor', 'compressor', 'run', 'point']),
    baseConfidence: 0.90,
    category: 'status',
  },
  {
    id: 'status-run-command',
    regex: /\bRun\s*(Command|Cmd|Request)/i,
    brickClass: brick('Run_Command', 'Run Command', 'Status'),
    haystackTags: tags(['cmd', 'run', 'point']),
    baseConfidence: 0.85,
    category: 'status',
  },
  {
    id: 'status-run-status',
    regex: /\bRun\s*(Status|State)/i,
    brickClass: brick('Run_Status', 'Run Status', 'Status'),
    haystackTags: tags(['sensor', 'run', 'point']),
    baseConfidence: 0.85,
    category: 'status',
  },
  {
    id: 'status-enable',
    regex: /\bEnable\s*(State|Status|Command)?/i,
    brickClass: brick('Enable_Command', 'Enable Command', 'Status'),
    haystackTags: tags(['cmd', 'enable', 'point']),
    baseConfidence: 0.70,
    category: 'status',
  },

  // ============================================================
  // PLAIN ENGLISH COMMANDS (Kahului style)
  // ============================================================
  {
    id: 'cmd-valve-command',
    regex: /\bValve\s*(Command|Cmd)\b/i,
    brickClass: brick('Valve_Command', 'Valve Command', 'Valve'),
    haystackTags: tags(['cmd', 'valve', 'point']),
    baseConfidence: 0.88,
    expectedUnits: ['percent'],
    category: 'valve',
  },
  {
    id: 'cmd-fan-command',
    regex: /\bFan\s*(Command|Cmd)\b/i,
    brickClass: brick('Fan_On_Off_Command', 'Fan Command', 'Fan'),
    haystackTags: tags(['cmd', 'fan', 'point']),
    baseConfidence: 0.88,
    category: 'fan',
  },
  {
    id: 'cmd-speed-command',
    regex: /\bVFD\s*(Speed\s*)?(Command|Cmd)\b/i,
    brickClass: brick('Speed_Command', 'VFD Speed Command', 'Motor'),
    haystackTags: tags(['cmd', 'motor', 'vfd', 'speed', 'point']),
    baseConfidence: 0.90,
    expectedUnits: ['percent', 'hertz'],
    category: 'fan',
  },

  // ============================================================
  // PLAIN ENGLISH PUMP (Kahului style)
  // ============================================================
  {
    id: 'pump-chwp-run',
    regex: /\bCHWP[-_]?\d*\s*(Run\s*)?(Command|Status|Request)/i,
    brickClass: brick('Pump_Command', 'CHWP Run Command', 'Pump'),
    haystackTags: tags(['cmd', 'pump', 'chilled', 'water', 'run', 'point']),
    baseConfidence: 0.92,
    category: 'equipment',
  },
  {
    id: 'pump-chwp-speed',
    regex: /\bCHWP[-_]?\d*\s*VFD\s*Speed/i,
    brickClass: brick('Pump_Speed_Command', 'CHWP Speed Command', 'Pump'),
    haystackTags: tags(['cmd', 'pump', 'chilled', 'water', 'speed', 'point']),
    baseConfidence: 0.92,
    expectedUnits: ['percent', 'hertz'],
    category: 'equipment',
  },

  // ============================================================
  // PLAIN ENGLISH PRESSURE (Kahului style)
  // ============================================================
  {
    id: 'press-suction',
    regex: /\bPressure\s*[-_]?\s*Suction/i,
    brickClass: brick('Suction_Pressure_Sensor', 'Suction Pressure Sensor', 'Pressure'),
    haystackTags: tags(['sensor', 'pressure', 'suction', 'refrig', 'point']),
    baseConfidence: 0.92,
    expectedUnits: ['pounds-force-per-square-inch', 'kilopascals'],
    category: 'pressure',
  },
  {
    id: 'press-discharge',
    regex: /\bPressure\s*[-_]?\s*Discharge/i,
    brickClass: brick('Discharge_Pressure_Sensor', 'Discharge Pressure Sensor', 'Pressure'),
    haystackTags: tags(['sensor', 'pressure', 'discharge', 'refrig', 'point']),
    baseConfidence: 0.92,
    expectedUnits: ['pounds-force-per-square-inch', 'kilopascals'],
    category: 'pressure',
  },
  {
    id: 'press-chws-pressure',
    regex: /\bCHWS?\s*Pressure/i,
    brickClass: brick('Chilled_Water_Supply_Pressure_Sensor', 'CHWS Pressure Sensor', 'Pressure'),
    haystackTags: tags(['sensor', 'pressure', 'chilled', 'water', 'supply', 'point']),
    baseConfidence: 0.92,
    expectedUnits: ['pounds-force-per-square-inch', 'inches-of-water'],
    category: 'pressure',
  },

  // ============================================================
  // PLAIN ENGLISH FLOW (Kahului style)
  // ============================================================
  {
    id: 'flow-chiller',
    regex: /\b(Chiller|Total\s*Chiller)\s*[-_]?\d*\s*Flow/i,
    brickClass: brick('Chilled_Water_Flow_Sensor', 'Chiller Flow Sensor', 'Flow'),
    haystackTags: tags(['sensor', 'water', 'flow', 'chiller', 'point']),
    baseConfidence: 0.92,
    expectedUnits: ['us-gallons-per-minute'],
    category: 'flow',
  },
  {
    id: 'flow-sensorless',
    regex: /\bSensorless\s*(Flow|Readout)/i,
    brickClass: brick('Water_Flow_Sensor', 'Sensorless Flow Sensor', 'Flow'),
    haystackTags: tags(['sensor', 'water', 'flow', 'point']),
    baseConfidence: 0.85,
    category: 'flow',
  },
  {
    id: 'flow-sensor-generic',
    regex: /\bFlow\s*Sensor\b/i,
    brickClass: brick('Flow_Sensor', 'Flow Sensor', 'Flow'),
    haystackTags: tags(['sensor', 'flow', 'point']),
    baseConfidence: 0.85,
    category: 'flow',
  },
  {
    id: 'flow-generic',
    regex: /\bFlow\b/i,
    brickClass: brick('Flow_Sensor', 'Flow Sensor', 'Flow'),
    haystackTags: tags(['sensor', 'flow', 'point']),
    baseConfidence: 0.50,
    category: 'flow',
  },

  // ============================================================
  // PLAIN ENGLISH HUMIDITY (Kahului style)
  // ============================================================
  {
    id: 'humid-outdoor-rh',
    regex: /\bOutdoor\s*RH/i,
    brickClass: brick('Outside_Air_Humidity_Sensor', 'Outdoor RH Sensor', 'Humidity'),
    haystackTags: tags(['sensor', 'humidity', 'outside', 'air', 'point']),
    baseConfidence: 0.93,
    expectedUnits: ['percent', 'percent-relative-humidity'],
    category: 'humidity',
  },

  // ============================================================
  // RPM / IGV / COMPRESSOR DEMAND (Kahului style)
  // ============================================================
  {
    id: 'motor-rpm',
    regex: /\b(RPM|Revolutions\s*Per\s*Minute)/i,
    brickClass: brick('Motor_Speed_Sensor', 'Motor RPM Sensor', 'Motor'),
    haystackTags: tags(['sensor', 'motor', 'speed', 'point']),
    baseConfidence: 0.90,
    expectedUnits: ['revolutions-per-minute'],
    category: 'fan',
  },
  {
    id: 'motor-igv',
    regex: /\bIGV/i,
    brickClass: brick('Inlet_Guide_Vane_Command', 'Inlet Guide Vane Position', 'Motor'),
    haystackTags: tags(['cmd', 'compressor', 'vane', 'point']),
    baseConfidence: 0.88,
    expectedUnits: ['percent'],
    category: 'equipment',
  },
  {
    id: 'motor-compressor-demand',
    regex: /\bCompressor\s*([-_]?\d+)?\s*Demand/i,
    brickClass: brick('Compressor_Demand_Sensor', 'Compressor Demand', 'Motor'),
    haystackTags: tags(['sensor', 'compressor', 'demand', 'point']),
    baseConfidence: 0.90,
    expectedUnits: ['percent'],
    category: 'equipment',
  },
  {
    id: 'motor-run-hours',
    regex: /\b(Run\s*H(ou)?rs?|Running\s*Hours?|Operating\s*Hours?|RUN\s*TIME)\b/i,
    brickClass: brick('Run_Time_Sensor', 'Run Hours Sensor', 'Status'),
    haystackTags: tags(['sensor', 'run', 'duration', 'point']),
    baseConfidence: 0.88,
    expectedUnits: ['hours'],
    category: 'status',
  },

  // ============================================================
  // OCCUPANCY (Kahului style)
  // ============================================================
  {
    id: 'occ-occupancy',
    regex: /\bOccupancy\b/i,
    brickClass: brick('Occupancy_Sensor', 'Occupancy Sensor', 'Occupancy'),
    haystackTags: tags(['sensor', 'occupied', 'point']),
    baseConfidence: 0.88,
    category: 'occupancy',
  },

  // ============================================================
  // COOLING/NIGHT MODE (Kahului style)
  // ============================================================
  {
    id: 'mode-night-cooling',
    regex: /\bNight\s*Cooling\s*Mode/i,
    brickClass: brick('Night_Cooling_Mode', 'Night Cooling Mode', 'Occupancy'),
    haystackTags: tags(['sensor', 'cooling', 'night', 'mode', 'point']),
    baseConfidence: 0.85,
    category: 'occupancy',
  },

  // ============================================================
  // CHILLER PLANT (Kahului style)
  // ============================================================
  {
    id: 'chiller-load',
    regex: /\b(Calculated\s*)?Chiller[-_]?\d*\s*(Plant\s*)?(Load|Capacity)/i,
    brickClass: brick('Thermal_Power_Sensor', 'Chiller Load', 'Equipment'),
    haystackTags: tags(['sensor', 'chiller', 'load', 'point']),
    baseConfidence: 0.88,
    category: 'equipment',
  },
  {
    id: 'chiller-kw-ton',
    regex: /\b(Calculated\s*)?kW\s*\/?\s*Ton/i,
    brickClass: brick('Efficiency_Sensor', 'kW/Ton Efficiency', 'Equipment'),
    haystackTags: tags(['sensor', 'chiller', 'efficiency', 'point']),
    baseConfidence: 0.90,
    category: 'equipment',
  },
  {
    id: 'chiller-isolation-valve',
    regex: /\bIsolation\s*Valve\s*(Command|Position)?/i,
    brickClass: brick('Isolation_Valve_Command', 'Isolation Valve Command', 'Valve'),
    haystackTags: tags(['cmd', 'valve', 'isolation', 'point']),
    baseConfidence: 0.88,
    category: 'valve',
  },

  // ============================================================
  // AUTOMATED LOGIC ABBREVIATIONS (2101 Webster St style)
  // Naming: underscore-separated, _N suffix, ALC abbreviations
  // ============================================================

  // --- ALC Temperature ---
  { id: 'alc-zone-temp', regex: /\bzone[\s_]?temp\b/i, brickClass: brick('Zone_Air_Temperature_Sensor', 'Zone Temperature', 'Temperature'), haystackTags: tags(['sensor', 'temp', 'zone', 'air', 'point']), baseConfidence: 0.93, expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'], category: 'temperature' },
  { id: 'alc-zone-hi', regex: /\bzone[\s_]?hi\b/i, brickClass: brick('Zone_Air_Temperature_Heating_Setpoint', 'Zone Temp High Limit', 'Temperature'), haystackTags: tags(['sp', 'temp', 'zone', 'air', 'heating', 'point']), baseConfidence: 0.88, category: 'temperature' },
  { id: 'alc-zone-lo', regex: /\bzone[\s_]?lo\b/i, brickClass: brick('Zone_Air_Temperature_Cooling_Setpoint', 'Zone Temp Low Limit', 'Temperature'), haystackTags: tags(['sp', 'temp', 'zone', 'air', 'cooling', 'point']), baseConfidence: 0.88, category: 'temperature' },
  { id: 'alc-dat', regex: /\bdat\b(?![\s_]*(hi|lo))/i, brickClass: brick('Discharge_Air_Temperature_Sensor', 'Discharge Air Temperature', 'Temperature'), haystackTags: tags(['sensor', 'temp', 'discharge', 'air', 'point']), baseConfidence: 0.90, expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'], category: 'temperature' },
  { id: 'alc-dat-hi', regex: /\bdat[\s_]?hi\b/i, brickClass: brick('Discharge_Air_Temperature_High_Limit', 'Discharge Air Temp High Limit', 'Temperature'), haystackTags: tags(['sp', 'temp', 'discharge', 'air', 'max', 'point']), baseConfidence: 0.88, category: 'temperature' },
  { id: 'alc-dat-lo', regex: /\bdat[\s_]?lo\b/i, brickClass: brick('Discharge_Air_Temperature_Low_Limit', 'Discharge Air Temp Low Limit', 'Temperature'), haystackTags: tags(['sp', 'temp', 'discharge', 'air', 'min', 'point']), baseConfidence: 0.88, category: 'temperature' },
  { id: 'alc-da-temp', regex: /\bda[\s_]?temp\b/i, brickClass: brick('Discharge_Air_Temperature_Sensor', 'Discharge Air Temperature', 'Temperature'), haystackTags: tags(['sensor', 'temp', 'discharge', 'air', 'point']), baseConfidence: 0.90, expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'], category: 'temperature' },
  { id: 'alc-sat', regex: /\bsat\b(?![\s_]*(hi|lo))/i, brickClass: brick('Supply_Air_Temperature_Sensor', 'Supply Air Temperature', 'Temperature'), haystackTags: tags(['sensor', 'temp', 'supply', 'air', 'point']), baseConfidence: 0.88, expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'], category: 'temperature' },
  { id: 'alc-sat-hi', regex: /\bsat[\s_]?hi\b/i, brickClass: brick('Supply_Air_Temperature_High_Limit', 'Supply Air Temp High', 'Temperature'), haystackTags: tags(['sp', 'temp', 'supply', 'air', 'max', 'point']), baseConfidence: 0.85, category: 'temperature' },
  { id: 'alc-sat-lo', regex: /\bsat[\s_]?lo\b/i, brickClass: brick('Supply_Air_Temperature_Low_Limit', 'Supply Air Temp Low', 'Temperature'), haystackTags: tags(['sp', 'temp', 'supply', 'air', 'min', 'point']), baseConfidence: 0.85, category: 'temperature' },
  { id: 'alc-mat', regex: /\bmat\b(?![\s_]*(hi|lo))/i, brickClass: brick('Mixed_Air_Temperature_Sensor', 'Mixed Air Temperature', 'Temperature'), haystackTags: tags(['sensor', 'temp', 'mixed', 'air', 'point']), baseConfidence: 0.88, expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'], category: 'temperature' },
  { id: 'alc-mat-hi', regex: /\bmat[\s_]?hi\b/i, brickClass: brick('Mixed_Air_Temperature_High_Limit', 'Mixed Air Temp High', 'Temperature'), haystackTags: tags(['sp', 'temp', 'mixed', 'air', 'max', 'point']), baseConfidence: 0.85, category: 'temperature' },
  { id: 'alc-mat-lo', regex: /\bmat[\s_]?lo\b/i, brickClass: brick('Mixed_Air_Temperature_Low_Limit', 'Mixed Air Temp Low', 'Temperature'), haystackTags: tags(['sp', 'temp', 'mixed', 'air', 'min', 'point']), baseConfidence: 0.85, category: 'temperature' },
  { id: 'alc-rat', regex: /\brat\b(?![\s_]*(hi|lo))/i, brickClass: brick('Return_Air_Temperature_Sensor', 'Return Air Temperature', 'Temperature'), haystackTags: tags(['sensor', 'temp', 'return', 'air', 'point']), baseConfidence: 0.88, expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'], category: 'temperature' },
  { id: 'alc-rat-hi', regex: /\brat[\s_]?hi\b/i, brickClass: brick('Return_Air_Temperature_High_Limit', 'Return Air Temp High', 'Temperature'), haystackTags: tags(['sp', 'temp', 'return', 'air', 'max', 'point']), baseConfidence: 0.85, category: 'temperature' },
  { id: 'alc-rat-lo', regex: /\brat[\s_]?lo\b/i, brickClass: brick('Return_Air_Temperature_Low_Limit', 'Return Air Temp Low', 'Temperature'), haystackTags: tags(['sp', 'temp', 'return', 'air', 'min', 'point']), baseConfidence: 0.85, category: 'temperature' },
  { id: 'alc-oat', regex: /\b(oat|zs[\s_]?oat[\s_]?display)\b/i, brickClass: brick('Outside_Air_Temperature_Sensor', 'Outside Air Temperature', 'Temperature'), haystackTags: tags(['sensor', 'temp', 'outside', 'air', 'point']), baseConfidence: 0.90, expectedUnits: ['degrees-fahrenheit', 'degrees-celsius'], category: 'temperature' },
  { id: 'alc-ztmp-hi', regex: /\bztmp[\s_]?hi\b/i, brickClass: brick('Zone_Air_Temperature_Heating_Setpoint', 'Zone Temp High Limit', 'Temperature'), haystackTags: tags(['sp', 'temp', 'zone', 'max', 'point']), baseConfidence: 0.85, category: 'temperature' },
  { id: 'alc-ztmp-lo', regex: /\bztmp[\s_]?lo\b/i, brickClass: brick('Zone_Air_Temperature_Cooling_Setpoint', 'Zone Temp Low Limit', 'Temperature'), haystackTags: tags(['sp', 'temp', 'zone', 'min', 'point']), baseConfidence: 0.85, category: 'temperature' },
  { id: 'alc-dstp-hi', regex: /\bdstp[\s_]?hi\b/i, brickClass: brick('Duct_Static_Pressure_High_Limit', 'Duct Static High Limit', 'Pressure'), haystackTags: tags(['sp', 'pressure', 'duct', 'static', 'max', 'point']), baseConfidence: 0.85, category: 'pressure' },
  { id: 'alc-dstp-lo', regex: /\bdstp[\s_]?lo\b/i, brickClass: brick('Duct_Static_Pressure_Low_Limit', 'Duct Static Low Limit', 'Pressure'), haystackTags: tags(['sp', 'pressure', 'duct', 'static', 'min', 'point']), baseConfidence: 0.85, category: 'pressure' },

  // --- ALC Setpoints ---
  { id: 'alc-sasp', regex: /\bsasp\b/i, brickClass: brick('Supply_Air_Temperature_Setpoint', 'Supply Air Setpoint', 'Setpoint'), haystackTags: tags(['sp', 'temp', 'supply', 'air', 'point']), baseConfidence: 0.90, category: 'setpoint' },
  { id: 'alc-dasp', regex: /\bdasp\b/i, brickClass: brick('Discharge_Air_Temperature_Setpoint', 'Discharge Air Setpoint', 'Setpoint'), haystackTags: tags(['sp', 'temp', 'discharge', 'air', 'point']), baseConfidence: 0.90, category: 'setpoint' },
  { id: 'alc-dpsp', regex: /\bdpsp\b/i, brickClass: brick('Duct_Static_Pressure_Setpoint', 'Duct Pressure Setpoint', 'Setpoint'), haystackTags: tags(['sp', 'pressure', 'duct', 'static', 'point']), baseConfidence: 0.90, expectedUnits: ['inches-of-water'], category: 'setpoint' },
  { id: 'alc-bpsp', regex: /\bbpsp\b/i, brickClass: brick('Building_Static_Pressure_Setpoint', 'Building Pressure Setpoint', 'Setpoint'), haystackTags: tags(['sp', 'pressure', 'building', 'static', 'point']), baseConfidence: 0.88, category: 'setpoint' },
  { id: 'alc-co2sp', regex: /\bco2[\s_]?sp\b/i, brickClass: brick('CO2_Setpoint', 'CO2 Setpoint', 'Setpoint'), haystackTags: tags(['sp', 'co2', 'point']), baseConfidence: 0.90, expectedUnits: ['parts-per-million'], category: 'setpoint' },
  { id: 'alc-masp', regex: /\bmasp\b/i, brickClass: brick('Mixed_Air_Temperature_Setpoint', 'Mixed Air Setpoint', 'Setpoint'), haystackTags: tags(['sp', 'temp', 'mixed', 'air', 'point']), baseConfidence: 0.88, category: 'setpoint' },
  { id: 'alc-sup-flow-setpt', regex: /\bsup[\s_]?flow[\s_]?(setpt|sp)\b/i, brickClass: brick('Air_Flow_Setpoint', 'Supply Flow Setpoint', 'Setpoint'), haystackTags: tags(['sp', 'air', 'flow', 'supply', 'point']), baseConfidence: 0.92, expectedUnits: ['cubic-feet-per-minute'], category: 'setpoint' },

  // --- ALC Flow/CFM ---
  { id: 'alc-cfm-dev', regex: /\bcfm[\s_]?dev\b/i, brickClass: brick('Air_Flow_Deviation_Sensor', 'CFM Deviation', 'Flow'), haystackTags: tags(['sensor', 'air', 'flow', 'err', 'point']), baseConfidence: 0.88, expectedUnits: ['cubic-feet-per-minute'], category: 'flow' },
  { id: 'alc-cfm-hi', regex: /\bcfm[\s_]?hi\b/i, brickClass: brick('Max_Air_Flow_Setpoint_Limit', 'CFM High Limit', 'Flow'), haystackTags: tags(['sp', 'air', 'flow', 'max', 'point']), baseConfidence: 0.88, expectedUnits: ['cubic-feet-per-minute'], category: 'flow' },
  { id: 'alc-cfm-lo', regex: /\bcfm[\s_]?lo\b/i, brickClass: brick('Min_Air_Flow_Setpoint_Limit', 'CFM Low Limit', 'Flow'), haystackTags: tags(['sp', 'air', 'flow', 'min', 'point']), baseConfidence: 0.88, expectedUnits: ['cubic-feet-per-minute'], category: 'flow' },
  { id: 'alc-sup-flow', regex: /\bsup[\s_]?flow[\s_]?actual\b/i, brickClass: brick('Supply_Air_Flow_Sensor', 'Supply Air Flow Actual', 'Flow'), haystackTags: tags(['sensor', 'air', 'flow', 'supply', 'point']), baseConfidence: 0.93, expectedUnits: ['cubic-feet-per-minute'], category: 'flow' },
  { id: 'alc-flow-input', regex: /\bflow[\s_]?input\b/i, brickClass: brick('Air_Flow_Sensor', 'Flow Input', 'Flow'), haystackTags: tags(['sensor', 'air', 'flow', 'point']), baseConfidence: 0.88, expectedUnits: ['cubic-feet-per-minute'], category: 'flow' },
  { id: 'alc-vav-cfm-total', regex: /\bvav[\s_]?cfm[\s_]?total\b/i, brickClass: brick('Air_Flow_Sensor', 'VAV Total CFM', 'Flow'), haystackTags: tags(['sensor', 'air', 'flow', 'vav', 'total', 'point']), baseConfidence: 0.90, expectedUnits: ['cubic-feet-per-minute'], category: 'flow' },
  { id: 'alc-vav-cfmsp-total', regex: /\bvav[\s_]?cfmsp[\s_]?total\b/i, brickClass: brick('Air_Flow_Setpoint', 'VAV Total CFM Setpoint', 'Flow'), haystackTags: tags(['sp', 'air', 'flow', 'vav', 'total', 'point']), baseConfidence: 0.90, expectedUnits: ['cubic-feet-per-minute'], category: 'flow' },
  { id: 'alc-occ-min-airflow', regex: /\bocc[\s_]?min[\s_]?airflow/i, brickClass: brick('Min_Air_Flow_Setpoint_Limit', 'Occupied Min Airflow', 'Flow'), haystackTags: tags(['sp', 'air', 'flow', 'min', 'occ', 'point']), baseConfidence: 0.88, category: 'flow' },

  // --- ALC Damper/Valve ---
  { id: 'alc-damper-pos', regex: /\bdamper[\s_]?pos\b/i, brickClass: brick('Damper_Position_Command', 'Damper Position', 'Damper'), haystackTags: tags(['cmd', 'damper', 'point']), baseConfidence: 0.92, expectedUnits: ['percent'], category: 'valve' },
  { id: 'alc-damper-fdbk', regex: /\bdamper[\s_]?fdbk\b/i, brickClass: brick('Damper_Position_Sensor', 'Damper Feedback', 'Damper'), haystackTags: tags(['sensor', 'damper', 'point']), baseConfidence: 0.90, expectedUnits: ['percent'], category: 'valve' },
  { id: 'alc-damper-max', regex: /\bdamper[\s_]?max\b/i, brickClass: brick('Max_Damper_Position_Setpoint', 'Damper Max Position', 'Damper'), haystackTags: tags(['sp', 'damper', 'max', 'point']), baseConfidence: 0.88, category: 'valve' },
  { id: 'alc-damper-min', regex: /\bdamper[\s_]?min\b/i, brickClass: brick('Min_Damper_Position_Setpoint', 'Damper Min Position', 'Damper'), haystackTags: tags(['sp', 'damper', 'min', 'point']), baseConfidence: 0.88, category: 'valve' },
  { id: 'alc-hwv', regex: /\bhwv\b/i, brickClass: brick('Hot_Water_Valve_Command', 'Hot Water Valve', 'Valve'), haystackTags: tags(['cmd', 'valve', 'hot', 'water', 'point']), baseConfidence: 0.90, expectedUnits: ['percent'], category: 'valve' },
  { id: 'alc-oad', regex: /\boad\b/i, brickClass: brick('Outside_Air_Damper_Command', 'Outside Air Damper', 'Damper'), haystackTags: tags(['cmd', 'damper', 'outside', 'air', 'point']), baseConfidence: 0.88, expectedUnits: ['percent'], category: 'valve' },
  { id: 'alc-ead', regex: /\bead\b/i, brickClass: brick('Exhaust_Air_Damper_Command', 'Exhaust Air Damper', 'Damper'), haystackTags: tags(['cmd', 'damper', 'exhaust', 'air', 'point']), baseConfidence: 0.88, expectedUnits: ['percent'], category: 'valve' },
  { id: 'alc-rad', regex: /\brad\b/i, brickClass: brick('Return_Air_Damper_Command', 'Return Air Damper', 'Damper'), haystackTags: tags(['cmd', 'damper', 'return', 'air', 'point']), baseConfidence: 0.88, expectedUnits: ['percent'], category: 'valve' },
  { id: 'alc-rv', regex: /\brev[\s_]?valve\b/i, brickClass: brick('Reversing_Valve_Command', 'Reversing Valve', 'Valve'), haystackTags: tags(['cmd', 'valve', 'reversing', 'point']), baseConfidence: 0.85, category: 'valve' },
  { id: 'alc-ra-damper', regex: /\bra[\s_]?damper\b/i, brickClass: brick('Return_Air_Damper_Command', 'Return Air Damper', 'Damper'), haystackTags: tags(['cmd', 'damper', 'return', 'air', 'point']), baseConfidence: 0.88, category: 'valve' },

  // --- ALC Fan/Motor ---
  { id: 'alc-sfss', regex: /\bsfss\b/i, brickClass: brick('Supply_Fan_Start_Stop_Command', 'Supply Fan Start/Stop', 'Fan'), haystackTags: tags(['cmd', 'fan', 'supply', 'run', 'point']), baseConfidence: 0.90, category: 'fan' },
  { id: 'alc-sfst', regex: /\bsfst\b/i, brickClass: brick('Supply_Fan_Status', 'Supply Fan Status', 'Fan'), haystackTags: tags(['sensor', 'fan', 'supply', 'run', 'point']), baseConfidence: 0.90, category: 'fan' },
  { id: 'alc-sf-fail', regex: /\bsf[\s_]?fail\b/i, brickClass: brick('Supply_Fan_Alarm', 'Supply Fan Failure', 'Fan'), haystackTags: tags(['sensor', 'fan', 'supply', 'alarm', 'point']), baseConfidence: 0.90, category: 'fan' },
  { id: 'alc-sf-hand', regex: /\bsf[\s_]?hand\b/i, brickClass: brick('Supply_Fan_Override_Status', 'Supply Fan Hand Mode', 'Fan'), haystackTags: tags(['sensor', 'fan', 'supply', 'override', 'point']), baseConfidence: 0.85, category: 'fan' },
  { id: 'alc-sf-rntm', regex: /\bsf[\s_]?rntm\b/i, brickClass: brick('Supply_Fan_Run_Time_Sensor', 'Supply Fan Runtime', 'Fan'), haystackTags: tags(['sensor', 'fan', 'supply', 'run', 'duration', 'point']), baseConfidence: 0.88, expectedUnits: ['hours'], category: 'fan' },
  { id: 'alc-sf-hz', regex: /\bsf[\s_]?hz\b/i, brickClass: brick('Supply_Fan_Speed_Sensor', 'Supply Fan Speed Hz', 'Fan'), haystackTags: tags(['sensor', 'fan', 'supply', 'freq', 'point']), baseConfidence: 0.90, expectedUnits: ['hertz'], category: 'fan' },
  { id: 'alc-sf-vfd', regex: /\bsf[\s_]?vfd\b/i, brickClass: brick('Supply_Fan_VFD_Speed_Command', 'Supply Fan VFD', 'Fan'), haystackTags: tags(['cmd', 'fan', 'supply', 'speed', 'vfd', 'point']), baseConfidence: 0.88, expectedUnits: ['percent'], category: 'fan' },
  { id: 'alc-sf-fault', regex: /\bsf[\s_]?fault\b/i, brickClass: brick('Supply_Fan_Alarm', 'Supply Fan Fault', 'Fan'), haystackTags: tags(['sensor', 'fan', 'supply', 'alarm', 'point']), baseConfidence: 0.88, category: 'fan' },
  { id: 'alc-efss', regex: /\befss\b/i, brickClass: brick('Exhaust_Fan_Start_Stop_Command', 'Exhaust Fan Start/Stop', 'Fan'), haystackTags: tags(['cmd', 'fan', 'exhaust', 'run', 'point']), baseConfidence: 0.88, category: 'fan' },
  { id: 'alc-efst', regex: /\befst\b/i, brickClass: brick('Exhaust_Fan_Status', 'Exhaust Fan Status', 'Fan'), haystackTags: tags(['sensor', 'fan', 'exhaust', 'run', 'point']), baseConfidence: 0.88, category: 'fan' },
  { id: 'alc-ef-rntm', regex: /\bef[\s_]?rntm\b/i, brickClass: brick('Exhaust_Fan_Run_Time_Sensor', 'Exhaust Fan Runtime', 'Fan'), haystackTags: tags(['sensor', 'fan', 'exhaust', 'run', 'duration', 'point']), baseConfidence: 0.85, expectedUnits: ['hours'], category: 'fan' },
  { id: 'alc-fan-run', regex: /\bfan[\s_]?run\b/i, brickClass: brick('Fan_On_Off_Status', 'Fan Run Status', 'Fan'), haystackTags: tags(['sensor', 'fan', 'run', 'point']), baseConfidence: 0.88, category: 'fan' },
  { id: 'alc-fan-fail', regex: /\bfan[\s_]?fail\b/i, brickClass: brick('Fan_Alarm', 'Fan Failure', 'Fan'), haystackTags: tags(['sensor', 'fan', 'alarm', 'point']), baseConfidence: 0.88, category: 'fan' },
  { id: 'alc-fan-hand', regex: /\bfan[\s_]?hand\b/i, brickClass: brick('Fan_Override_Status', 'Fan Hand Mode', 'Fan'), haystackTags: tags(['sensor', 'fan', 'override', 'point']), baseConfidence: 0.85, category: 'fan' },
  { id: 'alc-fan-rntm', regex: /\bfan[\s_]?rntm\b/i, brickClass: brick('Fan_Run_Time_Sensor', 'Fan Runtime', 'Fan'), haystackTags: tags(['sensor', 'fan', 'run', 'duration', 'point']), baseConfidence: 0.85, expectedUnits: ['hours'], category: 'fan' },
  { id: 'alc-sfan-amps', regex: /\bsfan[\s_]?amps\b/i, brickClass: brick('Fan_Current_Sensor', 'Supply Fan Amps', 'Fan'), haystackTags: tags(['sensor', 'fan', 'supply', 'current', 'elec', 'point']), baseConfidence: 0.90, expectedUnits: ['amperes'], category: 'fan' },

  // --- ALC Heating/Cooling ---
  { id: 'alc-heat-request', regex: /\bheat[\s_]?request\b/i, brickClass: brick('Heating_Request', 'Heating Request', 'Heating'), haystackTags: tags(['cmd', 'heating', 'request', 'point']), baseConfidence: 0.90, category: 'setpoint' },
  { id: 'alc-cool-request', regex: /\bcool[\s_]?request\b/i, brickClass: brick('Cooling_Request', 'Cooling Request', 'Cooling'), haystackTags: tags(['cmd', 'cooling', 'request', 'point']), baseConfidence: 0.90, category: 'setpoint' },
  { id: 'alc-clg-pct', regex: /\bclg[\s_]?pct\b/i, brickClass: brick('Cooling_Command', 'Cooling Percentage', 'Cooling'), haystackTags: tags(['cmd', 'cooling', 'point']), baseConfidence: 0.88, expectedUnits: ['percent'], category: 'setpoint' },
  { id: 'alc-htg-pct', regex: /\bhtg[\s_]?pct\b/i, brickClass: brick('Heating_Command', 'Heating Percentage', 'Heating'), haystackTags: tags(['cmd', 'heating', 'point']), baseConfidence: 0.88, expectedUnits: ['percent'], category: 'setpoint' },
  { id: 'alc-heatmode', regex: /\bheatmode\b/i, brickClass: brick('Heating_Mode_Status', 'Heating Mode', 'Status'), haystackTags: tags(['sensor', 'heating', 'mode', 'point']), baseConfidence: 0.85, category: 'status' },
  { id: 'alc-unocc-frz', regex: /\b(unocc|hw)[\s_]?frz\b/i, brickClass: brick('Freeze_Protection_Status', 'Unoccupied Freeze Protection', 'Status'), haystackTags: tags(['sensor', 'freeze', 'protection', 'point']), baseConfidence: 0.85, category: 'status' },

  // --- ALC Occupancy/Override ---
  { id: 'alc-occ-status', regex: /\bocc[\s_]?status\b/i, brickClass: brick('Occupancy_Status', 'Occupancy Status', 'Occupancy'), haystackTags: tags(['sensor', 'occupied', 'point']), baseConfidence: 0.92, category: 'occupancy' },
  { id: 'alc-ovrd', regex: /\bovrd\b/i, brickClass: brick('Override_Command', 'Override', 'Override'), haystackTags: tags(['cmd', 'override', 'point']), baseConfidence: 0.85, category: 'diagnostic' },
  { id: 'alc-ovrd-time', regex: /\b(ovrd[\s_]?time|override[\s_]?time[\s_]?remaining)\b/i, brickClass: brick('Override_Timer', 'Override Time Remaining', 'Override'), haystackTags: tags(['sensor', 'override', 'duration', 'point']), baseConfidence: 0.85, expectedUnits: ['minutes', 'seconds'], category: 'diagnostic' },

  // --- ALC Pressure ---
  { id: 'alc-stat-press', regex: /\bstat(ic)?[\s_]?press\b/i, brickClass: brick('Duct_Static_Pressure_Sensor', 'Static Pressure', 'Pressure'), haystackTags: tags(['sensor', 'pressure', 'duct', 'static', 'point']), baseConfidence: 0.90, expectedUnits: ['inches-of-water', 'pascals'], category: 'pressure' },
  { id: 'alc-static-request', regex: /\bstatic[\s_]?request\b/i, brickClass: brick('Static_Pressure_Request', 'Static Pressure Request', 'Pressure'), haystackTags: tags(['cmd', 'pressure', 'static', 'request', 'point']), baseConfidence: 0.88, category: 'pressure' },
  { id: 'alc-bstp', regex: /\bbstp\b/i, brickClass: brick('Building_Static_Pressure_Sensor', 'Building Static Pressure', 'Pressure'), haystackTags: tags(['sensor', 'pressure', 'building', 'static', 'point']), baseConfidence: 0.88, expectedUnits: ['inches-of-water'], category: 'pressure' },
  { id: 'alc-bstp-hi', regex: /\bbstp[\s_]?hi\b/i, brickClass: brick('Building_Static_Pressure_High_Limit', 'Building Static High', 'Pressure'), haystackTags: tags(['sp', 'pressure', 'building', 'static', 'max', 'point']), baseConfidence: 0.85, category: 'pressure' },
  { id: 'alc-bstp-lo', regex: /\bbstp[\s_]?lo\b/i, brickClass: brick('Building_Static_Pressure_Low_Limit', 'Building Static Low', 'Pressure'), haystackTags: tags(['sp', 'pressure', 'building', 'static', 'min', 'point']), baseConfidence: 0.85, category: 'pressure' },

  // --- ALC CO2 ---
  { id: 'alc-zone-co2', regex: /\bzone[\s_]?co2\b/i, brickClass: brick('Zone_CO2_Level_Sensor', 'Zone CO2', 'AirQuality'), haystackTags: tags(['sensor', 'co2', 'zone', 'air', 'point']), baseConfidence: 0.92, expectedUnits: ['parts-per-million'], category: 'co2' },
  { id: 'alc-zco2-fail', regex: /\bzco2[\s_]?fail\b/i, brickClass: brick('CO2_Sensor_Alarm', 'CO2 Sensor Failure', 'AirQuality'), haystackTags: tags(['sensor', 'co2', 'alarm', 'point']), baseConfidence: 0.85, category: 'co2' },
  { id: 'alc-zco2-hi', regex: /\bzco2[\s_]?hi\b/i, brickClass: brick('CO2_High_Limit', 'CO2 High Limit', 'AirQuality'), haystackTags: tags(['sp', 'co2', 'max', 'point']), baseConfidence: 0.85, category: 'co2' },
  { id: 'alc-co2-hi', regex: /\bco2[\s_]?hi\b/i, brickClass: brick('CO2_High_Limit', 'CO2 High Limit', 'AirQuality'), haystackTags: tags(['sp', 'co2', 'max', 'point']), baseConfidence: 0.85, category: 'co2' },

  // --- ALC Runtime ---
  { id: 'alc-cmp-rntm', regex: /\bcmp[\s_]?rntm\b/i, brickClass: brick('Compressor_Run_Time_Sensor', 'Compressor Runtime', 'Status'), haystackTags: tags(['sensor', 'compressor', 'run', 'duration', 'point']), baseConfidence: 0.88, expectedUnits: ['hours'], category: 'status' },
  { id: 'alc-bp-rntm', regex: /\bbp[\s_]?rntm\b/i, brickClass: brick('Boiler_Run_Time_Sensor', 'Boiler/Pump Runtime', 'Status'), haystackTags: tags(['sensor', 'pump', 'run', 'duration', 'point']), baseConfidence: 0.85, expectedUnits: ['hours'], category: 'status' },

  // --- ALC Status ---
  { id: 'alc-zst-fail', regex: /\bzst[\s_]?fail\b/i, brickClass: brick('Zone_Sensor_Alarm', 'Zone Sensor Failure', 'Alarm'), haystackTags: tags(['sensor', 'alarm', 'zone', 'point']), baseConfidence: 0.85, category: 'alarm' },
  { id: 'alc-zs-comm', regex: /\bzs[\s_]?comm\b/i, brickClass: brick('Zone_Sensor_Communication_Status', 'Zone Sensor Communication', 'Diagnostic'), haystackTags: tags(['sensor', 'comm', 'zone', 'point']), baseConfidence: 0.85, category: 'diagnostic' },
  { id: 'alc-comp', regex: /\bcomp\d*\b/i, brickClass: brick('Compressor_Command', 'Compressor Command', 'Equipment'), haystackTags: tags(['cmd', 'compressor', 'point']), baseConfidence: 0.80, category: 'equipment' },
  { id: 'alc-comp-ss', regex: /\bcomp\d*[\s_]?ss\b/i, brickClass: brick('Compressor_Start_Stop_Command', 'Compressor Start/Stop', 'Equipment'), haystackTags: tags(['cmd', 'compressor', 'run', 'point']), baseConfidence: 0.88, category: 'equipment' },
  { id: 'alc-cond-lvl', regex: /\bcond[\s_]?lvl\b/i, brickClass: brick('Condensate_Level_Sensor', 'Condensate Level', 'Equipment'), haystackTags: tags(['sensor', 'condensate', 'level', 'point']), baseConfidence: 0.85, category: 'equipment' },
  { id: 'alc-filter', regex: /\bfilter\b/i, brickClass: brick('Filter_Differential_Pressure_Sensor', 'Filter Status', 'Equipment'), haystackTags: tags(['sensor', 'filter', 'point']), baseConfidence: 0.70, category: 'equipment' },
  { id: 'alc-cws', regex: /\bcws\b/i, brickClass: brick('Chilled_Water_Supply_Temperature_Sensor', 'Chilled Water Supply', 'Temperature'), haystackTags: tags(['sensor', 'temp', 'chilled', 'water', 'supply', 'point']), baseConfidence: 0.85, expectedUnits: ['degrees-fahrenheit'], category: 'temperature' },
  { id: 'alc-cw-request', regex: /\bcw[\s_]?request\b/i, brickClass: brick('Chilled_Water_Request', 'Chilled Water Request', 'Equipment'), haystackTags: tags(['cmd', 'chilled', 'water', 'request', 'point']), baseConfidence: 0.88, category: 'equipment' },
  { id: 'alc-run-req-code', regex: /\brun[\s_]?req[\s_]?code\b/i, brickClass: brick('Run_Request_Status', 'Run Request Code', 'Status'), haystackTags: tags(['sensor', 'run', 'request', 'point']), baseConfidence: 0.80, category: 'status' },

  // --- ALC Economizer ---
  { id: 'alc-oae', regex: /\boae\b/i, brickClass: brick('Economizer_Enable_Status', 'Outside Air Economizer', 'Diagnostic'), haystackTags: tags(['sensor', 'economizer', 'outside', 'air', 'point']), baseConfidence: 0.85, category: 'diagnostic' },
  { id: 'alc-econ', regex: /\becon\b/i, brickClass: brick('Economizer_Mode_Status', 'Economizer Mode', 'Diagnostic'), haystackTags: tags(['sensor', 'economizer', 'mode', 'point']), baseConfidence: 0.80, category: 'diagnostic' },

  // --- ALC Humidity ---
  { id: 'alc-oah', regex: /\b(oah|zs[\s_]?oah[\s_]?display)\b/i, brickClass: brick('Outside_Air_Humidity_Sensor', 'Outside Air Humidity', 'Humidity'), haystackTags: tags(['sensor', 'humidity', 'outside', 'air', 'point']), baseConfidence: 0.88, expectedUnits: ['percent', 'percent-relative-humidity'], category: 'humidity' },
  { id: 'alc-oa-humidity', regex: /\boa[\s_]?humidity\b/i, brickClass: brick('Outside_Air_Humidity_Sensor', 'Outside Air Humidity', 'Humidity'), haystackTags: tags(['sensor', 'humidity', 'outside', 'air', 'point']), baseConfidence: 0.92, expectedUnits: ['percent', 'percent-relative-humidity'], category: 'humidity' },

  // --- ALC Power ---
  { id: 'alc-kwh-counter', regex: /\bkwh[\s_]?counter\b/i, brickClass: brick('Electric_Energy_Sensor', 'kWh Counter', 'Energy'), haystackTags: tags(['sensor', 'elec', 'energy', 'point']), baseConfidence: 0.92, expectedUnits: ['kilowatt-hours'], category: 'power' },
  { id: 'alc-output-freq', regex: /\boutput[\s_]?freq\b/i, brickClass: brick('Frequency_Sensor', 'Output Frequency', 'Motor'), haystackTags: tags(['sensor', 'motor', 'freq', 'point']), baseConfidence: 0.88, expectedUnits: ['hertz'], category: 'power' },
  { id: 'alc-output-volts', regex: /\boutput[\s_]?volts\b/i, brickClass: brick('Voltage_Sensor', 'Output Voltage', 'Power'), haystackTags: tags(['sensor', 'elec', 'volt', 'point']), baseConfidence: 0.88, expectedUnits: ['volts'], category: 'power' },

  // --- ALC Leak/Water ---
  { id: 'alc-leak-alarm', regex: /\bleak[\s_]?alarm\b/i, brickClass: brick('Leak_Alarm', 'Water Leak Alarm', 'Alarm'), haystackTags: tags(['sensor', 'alarm', 'leak', 'water', 'point']), baseConfidence: 0.92, category: 'alarm' },
  { id: 'alc-cwf-fail', regex: /\bcwf[\s_]?fail\b/i, brickClass: brick('Chilled_Water_Flow_Alarm', 'CHW Flow Failure', 'Alarm'), haystackTags: tags(['sensor', 'alarm', 'chilled', 'water', 'flow', 'point']), baseConfidence: 0.88, category: 'alarm' },
  { id: 'alc-bp-fail', regex: /\bbp[\s_]?fail\b/i, brickClass: brick('Boiler_Pump_Alarm', 'Boiler/Pump Failure', 'Alarm'), haystackTags: tags(['sensor', 'alarm', 'pump', 'point']), baseConfidence: 0.85, category: 'alarm' },
  { id: 'alc-bp-hand', regex: /\bbp[\s_]?hand\b/i, brickClass: brick('Pump_Override_Status', 'Boiler/Pump Hand Mode', 'Status'), haystackTags: tags(['sensor', 'pump', 'override', 'point']), baseConfidence: 0.80, category: 'status' },

  // --- ALC DX Stages ---
  { id: 'alc-dx', regex: /\bdx\d+\b/i, brickClass: brick('DX_Cooling_Stage_Command', 'DX Cooling Stage', 'Equipment'), haystackTags: tags(['cmd', 'cooling', 'dx', 'stage', 'point']), baseConfidence: 0.82, category: 'equipment' },

  // --- ALC Schedule ---
  { id: 'alc-schedule', regex: /\bschedule\b/i, brickClass: brick('Occupancy_Schedule', 'Schedule', 'Schedule'), haystackTags: tags(['schedule', 'occ', 'point']), baseConfidence: 0.82, category: 'schedule' },

  // --- ALC OK flags (heating/cooling/economizer OK) ---
  { id: 'alc-hok', regex: /\bhok\b/i, brickClass: brick('Heating_Enable_Status', 'Heating OK', 'Status'), haystackTags: tags(['sensor', 'heating', 'enable', 'point']), baseConfidence: 0.80, category: 'status' },
  { id: 'alc-cok', regex: /\bcok\b/i, brickClass: brick('Cooling_Enable_Status', 'Cooling OK', 'Status'), haystackTags: tags(['sensor', 'cooling', 'enable', 'point']), baseConfidence: 0.80, category: 'status' },
  { id: 'alc-eok', regex: /\beok\b/i, brickClass: brick('Economizer_Enable_Status', 'Economizer OK', 'Status'), haystackTags: tags(['sensor', 'economizer', 'enable', 'point']), baseConfidence: 0.78, category: 'status' },

  // --- ALC Pump start/stop/status ---
  { id: 'alc-bpst', regex: /\bbpst\b/i, brickClass: brick('Pump_Status', 'Boiler Pump Status', 'Status'), haystackTags: tags(['sensor', 'pump', 'run', 'point']), baseConfidence: 0.85, category: 'status' },
  { id: 'alc-bpss', regex: /\bbpss\b/i, brickClass: brick('Pump_Start_Stop_Command', 'Boiler Pump Start/Stop', 'Status'), haystackTags: tags(['cmd', 'pump', 'run', 'point']), baseConfidence: 0.85, category: 'status' },

  // --- ALC Warmup/Cooldown ---
  { id: 'alc-warmup', regex: /\bwarmup\b/i, brickClass: brick('Warmup_Mode_Status', 'Warmup Mode', 'Status'), haystackTags: tags(['sensor', 'heating', 'warmup', 'mode', 'point']), baseConfidence: 0.80, category: 'status' },
  { id: 'alc-cooldown', regex: /\bcooldown\b/i, brickClass: brick('Cooldown_Mode_Status', 'Cooldown Mode', 'Status'), haystackTags: tags(['sensor', 'cooling', 'cooldown', 'mode', 'point']), baseConfidence: 0.80, category: 'status' },

  // --- ALC Optimal start/stop ---
  { id: 'alc-opt-stop', regex: /\bopt[\s_]?(start|stop)\b/i, brickClass: brick('Optimal_Start_Stop_Status', 'Optimal Start/Stop', 'Occupancy'), haystackTags: tags(['sensor', 'occ', 'optimal', 'start', 'point']), baseConfidence: 0.82, category: 'occupancy' },

  // --- ALC CW temp limits ---
  { id: 'alc-cw-hi', regex: /\bcw[\s_]?hi\b/i, brickClass: brick('Chilled_Water_Temperature_High_Limit', 'CHW Temp High Limit', 'Temperature'), haystackTags: tags(['sp', 'temp', 'chilled', 'water', 'max', 'point']), baseConfidence: 0.83, category: 'temperature' },
  { id: 'alc-cw-lo', regex: /\bcw[\s_]?lo\b/i, brickClass: brick('Chilled_Water_Temperature_Low_Limit', 'CHW Temp Low Limit', 'Temperature'), haystackTags: tags(['sp', 'temp', 'chilled', 'water', 'min', 'point']), baseConfidence: 0.83, category: 'temperature' },

  // --- ALC SA static input ---
  { id: 'alc-sa-static', regex: /\bsa[\s_]?static\d?[\s_]?input\b/i, brickClass: brick('Duct_Static_Pressure_Sensor', 'Supply Air Static Input', 'Pressure'), haystackTags: tags(['sensor', 'pressure', 'duct', 'static', 'supply', 'air', 'point']), baseConfidence: 0.88, expectedUnits: ['inches-of-water'], category: 'pressure' },

  // --- ALC Heating Adjustment ---
  { id: 'alc-heating-adj', regex: /\bHeating[\s_]?Adjustment\b/i, brickClass: brick('Heating_Temperature_Adjustment', 'Heating Adjustment', 'Setpoint'), haystackTags: tags(['sp', 'temp', 'heating', 'adj', 'point']), baseConfidence: 0.85, category: 'setpoint' },

  // --- ALC General alarm input ---
  { id: 'alc-gen-alrm', regex: /\bgen[\s_]?alrm\b/i, brickClass: brick('Alarm', 'General Alarm', 'Alarm'), haystackTags: tags(['sensor', 'alarm', 'point']), baseConfidence: 0.78, category: 'alarm' },

  // --- ALC EF hand mode ---
  { id: 'alc-ef-hand', regex: /\bef[\s_]?hand\b/i, brickClass: brick('Exhaust_Fan_Override_Status', 'Exhaust Fan Hand Mode', 'Fan'), haystackTags: tags(['sensor', 'fan', 'exhaust', 'override', 'point']), baseConfidence: 0.82, category: 'fan' },

  // --- ALC Heat/Cool req total ---
  { id: 'alc-heat-req-total', regex: /\bheat[\s_]?req[\s_]?total\b/i, brickClass: brick('Heating_Request_Count', 'Total Heating Requests', 'Status'), haystackTags: tags(['sensor', 'heating', 'request', 'total', 'point']), baseConfidence: 0.82, category: 'status' },
  { id: 'alc-cool-req-total', regex: /\bcool[\s_]?req[\s_]?total\b/i, brickClass: brick('Cooling_Request_Count', 'Total Cooling Requests', 'Status'), haystackTags: tags(['sensor', 'cooling', 'request', 'total', 'point']), baseConfidence: 0.82, category: 'status' },
  { id: 'alc-static-req-total', regex: /\bstatic[\s_]?press[\s_]?req[\s_]?total\b/i, brickClass: brick('Static_Pressure_Request_Count', 'Total Static Pressure Requests', 'Status'), haystackTags: tags(['sensor', 'pressure', 'static', 'request', 'total', 'point']), baseConfidence: 0.80, category: 'status' },

  // --- ALC IAC setpoint ---
  { id: 'alc-iac-stpt', regex: /\biac[\s_]?stpt\b/i, brickClass: brick('Indoor_Air_Quality_Setpoint', 'IAQ Setpoint', 'Setpoint'), haystackTags: tags(['sp', 'air', 'quality', 'point']), baseConfidence: 0.80, category: 'setpoint' },

  // --- ALC OA min ---
  { id: 'alc-oa-min', regex: /\b(fix[\s_]?)?oa[\s_]?min\b/i, brickClass: brick('Min_Outside_Air_Flow_Setpoint', 'OA Minimum', 'Setpoint'), haystackTags: tags(['sp', 'air', 'flow', 'outside', 'min', 'point']), baseConfidence: 0.85, category: 'setpoint' },

  // --- ALC lvl input ---
  { id: 'alc-lvl-input', regex: /\blvl[\s_]?input\b/i, brickClass: brick('Level_Sensor', 'Level Input', 'Equipment'), haystackTags: tags(['sensor', 'level', 'point']), baseConfidence: 0.75, category: 'equipment' },
];

/**
 * Get all patterns organized by category.
 */
export function getPatternsByCategory(): Record<string, SemanticPattern[]> {
  const result: Record<string, SemanticPattern[]> = {};
  for (const p of patterns) {
    (result[p.category] ??= []).push(p);
  }
  return result;
}

/**
 * Get total pattern count.
 */
export function getPatternCount(): number {
  return patterns.length;
}
