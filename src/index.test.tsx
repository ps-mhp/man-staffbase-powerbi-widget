import * as fs from "fs";
import * as path from "path";
import React from "react";
import { render, screen } from "@testing-library/react";

import { readAspectRatio, readTitle, widgetAttributes } from "./index";
import { configurationSchema, DEFAULT_TITLE, uiSchema } from "./configuration-schema";
import { MESSAGE_EMPTY, MESSAGE_NOT_POWERBI, resolveEmbedUrl } from "./powerbi-url";
import { PowerbiView } from "./powerbi-view";

const EMBED =
  "https://app.powerbi.com/reportEmbed?reportId=b2bf959a-1402-4caa-af45-6836de946b05&autoAuth=true&ctid=a21424d1-f651-4ed4-89bf-6edaa0bd5ee4";

describe("the widget's attributes", () => {
  it("are exactly the keys the configuration schema stores under", () => {
    expect(Object.keys(configurationSchema.properties!)).toEqual(widgetAttributes);
    expect(Object.keys(uiSchema)).toEqual(["powerbi-config"]);
    expect(widgetAttributes).toEqual(["powerbi-config", "powerbi-url", "powerbi-title", "powerbi-ratio"]);
    for (const name of widgetAttributes) expect(name).toBe(name.toLowerCase());
  });

  it("are used by no other widget", () => {
    // Editors hook into the dialog by root_<attribute> without knowing the widget.
    const widgetsDir = path.resolve(__dirname, "../..");
    for (const other of fs.readdirSync(widgetsDir)) {
      const schema = path.join(widgetsDir, other, "src", "configuration-schema.ts");
      if (other === "powerbi-widget" || !fs.existsSync(schema)) continue;
      const source = fs.readFileSync(schema, "utf8");
      for (const name of widgetAttributes) expect(source).not.toContain(`"${name}"`);
    }
  });
});

describe("the configuration schema", () => {
  it("requires nothing: the link is checked by the window, the hidden field stays empty", () => {
    expect(configurationSchema.required).toBeUndefined();
  });
});

describe("readTitle / readAspectRatio", () => {
  it("fall back to the defaults", () => {
    expect(readTitle(undefined)).toBe(DEFAULT_TITLE);
    expect(readTitle("  ")).toBe(DEFAULT_TITLE);
    expect(readTitle(" Umsatz ")).toBe("Umsatz");
    expect(readAspectRatio(undefined)).toBe("16 / 9");
    expect(readAspectRatio("4:3")).toBe("4 / 3");
    expect(readAspectRatio("unbekannt")).toBe("16 / 9");
  });
});

describe("PowerbiView", () => {
  it("frames the report", () => {
    render(<PowerbiView embed={resolveEmbedUrl(EMBED)} title="Umsatz" aspectRatio="4 / 3" />);
    const frame = screen.getByTitle("Umsatz");
    expect(frame.tagName).toBe("IFRAME");
    expect(frame.getAttribute("src")).toBe(EMBED);
    expect(frame.hasAttribute("allowfullscreen")).toBe(true);
    expect(screen.getByTestId("powerbi-widget").style.aspectRatio).toBe("4 / 3");
  });

  it("says why there is no report", () => {
    const { rerender } = render(
      <PowerbiView embed={resolveEmbedUrl("")} title="x" aspectRatio="16 / 9" />,
    );
    expect(screen.getByRole("alert").textContent).toBe(MESSAGE_EMPTY);
    rerender(<PowerbiView embed={resolveEmbedUrl("https://evil.example")} title="x" aspectRatio="16 / 9" />);
    expect(screen.getByRole("alert").textContent).toBe(MESSAGE_NOT_POWERBI);
    expect(document.querySelector("iframe")).toBeNull();
  });
});
