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
 * Prüfung und Status des Fensters „Bericht einbinden“.
 *
 * Liegt im Seitenbündel, nicht beim nachgeladenen Editor: der Rahmen braucht
 * beides schon, bevor der Editor da ist. Darum nur reine Funktionen und die
 * Linkprüfung, nichts aus `@man/config-ui` ausser Typen.
 */

import type { ValidationIssue } from "@man/config-ui/shell/shell-context";

import type { PowerbiConfig } from "./powerbi-config";
import { MESSAGE_NOT_EMBEDDABLE, resolveEmbedUrl } from "./powerbi-url";

export const URL_ISSUE = "url";

/** Kurz, für die Statuszeile; die ausführliche Meldung steht am Feld ({@link urlProblem}). */
const STATUS_MESSAGE = "Kein Power-BI-Link";

/** Der Fehler am Feld, wie im Screen; leer, wenn der Link taugt. */
export const MESSAGE_FIELD_NOT_POWERBI =
  "Das ist kein Power-BI-Link. Erwartet wird ein Einbettungslink von app.powerbi.com, ein <iframe>-Code oder ein Link mit „view?r=“.";
export const MESSAGE_FIELD_EMPTY = "Bitte den Power-BI-Link eintragen.";

/** Die Meldung am Link-Feld, oder `undefined`, wenn der Link taugt. */
export function urlProblem(url: string | undefined): string | undefined {
  const embed = resolveEmbedUrl(url);
  if (embed.kind === "ok") return undefined;
  if (embed.kind === "empty") return MESSAGE_FIELD_EMPTY;
  return embed.message === MESSAGE_NOT_EMBEDDABLE ? MESSAGE_NOT_EMBEDDABLE : MESSAGE_FIELD_NOT_POWERBI;
}

/**
 * Was fehlt, damit die Seite einen Bericht zeigen kann. Ohne brauchbaren Link
 * zeigte sie nur einen Hinweis.
 */
export function validatePowerbiConfig(config: PowerbiConfig): ValidationIssue[] {
  return urlProblem(config.url) === undefined ? [] : [{ id: URL_ISSUE, message: STATUS_MESSAGE }];
}

const present = (parts: readonly (string | false)[]): string[] =>
  parts.filter((part): part is string => part !== false);

/** Was sich gegenüber dem übernommenen Stand geändert hat, etwa „Link geändert“. */
export function powerbiChangesStatus(draft: PowerbiConfig, saved: PowerbiConfig): string | undefined {
  const parts = present([
    draft.url !== saved.url && "Link",
    draft.title !== saved.title && "Titel",
    draft.ratio !== saved.ratio && "Seitenverhältnis",
  ]);
  if (parts.length === 0) return undefined;
  const joined = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} und ${parts[parts.length - 1]}`;
  return `${joined} geändert`;
}
