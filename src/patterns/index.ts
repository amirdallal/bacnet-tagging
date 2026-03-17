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
