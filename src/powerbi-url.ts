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
 * Hosts that serve Power BI reports, one per sovereign cloud.
 *
 * Only these may end up in the frame: the field accepts free text, and a frame
 * pointing anywhere else would let an author embed an arbitrary site under the
 * intranet's name.
 */
export const POWERBI_HOSTS: readonly string[] = [
  "app.powerbi.com",
  "app.powerbigov.us",
  "app.high.powerbigov.us",
  "app.mil.powerbigov.us",
  "app.powerbi.cn",
];

/** Paths that are made to be framed: secure embed, publish to web, dashboards, paginated reports. */
const EMBED_PATHS: readonly string[] = ["/reportembed", "/view", "/dashboardembed", "/rdlembed"];

/** A report opened in the Power BI service: /groups/<workspace>/reports/<report>[/<page>]. */
const SERVICE_REPORT_PATH = /^\/groups\/([^/]+)\/reports\/([0-9a-f-]{36})(?:\/([^/?#]+))?/i;

export const MESSAGE_EMPTY =
  "Kein Power-BI-Link konfiguriert. Bitte in den Widget-Einstellungen den Einbettungslink des Berichts eintragen.";
export const MESSAGE_NOT_POWERBI =
  "Der Link führt nicht zu Power BI. Erlaubt sind nur Links auf app.powerbi.com (bzw. die Power-BI-Clouds für Behörden und China).";
export const MESSAGE_NOT_EMBEDDABLE =
  "Der Link lässt sich nicht einbetten. Bitte in Power BI „Datei › Bericht einbetten › Website oder Portal“ wählen und den dort angezeigten Link eintragen.";

export type EmbedResult = { kind: "ok"; src: string } | { kind: "empty" } | { kind: "invalid"; message: string };

/**
 * Turns whatever an author pasted into the address the frame loads.
 *
 * Takes the embed link itself, the complete `<iframe>` snippet Power BI offers
 * next to it, and the address of a report as it appears in the browser — the
 * last one is rewritten to the matching secure-embed link, because the service
 * page itself refuses to be framed.
 */
export function resolveEmbedUrl(input: unknown): EmbedResult {
  const text = typeof input === "string" ? input.trim() : "";
  if (text === "") return { kind: "empty" };

  const url = parseUrl(extractIframeSrc(text) ?? text);
  if (url === null || url.protocol !== "https:" || !POWERBI_HOSTS.includes(url.hostname.toLowerCase())) {
    return { kind: "invalid", message: MESSAGE_NOT_POWERBI };
  }

  const path = url.pathname.toLowerCase().replace(/\/+$/, "");
  if (EMBED_PATHS.includes(path)) return { kind: "ok", src: url.toString() };

  const serviceReport = SERVICE_REPORT_PATH.exec(url.pathname);
  if (serviceReport !== null) return { kind: "ok", src: toSecureEmbed(url, serviceReport) };

  return { kind: "invalid", message: MESSAGE_NOT_EMBEDDABLE };
}

/** The `src` of a pasted `<iframe>` snippet, or `null` when the text is no snippet. */
function extractIframeSrc(text: string): string | null {
  if (!/^<iframe\b/i.test(text)) return null;
  const match = /\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(text);
  if (match === null) return null;
  return decodeEntities(match[1] ?? match[2] ?? match[3] ?? "");
}

/** Snippets are HTML, so `&` inside the address arrives as `&amp;`. */
function decodeEntities(value: string): string {
  return value.replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/g, "'");
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function toSecureEmbed(serviceUrl: URL, [, workspace, report, page]: RegExpExecArray): string {
  const embed = new URL("/reportEmbed", serviceUrl.origin);
  embed.searchParams.set("reportId", report);
  // "me" is the personal workspace; the embed link has no group for it.
  if (workspace.toLowerCase() !== "me") embed.searchParams.set("groupId", workspace);
  if (page !== undefined) embed.searchParams.set("pageName", page);
  embed.searchParams.set("autoAuth", "true");
  const tenant = serviceUrl.searchParams.get("ctid");
  if (tenant !== null) embed.searchParams.set("ctid", tenant);
  return embed.toString();
}
