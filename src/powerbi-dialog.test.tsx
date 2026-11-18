/**
 * Das Fenster „Bericht einbinden“ im gemeinsamen Rahmen, eingehängt in einen
 * echten RJSF-Dialog: Ausgangsstand aus den alten Feldern, erstes Übernehmen
 * nach `powerbi-config`, Prüfung, Ausblenden nur im eigenen Dialog,
 * Nachladen des Editors.
 */

import * as React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";

import { modalRoot, settleModal, clickElement } from "@shared/ui/config-modal.testing";
import { configurationSchema } from "./configuration-schema";
import { readPowerbiConfig, serializePowerbiConfig } from "./powerbi-config";
import { powerbiEditorShell, startPowerbiDialog } from "./powerbi-dialog";

const mockEditorLoaded = jest.fn();
jest.mock("./powerbi-editor", () => {
  mockEditorLoaded();
  return jest.requireActual("./powerbi-editor");
});

const EMBED = "https://app.powerbi.com/reportEmbed?reportId=b2bf959a-1402-4caa-af45-6836de946b05";

const fieldValue = (container: HTMLElement): string =>
  container.querySelector<HTMLInputElement>("#powerbi #root_powerbi-config")!.value;

const inModal = (selector: string): HTMLElement | null => modalRoot()?.querySelector<HTMLElement>(selector) ?? null;

const pill = (name: string): HTMLElement | null =>
  Array.from(modalRoot()?.querySelectorAll<HTMLElement>('[role="radio"], button') ?? []).find(
    (button) => button.textContent?.trim() === name,
  ) ?? null;

async function type(selector: string, value: string): Promise<void> {
  await act(async () => {
    fireEvent.change(inModal(selector)!, { target: { value } });
  });
}

/** Der eigene Dialog neben einem fremden mit gleichen Feldnamen. */
function Dialogs({ formData }: { formData: Record<string, string> }): React.ReactElement {
  return (
    <>
      <div id="powerbi">
        <Form schema={configurationSchema} validator={validator} formData={formData} />
      </div>
      <form id="foreign">
        <div data-row="powerbi-url">
          <label htmlFor="root_powerbi-url">Fremd</label>
          <input id="root_powerbi-url" defaultValue="x" />
        </div>
      </form>
    </>
  );
}

async function open(formData: Record<string, string>): Promise<{ container: HTMLElement; stop: () => void }> {
  const { container } = render(<Dialogs formData={formData} />);
  let stop = (): void => {};
  await act(async () => {
    stop = startPowerbiDialog(container);
  });
  for (let round = 0; round < 8 && inModal('[data-testid="powerbi-editor"]') === null; round += 1) {
    await settleModal();
  }
  return { container, stop };
}

describe("Nachladen", () => {
  // Muss zuerst laufen: einmal geladen, bleibt das Modul im Speicher.
  it("lädt den Editor erst, wenn ein eigener Dialog erscheint", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const stop = startPowerbiDialog(container);
    await settleModal();

    expect(mockEditorLoaded).not.toHaveBeenCalled();
    await act(async () => stop());
    container.remove();

    const opened = await open({});
    expect(mockEditorLoaded).toHaveBeenCalledTimes(1);
    expect(inModal('[data-testid="powerbi-editor"]')).not.toBeNull();
    await act(async () => opened.stop());
  });
});

describe("startPowerbiDialog", () => {
  it("öffnet das Fenster im gemeinsamen Rahmen mit Vorschau-Umschalter", async () => {
    const { stop } = await open({});

    expect(modalRoot()!.textContent).toContain("Power BI");
    expect(modalRoot()!.querySelector("h1")).toHaveTextContent("Bericht einbinden");
    expect(inModal('[aria-label="Ansicht"]')).not.toBeNull();
    expect(powerbiEditorShell.preview).toBe(true);

    await act(async () => stop());
  });

  it("zeigt die drei Abschnitte mit Pills fürs Seitenverhältnis", async () => {
    const { stop } = await open({});

    const headings = Array.from(modalRoot()!.querySelectorAll("h3")).map((heading) => heading.textContent);
    expect(headings).toEqual(["Inhalt", "Barrierefreiheit", "Gestaltung"]);
    for (const ratio of ["16:9", "4:3", "3:2", "21:9", "1:1", "9:16"]) expect(pill(ratio)).not.toBeNull();

    await act(async () => stop());
  });

  it("blendet die alten Felder nur im eigenen Dialog aus", async () => {
    const { container, stop } = await open({});

    for (const key of ["powerbi-url", "powerbi-title", "powerbi-ratio"]) {
      const field = container.querySelector(`#powerbi [id="root_${key}"]`);
      expect(field).not.toBeNull();
      expect(field!.closest<HTMLElement>('[style*="display: none"]')).not.toBeNull();
    }
    expect(container.querySelector<HTMLElement>('#foreign [data-row="powerbi-url"]')?.style.display).toBe("");
    expect(container.querySelector<HTMLElement>("#foreign")?.style.display).toBe("");

    await act(async () => stop());
    expect(container.querySelector('#powerbi [id="root_powerbi-url"]')!.closest('[style*="display: none"]')).toBeNull();
  });

  it("verlangt im Studio-Dialog selbst nichts: das Link-Feld darunter bleibt leer", async () => {
    const { container, stop } = await open({});
    expect(container.querySelector<HTMLInputElement>('#powerbi [id="root_powerbi-url"]')!.hasAttribute("required")).toBe(
      false,
    );
    await act(async () => stop());
  });

  it("übernimmt die alten Felder als Ausgangsstand, ohne etwas zu schreiben", async () => {
    const { container, stop } = await open({ "powerbi-url": EMBED, "powerbi-title": "Umsatz" });

    expect(fieldValue(container)).toBe("");
    expect(inModal("textarea")).toHaveValue(EMBED);
    expect(inModal('input[type="text"]')).toHaveValue("Umsatz");
    // Öffnen und Übernehmen ändert keinen Block: ohne Änderung ist Übernehmen gesperrt.
    expect(inModal('[data-testid="config-shell-apply"]')).toBeDisabled();

    await act(async () => stop());
  });

  it("schreibt beim ersten Übernehmen powerbi-config und lässt die alten Felder stehen", async () => {
    const { container, stop } = await open({ "powerbi-url": EMBED, "powerbi-title": "Umsatz" });

    await type('input[type="text"]', "Umsatz Werk");
    await clickElement(pill("4:3"));
    await clickElement(inModal('[data-testid="config-shell-apply"]'));

    expect(readPowerbiConfig(fieldValue(container))).toEqual({ url: EMBED, title: "Umsatz Werk", ratio: "4:3" });
    expect(container.querySelector<HTMLInputElement>('#powerbi [id="root_powerbi-url"]')!.value).toBe(EMBED);

    await act(async () => stop());
  });

  it("lässt ein Seitenverhältnis weg, das sich nicht lesen ließ, solange es niemand wählt", async () => {
    // Auswahlfeld ohne lesbaren Wert, wie im Content Designer.
    const { container } = render(<Dialogs formData={{ "powerbi-url": EMBED }} />);
    container.querySelector('[id="root_powerbi-ratio"]')?.removeAttribute("id");
    container.querySelectorAll('[name="root_powerbi-ratio"]').forEach((node) => node.removeAttribute("name"));
    let stopDialog = (): void => {};
    await act(async () => {
      stopDialog = startPowerbiDialog(container);
    });
    for (let round = 0; round < 8 && inModal('[data-testid="powerbi-editor"]') === null; round += 1) await settleModal();

    expect(inModal('[aria-label="Seitenverhältnis"] [aria-checked="true"]')).toBeNull();
    await type('input[type="text"]', "Neu");
    await clickElement(inModal('[data-testid="config-shell-apply"]'));

    const written = readPowerbiConfig(fieldValue(container));
    expect(written).toEqual({ url: EMBED, title: "Neu" });
    expect(written).not.toHaveProperty("ratio");

    await act(async () => stopDialog());
  });

  it("nimmt eine vorhandene powerbi-config vor den alten Feldern", async () => {
    const config = serializePowerbiConfig({ url: EMBED, title: "Neu", ratio: "21:9" });
    const { stop } = await open({ "powerbi-config": config, "powerbi-title": "Alt" });

    expect(inModal('input[type="text"]')).toHaveValue("Neu");
    expect(pill("21:9")).toHaveAttribute("aria-checked", "true");

    await act(async () => stop());
  });

  it("übernimmt keinen unbrauchbaren Link und sagt warum", async () => {
    const { container, stop } = await open({ "powerbi-url": EMBED });

    await type("textarea", "https://[intranet]/berichte/kennzahlen-werk");
    await clickElement(inModal('[data-testid="config-shell-apply"]'));

    expect(fieldValue(container)).toBe("");
    expect(inModal("textarea")).toHaveAttribute("aria-invalid", "true");
    expect(modalRoot()!.textContent).toContain("Das ist kein Power-BI-Link.");
    expect(modalRoot()!.textContent).toContain("Kein Power-BI-Link");

    await act(async () => stop());
  });

  it("zeigt in der Geräteansicht Vorschau und Inspektor mit denselben Feldern", async () => {
    const { stop } = await open({ "powerbi-url": EMBED });

    await clickElement(Array.from(modalRoot()!.querySelectorAll<HTMLElement>('[aria-label="Ansicht"] [role="radio"]')).find((b) => b.textContent === "Desktop") ?? null);
    await settleModal();

    expect(inModal('[data-testid="powerbi-preview-frame"]')).not.toBeNull();
    expect(inModal('[data-testid="powerbi-inspector"] textarea')).toHaveValue(EMBED);
    expect(inModal('[data-testid="powerbi-editor"]')).toBeNull();

    await act(async () => stop());
  });
});
