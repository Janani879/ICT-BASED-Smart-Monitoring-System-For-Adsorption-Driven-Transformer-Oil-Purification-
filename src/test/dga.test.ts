import { describe, it, expect } from "vitest";
import {
  safeDivide,
  toCartesian,
  getRogersDiagnosis,
  getIecDiagnosis,
  getDuvalZone,
  getSampleExplanation,
  CalculatedSample
} from "../lib/dga";

describe("DGA Calculation Helpers", () => {
  describe("safeDivide", () => {
    it("should return 0 when denominator is 0", () => {
      expect(safeDivide(10, 0)).toBe(0);
      expect(safeDivide(0, 0)).toBe(0);
    });

    it("should return correct ratio when denominator is not 0", () => {
      expect(safeDivide(10, 2)).toBe(5);
      expect(safeDivide(1, 4)).toBe(0.25);
    });
  });

  describe("toCartesian", () => {
    it("should handle sum of 0 safely", () => {
      const coords = toCartesian(0, 0, 0);
      expect(coords.x).toBe(0);
      expect(coords.y).toBe(0);
    });

    it("should project to standard 2D Cartesian triangle space", () => {
      // 100% CH4 (apex of equilateral triangle)
      const apex = toCartesian(100, 0, 0);
      expect(apex.x).toBe(50);
      expect(apex.y).toBeCloseTo(86.6025, 4);

      // 100% C2H2 (bottom right of triangle)
      const bottomRight = toCartesian(0, 100, 0);
      expect(bottomRight.x).toBe(100);
      expect(bottomRight.y).toBe(0);

      // 100% C2H4 (bottom left of triangle)
      const bottomLeft = toCartesian(0, 0, 100);
      expect(bottomLeft.x).toBe(0);
      expect(bottomLeft.y).toBe(0);
    });
  });

  describe("getRogersDiagnosis", () => {
    it("should identify Normal code combinations", () => {
      expect(getRogersDiagnosis(0, 0, 0, 0)).toBe("Normal"); // 0000
      expect(getRogersDiagnosis(0.5, 0.5, 0.5, 0.05)).toBe("Normal"); // 1000
    });

    it("should identify Partial Discharge code combinations", () => {
      expect(getRogersDiagnosis(0.05, 0.5, 0.5, 1.5)).toBe("Partial Discharge"); // 0001
      expect(getRogersDiagnosis(0.05, 0.5, 0.5, 5)).toBe("Partial Discharge"); // 0002
    });

    it("should identify Low Energy Discharge code combinations", () => {
      expect(getRogersDiagnosis(0.5, 0.5, 2.0, 1.5)).toBe("Low Energy Discharge"); // 1011
      expect(getRogersDiagnosis(0.05, 0.5, 2.0, 1.5)).toBe("Low Energy Discharge"); // 0011
    });

    it("should identify High Energy Discharge code combinations", () => {
      expect(getRogersDiagnosis(0.5, 0.5, 4.0, 1.5)).toBe("High Energy Discharge"); // 1021
      expect(getRogersDiagnosis(0.05, 0.5, 4.0, 1.5)).toBe("High Energy Discharge"); // 0021
    });

    it("should identify Thermal Faults", () => {
      expect(getRogersDiagnosis(0.05, 2.0, 0.5, 0.05)).toBe("Thermal Fault (<300°C)"); // 0100
      expect(getRogersDiagnosis(2.5, 2.0, 0.5, 0.05)).toBe("Thermal Fault (300–700°C)"); // 2100
      expect(getRogersDiagnosis(2.5, 2.0, 4.0, 0.05)).toBe("Thermal Fault (>700°C)"); // 2120
    });

    it("should return Unknown / No Match for unmapped codes", () => {
      expect(getRogersDiagnosis(4.0, 2.0, 4.0, 4.0)).toBe("Unknown / No Match");
    });
  });

  describe("getIecDiagnosis", () => {
    it("should identify No Fault combinations", () => {
      expect(getIecDiagnosis(0.05, 0.5, 0.5)).toBe("No Fault"); // 000
    });

    it("should identify Partial Discharge", () => {
      expect(getIecDiagnosis(0.05, 0.05, 0.5)).toBe("Partial Discharge"); // 010
    });

    it("should identify Low Energy Discharge", () => {
      expect(getIecDiagnosis(1.5, 0.5, 2.0)).toBe("Low Energy Discharge"); // 101
      expect(getIecDiagnosis(5.0, 0.5, 2.0)).toBe("Low Energy Discharge"); // 201
    });

    it("should identify High Energy Discharge", () => {
      expect(getIecDiagnosis(1.5, 0.5, 5.0)).toBe("High Energy Discharge"); // 102
    });

    it("should identify Thermal Faults", () => {
      expect(getIecDiagnosis(0.05, 5.0, 0.5)).toBe("Thermal Fault T1"); // 020
      expect(getIecDiagnosis(0.05, 5.0, 2.0)).toBe("Thermal Fault T2"); // 021
      expect(getIecDiagnosis(0.05, 5.0, 5.0)).toBe("Thermal Fault T3"); // 022
    });
  });

  describe("getDuvalZone", () => {
    it("should return PD for 100% CH4 or very high CH4", () => {
      expect(getDuvalZone(99, 0.5, 0.5)).toBe("PD");
    });

    it("should identify D1 Low Energy Discharge", () => {
      expect(getDuvalZone(10, 80, 10)).toBe("D1");
    });

    it("should identify D2 High Energy Discharge", () => {
      expect(getDuvalZone(10, 40, 50)).toBe("D2");
    });

    it("should identify T1 (Thermal < 300C)", () => {
      expect(getDuvalZone(80, 2, 18)).toBe("T1");
    });

    it("should identify T2 (Thermal 300-700C)", () => {
      expect(getDuvalZone(60, 2, 38)).toBe("T2");
    });

    it("should identify T3 (Thermal > 700C)", () => {
      expect(getDuvalZone(20, 5, 75)).toBe("T3");
    });
  });

  describe("getSampleExplanation", () => {
    it("should return valid expert and simple explanations for T3 fault", () => {
      const sample: CalculatedSample = {
        sampleNum: 1,
        h2: 100, ch4: 200, c2h6: 50, c2h4: 500, c2h2: 10,
        r1: 2, r2: 0.25, r3: 10, r4: 0.02,
        rogersFault: "Thermal Fault (>700°C)",
        i1: 0.02, i2: 2, i3: 10,
        iecFault: "Thermal Fault T3",
        sumDuval: 710,
        pctCh4: 28.17, pctC2h4: 70.42, pctC2h2: 1.41,
        duvalZone: "T3",
        chartX: 0, chartY: 0
      };

      const explanation = getSampleExplanation(sample);
      expect(explanation.rogers.expert).toContain("pyrolysis");
      expect(explanation.rogers.simple).toContain("toaster wire");
      expect(explanation.iec.expert).toContain("pyrolysis");
      expect(explanation.duval.expert).toContain("T3");
      expect(explanation.overall.expert).toContain("probable high-temperature thermal fault (T3)");
      expect(explanation.overall.simple).toContain("red-hot metal");
      expect(explanation.recommendations.expert).toContain("outage planning");
      expect(explanation.recommendations.simple).toContain("shut-down");
    });
  });
});
