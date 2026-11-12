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
 */
export const URL_ATTRIBUTE = "powerbi-url";
export const TITLE_ATTRIBUTE = "powerbi-title";
export const RATIO_ATTRIBUTE = "powerbi-ratio";

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
  required: [URL_ATTRIBUTE],
};

/**
 * @see https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema
 */
export const uiSchema: UiSchema = {
  [URL_ATTRIBUTE]: {
    "ui:help":
      "In Power BI „Datei › Bericht einbetten › Website oder Portal“ wählen und den Link " +
      "(oder den ganzen <iframe>-Code) hier einfügen. Die Adresse eines geöffneten Berichts geht auch.",
    "ui:placeholder": "https://app.powerbi.com/reportEmbed?reportId=…",
  },
  [TITLE_ATTRIBUTE]: {
    "ui:help": "Wird von Screenreadern vorgelesen, auf der Seite nicht angezeigt.",
  },
  [RATIO_ATTRIBUTE]: {
    "ui:help": "Breite zu Höhe des Berichts. Am besten das Format der Berichtsseite in Power BI wählen.",
  },
};
