import {
  MESSAGE_FIELD_EMPTY,
  MESSAGE_FIELD_NOT_POWERBI,
  URL_ISSUE,
  powerbiChangesStatus,
  urlProblem,
  validatePowerbiConfig,
} from "./powerbi-editor-rules";
import { MESSAGE_NOT_EMBEDDABLE } from "./powerbi-url";

const EMBED = "https://app.powerbi.com/reportEmbed?reportId=b2bf959a-1402-4caa-af45-6836de946b05";

describe("urlProblem", () => {
  it("is empty for a usable link, an iframe snippet and a report address", () => {
    expect(urlProblem(EMBED)).toBeUndefined();
    expect(urlProblem(`<iframe src="${EMBED}"></iframe>`)).toBeUndefined();
  });

  it("names the problem", () => {
    expect(urlProblem(undefined)).toBe(MESSAGE_FIELD_EMPTY);
    expect(urlProblem("  ")).toBe(MESSAGE_FIELD_EMPTY);
    expect(urlProblem("https://[intranet]/berichte/kennzahlen-werk")).toBe(MESSAGE_FIELD_NOT_POWERBI);
    expect(urlProblem("https://app.powerbi.com/home")).toBe(MESSAGE_NOT_EMBEDDABLE);
  });
});

describe("validatePowerbiConfig", () => {
  it("blocks without a usable link, in one short line for the status", () => {
    expect(validatePowerbiConfig({})).toEqual([{ id: URL_ISSUE, message: "Kein Power-BI-Link" }]);
    expect(validatePowerbiConfig({ url: "https://evil.example" })).toHaveLength(1);
    expect(validatePowerbiConfig({ url: EMBED })).toEqual([]);
  });
});

describe("powerbiChangesStatus", () => {
  it("says what changed", () => {
    expect(powerbiChangesStatus({ url: EMBED }, { url: EMBED })).toBeUndefined();
    expect(powerbiChangesStatus({ url: EMBED }, {})).toBe("Link geändert");
    expect(powerbiChangesStatus({ url: EMBED, title: "a" }, { url: EMBED })).toBe("Titel geändert");
    expect(powerbiChangesStatus({ url: "a", title: "b", ratio: "1:1" }, {})).toBe(
      "Link, Titel und Seitenverhältnis geändert",
    );
    expect(powerbiChangesStatus({ ratio: "4:3" }, { ratio: "16:9" })).toBe("Seitenverhältnis geändert");
  });
});
