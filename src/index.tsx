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

import { startWidget } from "@shared/dev-mode/start-widget";
import { setPublicPathFromBundle } from "@shared/public-path";

// Must run before any dynamic `import()`, so that lazily loaded chunks come
// from the CDN the bundle was served from and not from the hosting page.
setPublicPathFromBundle("powerbi-widget.js");
import React from "react";
import ReactDOM from "react-dom/client";

import { BlockFactory, BlockDefinition, ExternalBlockDefinition, BaseBlock } from "widget-sdk";
import { ALL_ATTRIBUTES, configurationSchema, DEFAULT_RATIO, DEFAULT_TITLE, RATIOS, uiSchema } from "./configuration-schema";
import { resolvePowerbiConfig } from "./powerbi-config";
import { startPowerbiDialog } from "./powerbi-dialog";
import { resolveEmbedUrl } from "./powerbi-url";
import { PowerbiView } from "./powerbi-view";
import icon from "../resources/powerbi-widget.svg";
import pkg from "../package.json";

/** Attributes handled by the widget; mirrored in the configuration schema and `widgets.json`. */
export const widgetAttributes: string[] = ALL_ATTRIBUTES;

/** The frame's accessible name; the default when the field is left empty. */
export function readTitle(value: unknown): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : DEFAULT_TITLE;
}

/** CSS `aspect-ratio` for the stored choice; the default for anything unknown. */
export function readAspectRatio(value: unknown): string {
  return (typeof value === "string" && RATIOS[value]) || RATIOS[DEFAULT_RATIO];
}

const factory: BlockFactory = (BaseBlockClass, _widgetApi) => {
  return class PowerbiWidgetBlock extends BaseBlockClass implements BaseBlock {
    private _root: ReactDOM.Root | null = null;

    public renderBlock(container: HTMLElement): void {
      // `powerbi-config`, je Schlüssel vor dem einzelnen Feld älterer Fassungen:
      // Blöcke ohne `powerbi-config` rendern wie bisher (`powerbi-config.ts`).
      const settings = resolvePowerbiConfig(this.parseAttributes<Record<string, unknown>>());

      this._root ??= ReactDOM.createRoot(container);
      this._root.render(
        <PowerbiView
          embed={resolveEmbedUrl(settings.url)}
          title={readTitle(settings.title)}
          aspectRatio={readAspectRatio(settings.ratio)}
        />,
      );
    }

    public unmountBlock(_container: HTMLElement): void {
      this._root?.unmount();
      this._root = null;
    }

    public static get observedAttributes(): string[] {
      return widgetAttributes;
    }

    public attributeChangedCallback(...args: [string, string | undefined, string | undefined]): void {
      super.attributeChangedCallback.apply(this, args);
    }
  };
};

const blockDefinition: BlockDefinition = {
  name: "powerbi-widget",
  factory: factory,
  attributes: widgetAttributes,
  blockLevel: "block",
  configurationSchema: configurationSchema,
  uiSchema: uiSchema,
  label: "Power BI",
  iconUrl: icon,
};

const externalBlockDefinition: ExternalBlockDefinition = {
  blockDefinition,
  author: pkg.author,
  version: pkg.version,
};

// Guarded so the module loads in Jest/jsdom, where defineBlock is absent.
// Das Fenster „Bericht einbinden“ hängt am Anmelden, nicht am Laden: auf
// Modulebene gestartet, belegte das installierte Bündel das Feld
// `powerbi-config`, bevor feststeht, ob ein lokaler Entwicklungsserver
// übernimmt.
if (typeof window.defineBlock === "function") {
  void startWidget({
    name: "powerbi-widget",
    version: pkg.version,
    register: () => {
      startPowerbiDialog();
      window.defineBlock(externalBlockDefinition);
    },
  });
}
