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

import React from "react";

import { EmbedResult, MESSAGE_EMPTY } from "./powerbi-url";

export interface PowerbiViewProps {
  embed: EmbedResult;
  /** Accessible name of the frame. */
  title: string;
  /** CSS `aspect-ratio` of the frame, e.g. `16 / 9`. */
  aspectRatio: string;
}

const NOTICE_STYLE: React.CSSProperties = {
  margin: 0,
  padding: "1rem",
  border: "1px dashed #b0b0b0",
  borderRadius: "4px",
  color: "#4a4a4a",
  background: "#f5f5f5",
  fontSize: "0.9rem",
};

const FRAME_STYLE: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
  border: 0,
};

/**
 * The report in a frame, or a notice saying why there is none.
 *
 * A block that silently renders nothing is indistinguishable from a broken
 * widget, so an empty or refused link always shows its reason.
 */
export function PowerbiView({ embed, title, aspectRatio }: PowerbiViewProps): React.JSX.Element {
  if (embed.kind !== "ok") {
    return (
      <p style={NOTICE_STYLE} role="alert" data-testid="powerbi-notice">
        {embed.kind === "empty" ? MESSAGE_EMPTY : embed.message}
      </p>
    );
  }

  return (
    <div style={{ width: "100%", aspectRatio }} data-testid="powerbi-widget">
      <iframe src={embed.src} title={title} style={FRAME_STYLE} allowFullScreen loading="lazy" />
    </div>
  );
}
