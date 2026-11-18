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

import { UiSchema } from "@rjsf/utils";
import { JSONSchema7 } from "json-schema";

/**
 * Attribute names. Prefixed with the widget, because editors of other widgets
 * hook into the dialog by `root_<attribute>` without knowing which widget it
 * belongs to. Each one is also the schema key (the host saves a value under its
 * schema key verbatim) and is listed in `widgets.json`.
 *
 * `powerbi-config` hält seit 0.1.0-rc.2 die ganze Konfiguration in einem Feld
 * (siehe `powerbi-config.ts`).
 */
export const CONFIG_ATTRIBUTE = "powerbi-config";
export const URL_ATTRIBUTE = "powerbi-url";
export const TITLE_ATTRIBUTE = "powerbi-title";
export const RATIO_ATTRIBUTE = "powerbi-ratio";

/**
 * Die einzelnen Felder bis 0.1.0-rc.1. Sie stehen weiter im Schema, damit der
 * Dialog ihre Werte führt: das Fenster übernimmt sie als Ausgangsstand und
 * schreibt sie beim ersten Übernehmen nach `powerbi-config`. Zu sehen sind sie
 * im eigenen Dialog nicht mehr (`legacy-fields.ts`).
 */
export const LEGACY_ATTRIBUTES = [URL_ATTRIBUTE, TITLE_ATTRIBUTE, RATIO_ATTRIBUTE] as const;

export const DEFAULT_TITLE = "Power-BI-Bericht";

/** Selectable aspect ratios, value → CSS `aspect-ratio`. */
export const RATIOS: Readonly<Record<string, string>> = {
  "16:9": "16 / 9",
  "4:3": "4 / 3",
  "3:2": "3 / 2",
  "21:9": "21 / 9",
  "1:1": "1 / 1",
  "9:16": "9 / 16",
};

export const DEFAULT_RATIO = "16:9";

/**
 * @see https://rjsf-team.github.io/react-jsonschema-form/docs/
 */
export const configurationSchema: JSONSchema7 = {
  properties: {
    [CONFIG_ATTRIBUTE]: {
      type: "string",
      title: "Power-BI-Bericht",
      default: "",
    },
    [URL_ATTRIBUTE]: {
      type: "string",
      title: "Power-BI-Link",
    },
    [TITLE_ATTRIBUTE]: {
      type: "string",
      title: "Titel (für Screenreader)",
      default: DEFAULT_TITLE,
    },
    [RATIO_ATTRIBUTE]: {
      type: "string",
      title: "Seitenverhältnis",
      enum: Object.keys(RATIOS),
      default: DEFAULT_RATIO,
    },
  },
  // Kein `required`: der Link steht im Fenster, das Feld darunter bliebe leer
  // und hielte den Dialog beim Speichern auf. Das Fenster prüft selbst.
};

/** Alle Attribute, in der Reihenfolge des Schemas. */
export const ALL_ATTRIBUTES: string[] = Object.keys(configurationSchema.properties ?? {});

/**
 * @see https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema
 */
export const uiSchema: UiSchema = {
  [CONFIG_ATTRIBUTE]: {
    "ui:help":
      "Link, Titel und Seitenverhältnis werden im Fenster „Bericht einbinden“ gepflegt; " +
      "das Textfeld dahinter ist die Rohfassung.",
  },
};
