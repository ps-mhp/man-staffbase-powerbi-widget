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
 * Der Rumpf des Fensters „Bericht einbinden“ im gemeinsamen Rahmen von
 * `@man/config-ui`: das Formular mit Inhalt, Barrierefreiheit und Gestaltung,
 * in den Geräteansichten die Vorschau.
 *
 * Wie im Screen: im Editor steht das Formular in der Mitte, ohne Seitenleiste
 * und ohne Inspektor – das Widget hat nur einen Bericht, keine Liste. In
 * Desktop, Tablet und Mobil wandern dieselben Abschnitte in den Inspektor
 * neben der Vorschau, knapper (ohne die langen Hinweise), damit man beim
 * Umschalten weiter einstellen kann und das Ergebnis sofort sieht.
 *
 * Nur im Studio nachgeladen (`powerbi-dialog.tsx`): er bringt react-aria und
 * Tailwind mit, und das hat im Seitenbündel nichts verloren. Kopf, Übernehmen,
 * Rückgängig und Rückfrage kommen vom Rahmen.
 */

import * as React from "react";
import { Field } from "@man/config-ui/form/field";
import { FormSection } from "@man/config-ui/form/form-section";
import { SegmentedField } from "@man/config-ui/form/segmented-field";
import type { SegmentedOption } from "@man/config-ui/form/segmented";
import { InspectorPanel } from "@man/config-ui/inspector/inspector-panel";
import { ConfigWorkspace } from "@man/config-ui/layout/config-workspace";
import { Input } from "@man/config-ui/primitives/input";
import { Textarea } from "@man/config-ui/primitives/textarea";
import { useConfigShell } from "@man/config-ui/shell/shell-context";

import { DEFAULT_TITLE, RATIOS } from "./configuration-schema";
import type { PowerbiConfig } from "./powerbi-config";
import { URL_ISSUE, urlProblem, validatePowerbiConfig } from "./powerbi-editor-rules";
import { PowerbiPreview } from "./powerbi-preview";

const RATIO_OPTIONS: readonly SegmentedOption<string>[] = Object.keys(RATIOS).map((id) => ({ id, label: id }));

const URL_PLACEHOLDER = "https://app.powerbi.com/reportEmbed?reportId=…";

const URL_HINT_DETAILED =
  "In Power BI: Datei › Bericht einbetten › Website oder Portal – den Link oder den ganzen Code hier einfügen.";
const URL_HINT_SHORT = "Einbettungslink, <iframe>-Code oder Link mit „view?r=“";

const TITLE_HINT = "Wird vorgelesen. Kurz sagen, was der Bericht zeigt.";

const RATIO_HINT = "Breite zu Höhe des Berichts. Am besten das Format der Berichtsseite in Power BI wählen.";
/** Solange nichts gewählt ist, gilt der bisherige Wert – im Fenster nicht lesbar, aber nicht verloren. */
const RATIO_HINT_UNSET = "Es gilt das bisher eingestellte Seitenverhältnis, bis hier eines gewählt wird.";

export interface PowerbiEditorProps {
  value: PowerbiConfig;
  onChange: (value: PowerbiConfig) => void;
}

interface FormProps extends PowerbiEditorProps {
  /** Mit den langen Hinweisen (Editor) oder knapp (Inspektor neben der Vorschau). */
  detailed: boolean;
}

/** Die Meldung zum Link, aber erst, wenn „Übernehmen“ an ihr gescheitert ist. */
function useUrlIssue(value: PowerbiConfig): string | undefined {
  const { issuesVisible } = useConfigShell();
  if (!issuesVisible) return undefined;
  return validatePowerbiConfig(value).some((issue) => issue.id === URL_ISSUE) ? urlProblem(value.url) : undefined;
}

/** Die drei Abschnitte des Formulars; im Editor und im Inspektor dieselben. */
function PowerbiForm({ value, onChange, detailed }: FormProps): React.ReactElement {
  const urlIssue = useUrlIssue(value);
  const ratioHint = value.ratio === undefined ? RATIO_HINT_UNSET : RATIO_HINT;

  return (
    <div className="flex flex-col gap-8" data-testid="powerbi-form">
      <FormSection title="Inhalt">
        <Field
          label="Power-BI-Link"
          required
          error={urlIssue}
          hint={detailed ? URL_HINT_DETAILED : URL_HINT_SHORT}
        >
          <Textarea
            rows={3}
            value={value.url ?? ""}
            placeholder={URL_PLACEHOLDER}
            onChange={(event) => onChange({ ...value, url: event.target.value })}
          />
        </Field>
      </FormSection>
      <FormSection title="Barrierefreiheit">
        <Field label="Titel für Screenreader" hint={detailed ? TITLE_HINT : undefined}>
          <Input
            type="text"
            value={value.title ?? ""}
            placeholder={DEFAULT_TITLE}
            onChange={(event) => onChange({ ...value, title: event.target.value })}
          />
        </Field>
      </FormSection>
      <FormSection title="Gestaltung">
        <SegmentedField
          label="Seitenverhältnis"
          hint={detailed ? ratioHint : undefined}
          options={RATIO_OPTIONS}
          // Ungesetzt: keine Pill ist gewählt (kein Schlüssel heisst ""), das alte Attribut gilt.
          value={value.ratio ?? ""}
          onChange={(ratio) => onChange({ ...value, ratio })}
        />
      </FormSection>
    </div>
  );
}

export function PowerbiEditor({ value, onChange }: PowerbiEditorProps): React.ReactElement {
  // Im Editor stehen dieselben Abschnitte in der Mitte; ein Inspektor daneben verdoppelte sie.
  const { view } = useConfigShell();

  return (
    <ConfigWorkspace
      preview={<PowerbiPreview config={value} />}
      inspector={
        view === "editor" ? undefined : (
          <InspectorPanel title="Einstellungen">
            <div data-testid="powerbi-inspector">
              <PowerbiForm value={value} onChange={onChange} detailed={false} />
            </div>
          </InspectorPanel>
        )
      }
    >
      <div className="max-w-[720px] px-10 pt-6 pb-12" data-testid="powerbi-editor">
        <PowerbiForm value={value} onChange={onChange} detailed />
      </div>
    </ConfigWorkspace>
  );
}
