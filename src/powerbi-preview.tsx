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
 * Die Vorschau im Gerätrahmen des Fensters: der Rahmen des Berichts im
 * gewählten Seitenverhältnis, mit einem Platzhalter statt des Berichts.
 *
 * Der echte Bericht wird bewusst nicht geladen: er brächte Netzwerk und eine
 * Anmeldung bei Power BI ins Studio. Zeigen soll die Vorschau, wie viel Platz
 * der Bericht auf dem Gerät einnimmt. Ohne brauchbaren Link steht stattdessen
 * derselbe Hinweis wie auf der Seite.
 */

import * as React from "react";
import { useConfigShell } from "@man/config-ui/shell/shell-context";

import { DEFAULT_RATIO, RATIOS } from "./configuration-schema";
import type { PowerbiConfig } from "./powerbi-config";
import { resolveEmbedUrl } from "./powerbi-url";
import { PowerbiView } from "./powerbi-view";

/** Ein Streifen im Platzhalter: Kopfzeile und Kacheln eines Berichts, nur angedeutet. */
const TILE = "border border-border bg-background";

export function PowerbiPreview({ config }: { config: PowerbiConfig }): React.ReactElement {
  const { view } = useConfigShell();
  const embed = resolveEmbedUrl(config.url);
  const ratio = RATIOS[config.ratio ?? DEFAULT_RATIO] ?? RATIOS[DEFAULT_RATIO];
  const padding = view === "mobile" ? "p-4" : "px-10 py-8";

  return (
    <div inert className={padding} data-testid="powerbi-preview">
      {embed.kind === "ok" ? (
        <div
          role="img"
          aria-label={`Power-BI-Bericht im Format ${config.ratio ?? DEFAULT_RATIO}`}
          style={{ aspectRatio: ratio }}
          className="grid grid-cols-3 grid-rows-[64px_minmax(0,1fr)] gap-3 border border-border bg-muted p-4"
          data-testid="powerbi-preview-frame"
        >
          <span className={TILE} />
          <span className={TILE} />
          <span className={TILE} />
          <span className={`col-span-2 flex items-center justify-center text-sm text-muted-foreground ${TILE}`}>
            Power-BI-Bericht wird hier geladen
          </span>
          <span className={TILE} />
        </div>
      ) : (
        <PowerbiView embed={embed} title="" aspectRatio={ratio} />
      )}
    </div>
  );
}
