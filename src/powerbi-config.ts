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
 * Die ganze Konfiguration des Power-BI-Widgets in einem Attribut:
 * `powerbi-config`.
 *
 * Bis 0.1.0-rc.1 lag sie auf drei Feldern des Staffbase-Dialogs (Link, Titel,
 * Seitenverhältnis). Seither pflegt ein Fenster alles und schreibt es hierher.
 *
 * Ältere Blöcke tragen nur die einzelnen Felder und rendern unverändert:
 * die Leseseite mischt je Schlüssel `powerbi-config` vor dem alten Attribut
 * ({@link resolvePowerbiConfig}). Ein Schlüssel, der in `powerbi-config`
 * fehlt, gilt aus dem alten Attribut weiter – so bleibt ein Wert erhalten,
 * den das Fenster nicht auslesen konnte (Auswahlfelder im Content Designer
 * haben kein lesbares `value`).
 *
 * Der Name trägt das Widget: Editoren hängen sich über `root_<Attribut>` ein,
 * ohne das Widget zu kennen.
 */

import { decodePayload, encodePayload } from "@shared/payload";

import {
  RATIOS,
  RATIO_ATTRIBUTE,
  TITLE_ATTRIBUTE,
  URL_ATTRIBUTE,
  CONFIG_ATTRIBUTE,
} from "./configuration-schema";

/**
 * Was das Fenster pflegt. Jeder Schlüssel darf fehlen: dann gilt das alte
 * Attribut, sonst die Vorgabe.
 */
export interface PowerbiConfig {
  /** Einbettungslink, `<iframe>`-Code oder Adresse eines Berichts, wie eingegeben. */
  url?: string;
  /** Name des Berichts für Screenreader. */
  title?: string;
  /** Einer der Schlüssel von {@link RATIOS}. */
  ratio?: string;
}

/** Die drei Attribute bis 0.1.0-rc.1, so wie sie am Element ankommen. */
export interface LegacyPowerbiAttributes {
  "powerbi-url"?: unknown;
  "powerbi-title"?: unknown;
  "powerbi-ratio"?: unknown;
}

/** Die ungeprüften Werte, die die Seite an Ansicht und Lesefunktionen gibt. */
export interface PowerbiSettings {
  url: unknown;
  title: unknown;
  ratio: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isRatio = (value: unknown): value is string => typeof value === "string" && Object.prototype.hasOwnProperty.call(RATIOS, value);

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/** Nur was die Typen hergeben; alles andere fehlt – und es gilt das alte Attribut. */
function configOf(value: Record<string, unknown>): PowerbiConfig {
  return {
    ...(typeof value.url === "string" ? { url: value.url } : {}),
    ...(typeof value.title === "string" ? { title: value.title } : {}),
    ...(isRatio(value.ratio) ? { ratio: value.ratio } : {}),
  };
}

/**
 * Liest `powerbi-config`; `null`, wenn dort nichts Brauchbares steht – leer,
 * kaputt kodiert oder kein Objekt. Dann gelten die alten Felder.
 */
export function readPowerbiConfig(raw: unknown): PowerbiConfig | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = parseJson(decodePayload(trimmed) ?? trimmed);
  return isRecord(value) ? configOf(value) : null;
}

/** Wie {@link readPowerbiConfig}, aber nie leer: Unbrauchbares wird zum leeren Stand. */
export function parsePowerbiConfig(raw: string): PowerbiConfig {
  return readPowerbiConfig(raw) ?? {};
}

/** Schreibt `powerbi-config`, kodiert wie die übrigen JSON-Attribute (`@shared/payload`). */
export function serializePowerbiConfig(config: PowerbiConfig): string {
  const { url, title, ratio } = config;
  return encodePayload(JSON.stringify({ url, title, ratio }));
}

/**
 * Die Konfiguration aus den einzelnen Feldern älterer Fassungen. Leeres und
 * Unbekanntes fehlt, damit es später nicht als bewusste Wahl gilt.
 */
export function configFromLegacy(attrs: LegacyPowerbiAttributes): PowerbiConfig {
  const url = attrs[URL_ATTRIBUTE];
  const title = attrs[TITLE_ATTRIBUTE];
  const ratio = attrs[RATIO_ATTRIBUTE];
  return {
    ...(typeof url === "string" && url.trim() !== "" ? { url } : {}),
    ...(typeof title === "string" && title.trim() !== "" ? { title } : {}),
    ...(isRatio(ratio) ? { ratio } : {}),
  };
}

/** Je Schlüssel: `powerbi-config`, sonst das alte Attribut. Gelesen wird danach wie bisher. */
export function resolvePowerbiConfig(
  attrs: LegacyPowerbiAttributes & { "powerbi-config"?: unknown },
): PowerbiSettings {
  const config = readPowerbiConfig(attrs[CONFIG_ATTRIBUTE]);
  return {
    url: config?.url ?? attrs[URL_ATTRIBUTE],
    title: config?.title ?? attrs[TITLE_ATTRIBUTE],
    ratio: config?.ratio ?? attrs[RATIO_ATTRIBUTE],
  };
}
