export interface Sample {
  sampleNum: number;
  h2: number;
  ch4: number;
  c2h6: number;
  c2h4: number;
  c2h2: number;
}

export interface CalculatedSample extends Sample {
  // Rogers
  r1: number; // CH4 / H2
  r2: number; // C2H6 / CH4
  r3: number; // C2H4 / C2H6
  r4: number; // C2H2 / C2H4
  rogersFault: string;
  // IEC
  i1: number; // C2H2 / C2H4
  i2: number; // CH4 / H2
  i3: number; // C2H4 / C2H6
  iecFault: string;
  // Duval Triangle 1
  sumDuval: number;
  pctCh4: number;
  pctC2h4: number;
  pctC2h2: number;
  duvalZone: string;
  // Chart coords
  chartX: number;
  chartY: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface DiagnosticExplainer {
  expert: string;
  simple: string;
}

export interface DgaExplanation {
  rogers: DiagnosticExplainer;
  iec: DiagnosticExplainer;
  duval: DiagnosticExplainer;
  overall: DiagnosticExplainer;
  recommendations: DiagnosticExplainer;
}

export const safeDivide = (num: number, den: number): number => {
  if (den === 0) return 0;
  return num / den;
};

// Projection: maps relative percentages (%CH4, %C2H2, %C2H4) to 2D Cartesian plane.
// Equilateral triangle vertices:
// Bottom Left (100% C2H4): (0, 0)
// Bottom Right (100% C2H2): (100, 0)
// Top Apex (100% CH4): (50, 86.6025)
export const toCartesian = (ch4: number, c2h2: number, c2h4: number): Point2D => {
  const sum = ch4 + c2h2 + c2h4;
  const a = sum > 0 ? (ch4 / sum) * 100 : 0;
  const b = sum > 0 ? (c2h2 / sum) * 100 : 0;
  
  return {
    x: 0.5 * a + b,
    y: a * 0.86602540378
  };
};

// Standard Ray Casting algorithm for Point-in-Polygon checks
export const isPointInPolygon = (x: number, y: number, poly: Point2D[]): boolean => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Normalized Duval Triangle 1 Zone polygons
export const pd_poly = [
  toCartesian(98, 0, 2),
  toCartesian(100, 0, 0),
  toCartesian(98, 2, 0)
];
export const d1_poly = [
  toCartesian(0, 100, 0),
  toCartesian(0, 77, 23),
  toCartesian(64, 13, 23),
  toCartesian(87, 13, 0)
];
export const d2_poly = [
  toCartesian(0, 77, 23),
  toCartesian(0, 29, 71),
  toCartesian(31, 29, 40),
  toCartesian(47, 13, 40),
  toCartesian(64, 13, 23)
];
export const dt_poly = [
  toCartesian(0, 29, 71),
  toCartesian(0, 15, 85),
  toCartesian(35, 15, 50),
  toCartesian(46, 4, 50),
  toCartesian(96, 4, 0),
  toCartesian(87, 13, 0),
  toCartesian(47, 13, 40),
  toCartesian(31, 29, 40)
];
export const t1_poly = [
  toCartesian(76, 4, 20),
  toCartesian(80, 0, 20),
  toCartesian(98, 0, 2),
  toCartesian(98, 2, 0),
  toCartesian(96, 4, 0)
];
export const t2_poly = [
  toCartesian(46, 4, 50),
  toCartesian(50, 0, 50),
  toCartesian(80, 0, 20),
  toCartesian(76, 4, 20)
];
export const t3_poly = [
  toCartesian(0, 15, 85),
  toCartesian(0, 0, 100),
  toCartesian(50, 0, 50),
  toCartesian(35, 15, 50)
];

export const getDuvalZone = (ch4: number, c2h2: number, c2h4: number): string => {
  const sum = ch4 + c2h2 + c2h4;
  if (sum === 0) return "PD";
  const pt = toCartesian(ch4, c2h2, c2h4);

  if (isPointInPolygon(pt.x, pt.y, pd_poly)) return "PD";
  if (isPointInPolygon(pt.x, pt.y, d1_poly)) return "D1";
  if (isPointInPolygon(pt.x, pt.y, d2_poly)) return "D2";
  if (isPointInPolygon(pt.x, pt.y, dt_poly)) return "DT";
  if (isPointInPolygon(pt.x, pt.y, t1_poly)) return "T1";
  if (isPointInPolygon(pt.x, pt.y, t2_poly)) return "T2";
  if (isPointInPolygon(pt.x, pt.y, t3_poly)) return "T3";
  
  return "DT";
};

// Zone Colors definition for points & chart
export const zoneColors: Record<string, string> = {
  "PD": "#b3de69",
  "D1": "#ffffb3",
  "D2": "#bebada",
  "DT": "#fb8072",
  "T1": "#80b1d3",
  "T2": "#fdb462",
  "T3": "#8dd3c7"
};

export const zoneNames: Record<string, string> = {
  "PD": "Partial Discharge",
  "D1": "Low Energy Discharge",
  "D2": "High Energy Discharge",
  "DT": "Mixed Electrical/Thermal",
  "T1": "Thermal Fault < 300°C",
  "T2": "Thermal Fault 300-700°C",
  "T3": "Thermal Fault > 700°C"
};

// Rogers ratio matching rules
export const getRogersDiagnosis = (r1: number, r2: number, r3: number, r4: number): string => {
  const code1 = r1 < 0.1 ? 0 : (r1 <= 1.0 ? 1 : (r1 <= 3.0 ? 2 : 3));
  const code2 = r2 < 1.0 ? 0 : 1;
  const code3 = r3 < 1.0 ? 0 : (r3 <= 3.0 ? 1 : 2);
  const code4 = r4 < 0.1 ? 0 : (r4 <= 3.0 ? 1 : 2);

  const codeStr = `${code1}${code2}${code3}${code4}`;

  switch (codeStr) {
    case "0000":
    case "1000":
      return "Normal";
    case "0001":
    case "0002":
      return "Partial Discharge";
    case "1001":
    case "1011":
    case "0011":
    case "0012":
      return "Low Energy Discharge";
    case "1021":
    case "1022":
    case "0021":
    case "0022":
      return "High Energy Discharge";
    case "0100":
    case "1100":
    case "0110":
    case "1110":
      return "Thermal Fault (<300°C)";
    case "0010":
    case "1010":
    case "2010":
    case "2100":
    case "2110":
      return "Thermal Fault (300–700°C)";
    case "0020":
    case "1020":
    case "2020":
    case "2120":
      return "Thermal Fault (>700°C)";
    default:
      return "Unknown / No Match";
  }
};

// IEC 60599 ratio matching rules
export const getIecDiagnosis = (i1: number, i2: number, i3: number): string => {
  const code1 = i1 < 0.1 ? 0 : (i1 <= 3.0 ? 1 : 2);
  const code2 = i2 < 0.1 ? 1 : (i2 <= 1.0 ? 0 : 2);
  const code3 = i3 < 1.0 ? 0 : (i3 <= 3.0 ? 1 : 2);

  const codeStr = `${code1}${code2}${code3}`;

  switch (codeStr) {
    case "000":
      return "No Fault";
    case "010":
      return "Partial Discharge";
    case "101":
    case "201":
    case "202":
      return "Low Energy Discharge";
    case "102":
      return "High Energy Discharge";
    case "020":
      return "Thermal Fault T1";
    case "021":
      return "Thermal Fault T2";
    case "022":
      return "Thermal Fault T3";
    default:
      return "Unknown";
  }
};

// ==========================================
// 4. TECHNICAL & ELI5 EXPLANATION GENERATOR
// ==========================================

export const getSampleExplanation = (sample: CalculatedSample): DgaExplanation => {
  // Rogers Explanations
  let rogersExpert = "";
  let rogersSimple = "";

  switch (sample.rogersFault) {
    case "Normal":
      rogersExpert = "The Rogers ratio code suggests hydrogen evolution trends and other light hydrocarbon relationships are within safe baseline limits. The methane-to-hydrogen ratio (R1) and ethane degradation pathways (R2) reveal no incipient faulting or thermal decomposition signatures.";
      rogersSimple = "All the gas indicators are normal. Think of it like a healthy heartbeat: there are no signs of overheating or electrical leaks inside.";
      break;
    case "Partial Discharge":
      rogersExpert = "A combination of R1 < 0.1 and low hydrocarbon relationships suggests active partial discharge (corona). This represents low-energy ionization activity leading to localized hydrogen evolution trends, indicating dielectric breakdown of insulation under high electric stress fields.";
      rogersSimple = "Small electric leaks are happening inside, like tiny static crackles on a sweater. This is a warning that the insulation oil might have tiny air bubbles or moisture spots.";
      break;
    case "Low Energy Discharge":
      rogersExpert = "Elevated acetylene-to-ethylene (R4) and methane-to-hydrogen (R1) ratios point to low-energy spark discharges or electrical tracking. The presence of acetylene indicates localized breakdown of dielectric oil, raising concerns of insulation degradation if discharge energy escalates.";
      rogersSimple = "Small electric sparks are popping inside the oil, similar to a static shock when you touch metal. It means some parts are wearing out slightly and need monitoring.";
      break;
    case "High Energy Discharge":
      rogersExpert = "Elevated acetylene (R4 > 0.1) coupled with high hydrogen rates signifies severe dielectric breakdown caused by localized high-energy power arcing. This indicates active electrical faulting, causing severe hydrocarbon cracking of the dielectric liquid.";
      rogersSimple = "It's like tiny lightning sparks flashing inside the transformer oil. This is very hot and critical because it can burn the wires and cause a sudden breakdown.";
      break;
    case "Thermal Fault (<300°C)":
      rogersExpert = "An elevated R2 (ethane-to-methane ratio) with low ethylene suggests low-temperature thermal decomposition of insulation oil (<300°C). This denotes an active hotspot initiating ethane-to-methane degradation pathways under steady-state thermal loading.";
      rogersSimple = "The transformer oil is getting too warm, like a pan warming up on the stove. This slow heating will age the oil if it doesn't cool down.";
      break;
    case "Thermal Fault (300–700°C)":
      rogersExpert = "Elevated methane and moderate ethylene ratios (R1, R3) indicate a thermal fault in the range of 300–700°C. This points to active thermal decomposition, typically caused by circulating currents in core clamps, connector joints, or structural components.";
      rogersSimple = "A part inside is getting hot, like food burning when left on the stove. It is hot enough to scorch the oil, so we need to inspect the joints.";
      break;
    case "Thermal Fault (>700°C)":
      rogersExpert = "Pronounced ethylene dominance and ethane cracking (R3 > 3.0) signify a severe high-temperature thermal fault (>700°C). Ethane-to-methane degradation pathways are bypassed by high-temperature pyrolysis, indicating severe oil degradation from shorted turns or bad contacts.";
      rogersSimple = "A part inside is getting red-hot, like a toaster wire. This is baking the oil and paper insulation very quickly and needs urgent repairs.";
      break;
    default:
      rogersExpert = "The Rogers ratio code combination does not match standard IEEE classifications. This indicates multiple concurrent thermal and electrical stresses affecting gas evolution trends.";
      rogersSimple = "The gas readings are mixed up, a bit like having a cold and a scratch at the same time. We need to check everything carefully to find the cause.";
  }

  // IEC Explanations
  let iecExpert = "";
  let iecSimple = "";

  switch (sample.iecFault) {
    case "No Fault":
      iecExpert = "IEC 60599 ratios reflect normal operating conditions. The ratio pattern indicates no active incipient fault or dielectric breakdown. Cellulose involvement and hydrocarbon cracking are non-existent.";
      iecSimple = "The electric circuits are running clean and safe. No warnings found.";
      break;
    case "Partial Discharge":
      iecExpert = "The IEC 60599 ratio pattern indicates low-energy partial discharge activity (corona). Signifies localized dielectric breakdown of the oil or paper insulation, typically representing an incipient fault.";
      iecSimple = "Small electrical leaks are starting inside, like tiny static shocks, indicating the insulation is slightly stressed.";
      break;
    case "Low Energy Discharge":
      iecExpert = "IEC ratios indicate a low-energy discharge fault, presenting as sparking or tracking. This suggests low-level electrical tracking across cellulose surfaces, with moderate fault severity.";
      iecSimple = "Minor electrical sparks are jumping through the oil. Some paper wraps around the wires might be getting slightly damaged.";
      break;
    case "High Energy Discharge":
      iecExpert = "IEC code maps to high-energy discharge. Represents critical dielectric breakdown from power arcing. Significant hydrocarbon cracking is active, presenting a high fault severity with imminent danger to windings.";
      iecSimple = "High-energy electrical arcing is happening. Think of it as continuous mini-lightning bolts inside that can ruin the system at any second.";
      break;
    case "Thermal Fault T1":
      iecExpert = "IEC code indicates low-temperature thermal degradation (T1 < 300°C). Points to incipient thermal faulting and early stages of hydrocarbon cracking without cellulose involvement.";
      iecSimple = "Low-level heating is detected, like oil warming up slowly. Not critical yet, but we should make sure the coolers are on.";
      break;
    case "Thermal Fault T2":
      iecExpert = "IEC code maps to moderate thermal degradation (T2, 300–700°C). Indicates moderate hydrocarbon cracking. Core insulation or heavy current connections are the typical locations of this thermal stress.";
      iecSimple = "The transformer is running quite hot, like an oven set to high heat, which slowly burns the oil.";
      break;
    case "Thermal Fault T3":
      iecExpert = "IEC code indicates a high-temperature thermal fault (T3 > 700°C). Suggests advanced oil pyrolysis and high-severity thermal degradation. Risk of structural cellulose involvement and permanent core damage.";
      iecSimple = "Part of the transformer is extremely hot and scorching the oil, similar to a wire starting to melt.";
      break;
    default:
      iecExpert = "IEC ratio codes indicate an unclassified or mixed fault condition. Further monitoring of fault severity and gas accumulation rates is required.";
      iecSimple = "The gas ratios show a mixed pattern, suggesting more than one small heating or electrical issue occurring at once.";
  }

  // Duval Explanations
  let duvalExpert = "";
  let duvalSimple = "";

  switch (sample.duvalZone) {
    case "PD":
      duvalExpert = "Coordinate projection falls into the Partial Discharge (PD) zone. This confirms low-energy corona activity with minimal thermal pyrolysis. The thermodynamic significance indicates high electrical stress but negligible defect evolution or insulation ageing.";
      duvalSimple = "The point is in the 'Static Leak' zone, showing a tiny electrical buzz but no serious heating or damage.";
      break;
    case "D1":
      duvalExpert = "Positioning in the D1 zone reflects low-energy electrical discharge (sparking). Acetylene concentrations dominate, suggesting defect evolution through localized electrical tracking and spark-over events, with low structural ageing.";
      duvalSimple = "The point is in the 'Small Spark' zone. Electric sparks are jumping through the oil, but there isn't a big fire-like heat yet.";
      break;
    case "D2":
      duvalExpert = "Coordinates fall in the D2 zone, demonstrating severe high-energy arcing events. Thermodynamic cracking of hydrocarbons creates high relative acetylene, representing rapid defect evolution and high risk to winding integrity.";
      duvalSimple = "The point is in the 'Lightning Bolt' zone. Hot electrical arcing is occurring, which can melt components if not shut down.";
      break;
    case "DT":
      duvalExpert = "Positioned in the DT zone, confirming mixed electrical and thermal faulting. Defect evolution represents concurrent thermal fault stratification and electrical spark tracking, suggesting compound fault progression.";
      duvalSimple = "The point is in the 'Heat + Spark' zone. The transformer is experiencing both hot spots and minor electrical sparks at the same time.";
      break;
    case "T1":
      duvalExpert = "Located in the T1 zone, suggesting low-temperature thermal fault stratification (<300°C). Thermodynamic significance points to mild oil pyrolysis and early insulation ageing without active arcing.";
      duvalSimple = "The point is in the 'Warm Oil' zone. The oil is slowly overheating, similar to soup simmering on the stove.";
      break;
    case "T2":
      duvalExpert = "Placed in the T2 zone, representing moderate thermal pyrolysis (300–700°C). Operational implications include bad contacts, circulating currents in structural clamps, and accelerated insulation ageing.";
      duvalSimple = "The point is in the 'Hot Spot' zone. Part of the metal inside is getting hot enough to cook food, which ruins the oil over time.";
      break;
    case "T3":
      duvalExpert = "Coordinates land in the T3 zone, proving severe high-temperature thermal pyrolysis (>700°C) with significant ethylene generation. Represents advanced metal-to-metal shorting, core heating, or contact erosion.";
      duvalSimple = "The point is in the 'Super Hot' zone. Inside temperatures are above 700°C (like red-hot metal), which destroys the paper insulation very quickly.";
      break;
    default:
      duvalExpert = "Coordinates fall near boundary thresholds, representing a transition zone. Operational implications suggest defect evolution progressing towards thermal or electrical faulting.";
      duvalSimple = "The point is right on the line between two zones, meaning the transformer is transitioning from a mild heating issue to a stronger one.";
  }

  // Overall Assessments
  let overallExpert = "";
  let overallSimple = "";
  let recsExpert = "";
  let recsSimple = "";

  switch (sample.duvalZone) {
    case "PD":
      overallExpert = "The observed gaseous signature indicates a low-energy partial discharge (PD) condition, characterized by hydrogen evolution with negligible hydrocarbon cracking. While fault severity is currently low, corona activity can accelerate insulation ageing and cause localized dielectric deterioration over time.";
      overallSimple = "The transformer has a tiny electrical leak, like static electricity crackling in dry weather. It's not dangerous yet, but we should monitor it so it doesn't get worse.";
      recsExpert = "Enhanced DGA surveillance (quarterly sampling), offline diagnostic testing (partial discharge measurement), and regular oil quality checks.";
      recsSimple = "Check the oil gases more often, run a special checkup on the electric circuits, and make sure no air bubbles are trapped inside.";
      break;
    case "D1":
      overallExpert = "The analysis suggests an incipient low-energy discharge (D1) characterized by acetylene generation under moderate voltage stress. This indicates localized spark-over or tracking across insulation surfaces, which compromises dielectric strength.";
      overallSimple = "We see small electrical sparks jumping inside. It is like a loose wire causing tiny sparks. It's a warning that some insulation might be wearing thin.";
      recsExpert = "Offline testing (insulation resistance, winding power factor), enhanced DGA surveillance (monthly), and condition-based maintenance during the next scheduled outage.";
      recsSimple = "Test the insulation strength soon, watch the gas levels monthly, and plan to service the transformer during the next scheduled break.";
      break;
    case "D2":
      overallExpert = "The observed gaseous signature indicates a severe high-energy discharge (D2) event characterized by high acetylene concentrations indicative of active power arcing. This poses an immediate threat to the winding dielectric integrity and paper insulation, risking catastrophic failure.";
      overallSimple = "There are large electrical sparks (like mini-lightning) flashing inside. This is highly critical because it can burn the windings and cause a major breakdown at any moment.";
      recsExpert = "Immediate outage planning, internal inspection of windings and tap changer, offline diagnostic testing, and oil reclamation/degassing.";
      recsSimple = "Turn off the transformer immediately for safety, inspect the inside for burnt wires, run expert diagnostic checks, and filter or replace the oil.";
      break;
    case "DT":
      overallExpert = "The diagnostics indicate a mixed thermal and electrical fault (DT) signature. Defect evolution suggests concurrent hot-spot pyrolysis and electrical spark tracking. Operation under this condition will accelerate paper insulation degradation and increase fault progression rates.";
      overallSimple = "The transformer is both overheating and sparking. This double trouble means the oil and paper insulation are wearing out much faster than normal.";
      recsExpert = "Immediate offline testing, enhanced monthly DGA surveillance, condition-based maintenance, and planning for an internal inspection.";
      recsSimple = "Run a detailed checkup, test the gases every month, and schedule a repair soon to prevent a bigger breakdown.";
      break;
    case "T1":
      overallExpert = "The gaseous signature indicates low-temperature thermal degradation (T1) of the insulation oil (<300°C), characterized by methane dominance. Continued thermal stress may lead to further hydrocarbon cracking and oil degradation.";
      overallSimple = "The oil inside is getting too warm, like a cup of coffee that's too hot. It is not sparking, but the constant heat will slowly age the oil and paper.";
      recsExpert = "Enhanced DGA surveillance (bi-monthly), oil quality analysis, and checking cooling fan and radiator operations.";
      recsSimple = "Test the gases every two months, check if the cooling fans are working, and make sure the radiators are clean.";
      break;
    case "T2":
      overallExpert = "The analysis indicates a moderate-temperature thermal fault (T2, 300–700°C) with elevated ethane and ethylene concentrations. This suggests localized hot spots, potentially involving circulating currents in core clamps or joints, which can accelerate insulation ageing.";
      overallSimple = "A hotspot is forming inside, heating up like a frying pan. This is scorching the oil nearby and will slowly damage the surrounding paper insulation.";
      recsExpert = "Offline testing (winding resistance, core insulation checks), oil reclamation, and planning for condition-based maintenance.";
      recsSimple = "Measure winding resistance to find the hot spot, clean or reclaim the oil, and plan a maintenance check to tighten loose joints.";
      break;
    case "T3":
      overallExpert = "The observed gaseous signature indicates a probable high-temperature thermal fault (T3) exceeding 700°C, characterized by elevated ethylene concentrations suggestive of advanced hydrocarbon cracking. Continued operation without intervention may accelerate insulation deterioration and compromise dielectric integrity.";
      overallSimple = "Part of the transformer is getting extremely hot, like a red-hot metal rod. This is cooking the oil and paper very fast. Leaving it running could cause a permanent breakdown.";
      recsExpert = "Immediate outage planning for internal inspection of contacts and core joints, offline diagnostic testing, oil reclamation, and condition-based maintenance.";
      recsSimple = "Schedule a shut-down quickly to inspect the parts, run offline tests to locate the overheating joint, and clean the oil.";
      break;
    default:
      overallExpert = "The diagnostics report unclassified gas profiles. This suggests multiple anomalies or fluctuating load profiles causing non-standard gas patterns. Recommend tracking gas rates of change.";
      overallSimple = "We have an unusual mix of gases, showing early signs of both heat and minor electric leaks. Let's keep monitoring it regularly.";
      recsExpert = "Enhanced DGA surveillance (monthly) and oil quality analysis.";
      recsSimple = "Check the gases every month and test the oil condition.";
  }

  return {
    rogers: { expert: rogersExpert, simple: rogersSimple },
    iec: { expert: iecExpert, simple: iecSimple },
    duval: { expert: duvalExpert, simple: duvalSimple },
    overall: { expert: overallExpert, simple: overallSimple },
    recommendations: { expert: recsExpert, simple: recsSimple }
  };
};

export const parseCSVData = (text: string): CalculatedSample[] => {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0 || !lines[0].trim()) {
    throw new Error("The uploaded CSV file is empty.");
  }
  
  // Parse header and standardize to uppercase
  const headers = lines[0].split(',').map(h => h.trim().toUpperCase());
  const required = ['H2', 'CH4', 'C2H6', 'C2H4', 'C2H2'];
  const missing = required.filter(r => !headers.includes(r));
  
  if (missing.length > 0) {
    throw new Error(`Required columns missing: ${missing.join(', ')}`);
  }

  const h2Idx = headers.indexOf('H2');
  const ch4Idx = headers.indexOf('CH4');
  const c2h6Idx = headers.indexOf('C2H6');
  const c2h4Idx = headers.indexOf('C2H4');
  const c2h2Idx = headers.indexOf('C2H2');

  const result: CalculatedSample[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // skip empty rows

    const cols = line.split(',').map(c => c.trim());
    // Skip incomplete columns
    if (cols.length <= Math.max(h2Idx, ch4Idx, c2h6Idx, c2h4Idx, c2h2Idx)) {
      continue;
    }

    const h2 = parseFloat(cols[h2Idx]);
    const ch4 = parseFloat(cols[ch4Idx]);
    const c2h6 = parseFloat(cols[c2h6Idx]);
    const c2h4 = parseFloat(cols[c2h4Idx]);
    const c2h2 = parseFloat(cols[c2h2Idx]);

    if (isNaN(h2) || isNaN(ch4) || isNaN(c2h6) || isNaN(c2h4) || isNaN(c2h2)) {
      throw new Error(`Invalid numeric values found on data row ${i}.`);
    }

    // Safe Division ratios
    const r1 = safeDivide(ch4, h2);
    const r2 = safeDivide(c2h6, ch4);
    const r3 = safeDivide(c2h4, c2h6);
    const r4 = safeDivide(c2h2, c2h4);
    
    const rogersFault = getRogersDiagnosis(r1, r2, r3, r4);

    const i1 = safeDivide(c2h2, c2h4);
    const i2 = safeDivide(ch4, h2);
    const i3 = safeDivide(c2h4, c2h6);

    const iecFault = getIecDiagnosis(i1, i2, i3);

    const sumDuval = ch4 + c2h4 + c2h2;
    const pctCh4 = sumDuval > 0 ? (ch4 / sumDuval) * 100 : 0;
    const pctC2h4 = sumDuval > 0 ? (c2h4 / sumDuval) * 100 : 0;
    const pctC2h2 = sumDuval > 0 ? (c2h2 / sumDuval) * 100 : 0;

    const duvalZone = getDuvalZone(pctCh4, pctC2h2, pctC2h4);
    const coords = toCartesian(pctCh4, pctC2h2, pctC2h4);

    result.push({
      sampleNum: result.length + 1,
      h2,
      ch4,
      c2h6,
      c2h4,
      c2h2,
      r1,
      r2,
      r3,
      r4,
      rogersFault,
      i1,
      i2,
      i3,
      iecFault,
      sumDuval,
      pctCh4,
      pctC2h4,
      pctC2h2,
      duvalZone,
      chartX: coords.x,
      chartY: coords.y
    });
  }

  if (result.length === 0) {
    throw new Error("No valid data rows found in the CSV dataset.");
  }

  return result;
};
