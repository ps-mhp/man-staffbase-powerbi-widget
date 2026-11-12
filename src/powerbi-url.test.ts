import { MESSAGE_NOT_EMBEDDABLE, MESSAGE_NOT_POWERBI, resolveEmbedUrl } from "./powerbi-url";

const EMBED =
  "https://app.powerbi.com/reportEmbed?reportId=b2bf959a-1402-4caa-af45-6836de946b05&autoAuth=true&ctid=a21424d1-f651-4ed4-89bf-6edaa0bd5ee4";

describe("resolveEmbedUrl", () => {
  it("takes a secure embed link as it is", () => {
    expect(resolveEmbedUrl(EMBED)).toEqual({ kind: "ok", src: EMBED });
    expect(resolveEmbedUrl(`  ${EMBED}\n`)).toEqual({ kind: "ok", src: EMBED });
  });

  it("takes publish-to-web, dashboard and paginated links", () => {
    for (const link of [
      "https://app.powerbi.com/view?r=eyJrIjoiYWJjIn0%3D",
      "https://app.powerbi.com/dashboardEmbed?dashboardId=1&autoAuth=true",
      "https://app.powerbi.com/rdlEmbed?reportId=1&autoAuth=true",
      "https://app.powerbigov.us/reportEmbed?reportId=1",
    ]) {
      expect(resolveEmbedUrl(link)).toEqual({ kind: "ok", src: link });
    }
  });

  it("reads the address out of a pasted iframe snippet", () => {
    const snippet = `<iframe title="Bericht" width="1140" height="541.25" src="${EMBED.replace(/&/g, "&amp;")}" frameborder="0" allowFullScreen="true"></iframe>`;
    expect(resolveEmbedUrl(snippet)).toEqual({ kind: "ok", src: EMBED });
  });

  it("rewrites a report address from the browser to its embed link", () => {
    const service =
      "https://app.powerbi.com/groups/1f2e3d4c-0000-4000-8000-000000000001/reports/b2bf959a-1402-4caa-af45-6836de946b05/ReportSection12ab?experience=power-bi&ctid=a21424d1-f651-4ed4-89bf-6edaa0bd5ee4";
    const result = resolveEmbedUrl(service);
    expect(result.kind).toBe("ok");
    const src = new URL((result as { src: string }).src);
    expect(src.pathname).toBe("/reportEmbed");
    expect(Object.fromEntries(src.searchParams)).toEqual({
      reportId: "b2bf959a-1402-4caa-af45-6836de946b05",
      groupId: "1f2e3d4c-0000-4000-8000-000000000001",
      pageName: "ReportSection12ab",
      autoAuth: "true",
      ctid: "a21424d1-f651-4ed4-89bf-6edaa0bd5ee4",
    });
  });

  it("leaves the group out for the personal workspace", () => {
    const result = resolveEmbedUrl(
      "https://app.powerbi.com/groups/me/reports/b2bf959a-1402-4caa-af45-6836de946b05",
    );
    const src = new URL((result as { src: string }).src);
    expect(src.searchParams.has("groupId")).toBe(false);
    expect(src.searchParams.has("pageName")).toBe(false);
  });

  it("reports an empty field as unconfigured", () => {
    expect(resolveEmbedUrl(undefined)).toEqual({ kind: "empty" });
    expect(resolveEmbedUrl("   ")).toEqual({ kind: "empty" });
    expect(resolveEmbedUrl(42)).toEqual({ kind: "empty" });
  });

  it("refuses anything that is not Power BI over https", () => {
    for (const link of [
      "http://app.powerbi.com/reportEmbed?reportId=1",
      "https://evil.example/reportEmbed?reportId=1",
      "https://app.powerbi.com.evil.example/reportEmbed",
      "javascript:alert(1)",
      "kein Link",
      '<iframe src="https://evil.example/reportEmbed"></iframe>',
    ]) {
      expect(resolveEmbedUrl(link)).toEqual({ kind: "invalid", message: MESSAGE_NOT_POWERBI });
    }
  });

  it("explains when a Power BI page cannot be framed", () => {
    expect(resolveEmbedUrl("https://app.powerbi.com/home")).toEqual({
      kind: "invalid",
      message: MESSAGE_NOT_EMBEDDABLE,
    });
    expect(resolveEmbedUrl("https://app.powerbi.com/links/AbCdEf")).toEqual({
      kind: "invalid",
      message: MESSAGE_NOT_EMBEDDABLE,
    });
  });
});
