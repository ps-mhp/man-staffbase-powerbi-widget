/*!
 * Copyright 2026, MHP Management und IT-Beratung GmbH and contributors.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Was der Konfigurationsdialog zeigt: ein einziges Fenster am Feld
 * `powerbi-config`, die einzelnen Felder älterer Fassungen ausgeblendet.
 *
 * Ist `powerbi-config` noch leer, beginnt das Fenster mit dem, was die alten
 * Felder des eigenen Dialogs tragen. Erst „Übernehmen“ schreibt es nach
 * `powerbi-config`; bis dahin gilt für die Seite weiter, was in den alten
 * Feldern steht. Was sich nicht auslesen lässt, bleibt im Fenster ungesetzt
 * und gilt weiter aus dem alten Attribut.
 */

import * as React from "react";
import { ChartPie } from "lucide-react";

import { FieldModalShellOptions, startFieldModalInjector } from "@shared/config-modal";

import { CONFIG_ATTRIBUTE, LEGACY_ATTRIBUTES } from "./configuration-schema";
import { readLegacyFromDialog, startHiddenFields } from "./legacy-fields";
import { PowerbiConfig, configFromLegacy, readPowerbiConfig, serializePowerbiConfig } from "./powerbi-config";
import { powerbiChangesStatus, validatePowerbiConfig } from "./powerbi-editor-rules";

/**
 * Der Editor kommt erst, wenn ein Dialog ihn zeigt: er baut auf
 * `@man/config-ui` und damit auf react-aria. Hier im Seitenbündel bleiben nur
 * Prüfung, Status und Hilfe – sie braucht der Rahmen, bevor der Editor da ist.
 */
const LazyPowerbiEditor = React.lazy(() =>
  import("./powerbi-editor").then((module) => ({ default: module.PowerbiEditor })),
);

const LOADING = <p className="p-6 text-sm text-muted-foreground">Editor wird geladen …</p>;

/** Tasten und den Satz zu „Übernehmen“ ergänzt der Rahmen selbst. */
const HELP = (
  <ul className="flex list-disc flex-col gap-2 pl-5">
    <li>
      In Power BI <strong>Datei › Bericht einbetten › Website oder Portal</strong> wählen und den Link – oder den
      ganzen <code>&lt;iframe&gt;</code>-Code – bei <strong>Power-BI-Link</strong> einfügen. Die Adresse eines
      geöffneten Berichts geht auch.
    </li>
    <li>Es werden nur Adressen von Power BI angenommen; ohne gültigen Link lässt sich nichts übernehmen.</li>
    <li>
      Der <strong>Titel für Screenreader</strong> wird vorgelesen, auf der Seite aber nicht angezeigt.
    </li>
    <li>
      Das <strong>Seitenverhältnis</strong> ist Breite zu Höhe des Berichts – am besten das Format der Berichtsseite in
      Power BI.
    </li>
    <li>
      In Desktop, Tablet und Mobil zeigt die Vorschau den Rahmen im gewählten Seitenverhältnis; der Bericht selbst wird
      hier nicht geladen.
    </li>
  </ul>
);

/** Was der gemeinsame Rahmen vom Power-BI-Widget wissen muss. Offengelegt für Tests. */
export const powerbiEditorShell: FieldModalShellOptions<PowerbiConfig> = {
  widgetName: "Power BI",
  title: "Bericht einbinden",
  icon: ChartPie,
  preview: true,
  help: HELP,
  statusText: powerbiChangesStatus,
  validate: validatePowerbiConfig,
};

/**
 * Wartet auf den Konfigurationsdialog des Widgets, setzt das Fenster an die
 * Stelle von `powerbi-config` und blendet die alten Felder aus – beides nur
 * im eigenen Dialog.
 *
 * @param root der zu beobachtende Teilbaum; standardmäßig das Dokument.
 * Offengelegt, damit Tests den Beobachter auf einen Container begrenzen.
 * @returns eine Funktion, die die Beobachtung beendet und alles abbaut.
 */
export function startPowerbiDialog(root: ParentNode = document): () => void {
  const stopModal = startFieldModalInjector<PowerbiConfig>({
    fieldKey: CONFIG_ATTRIBUTE,
    root,
    reopenLabel: "Bericht einbinden",
    modalTestId: "powerbi-editor-modal",
    reopenTestId: "powerbi-editor-reopen",
    parse: (raw) => readPowerbiConfig(raw) ?? configFromLegacy(readLegacyFromDialog(root)),
    serialize: serializePowerbiConfig,
    shell: powerbiEditorShell,
    render: ({ value, onChange }) => (
      <React.Suspense fallback={LOADING}>
        <LazyPowerbiEditor value={value} onChange={onChange} />
      </React.Suspense>
    ),
  });
  const stopHiding = startHiddenFields(LEGACY_ATTRIBUTES, CONFIG_ATTRIBUTE, root);
  return () => {
    stopModal();
    stopHiding();
  };
}
