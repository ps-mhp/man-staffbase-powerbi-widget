import { encodePayload } from "@shared/payload";

import {
  configFromLegacy,
  parsePowerbiConfig,
  readPowerbiConfig,
  resolvePowerbiConfig,
  serializePowerbiConfig,
} from "./powerbi-config";

const EMBED = "https://app.powerbi.com/reportEmbed?reportId=b2bf959a-1402-4caa-af45-6836de946b05";

describe("serializePowerbiConfig / readPowerbiConfig", () => {
  it("round-trips and encodes like the other JSON attributes", () => {
    const config = { url: EMBED, title: "Umsatz „Werk“", ratio: "4:3" };
    const raw = serializePowerbiConfig(config);
    expect(raw.startsWith("b64:")).toBe(true);
    expect(readPowerbiConfig(raw)).toEqual(config);
  });

  it("leaves out keys that are not set, so the old attribute keeps applying", () => {
    const raw = serializePowerbiConfig({ url: EMBED });
    expect(readPowerbiConfig(raw)).toEqual({ url: EMBED });
  });

  it("reads raw JSON as well", () => {
    expect(readPowerbiConfig(JSON.stringify({ ratio: "21:9" }))).toEqual({ ratio: "21:9" });
  });

  it("is null for anything unusable", () => {
    expect(readPowerbiConfig(undefined)).toBeNull();
    expect(readPowerbiConfig("")).toBeNull();
    expect(readPowerbiConfig("  ")).toBeNull();
    expect(readPowerbiConfig("{kaputt")).toBeNull();
    expect(readPowerbiConfig("[1]")).toBeNull();
    expect(readPowerbiConfig("b64:!!!")).toBeNull();
    expect(parsePowerbiConfig("")).toEqual({});
  });

  it("drops values of the wrong type and unknown ratios", () => {
    expect(readPowerbiConfig(encodePayload(JSON.stringify({ url: 3, title: null, ratio: "7:5" })))).toEqual({});
  });
});

describe("configFromLegacy", () => {
  it("takes what is readable and leaves out what is empty or unknown", () => {
    expect(configFromLegacy({ "powerbi-url": EMBED, "powerbi-title": "Titel", "powerbi-ratio": "3:2" })).toEqual({
      url: EMBED,
      title: "Titel",
      ratio: "3:2",
    });
    expect(configFromLegacy({ "powerbi-url": " ", "powerbi-title": "", "powerbi-ratio": "" })).toEqual({});
    expect(configFromLegacy({})).toEqual({});
  });
});

describe("resolvePowerbiConfig", () => {
  const legacy = { "powerbi-url": "alt", "powerbi-title": "Alt", "powerbi-ratio": "1:1" };

  it("is the old attributes alone for a block without powerbi-config", () => {
    expect(resolvePowerbiConfig(legacy)).toEqual({ url: "alt", title: "Alt", ratio: "1:1" });
    expect(resolvePowerbiConfig({ ...legacy, "powerbi-config": "" })).toEqual({ url: "alt", title: "Alt", ratio: "1:1" });
    expect(resolvePowerbiConfig({ ...legacy, "powerbi-config": "{kaputt" })).toEqual({
      url: "alt",
      title: "Alt",
      ratio: "1:1",
    });
    expect(resolvePowerbiConfig({})).toEqual({ url: undefined, title: undefined, ratio: undefined });
  });

  it("mixes per key: new value, else old attribute", () => {
    const raw = serializePowerbiConfig({ url: EMBED, title: "Neu" });
    expect(resolvePowerbiConfig({ ...legacy, "powerbi-config": raw })).toEqual({ url: EMBED, title: "Neu", ratio: "1:1" });
  });

  it("lets an emptied title stand, it means the default", () => {
    const raw = serializePowerbiConfig({ title: "" });
    expect(resolvePowerbiConfig({ ...legacy, "powerbi-config": raw }).title).toBe("");
  });
});
