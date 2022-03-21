import { buildTestApp } from "../../_testBuilders/buildTestApp";
import { exportEstablismentsExcelRoute } from "../../shared/routes";
import * as fse from "fs-extra";
import { temporaryStoragePath } from "../../utils/filesystemUtils";

describe("/export-establishments", () => {
  it("fails with 401 without authentication", async () => {
    const { request } = await buildTestApp();
    await request.get(`/${exportEstablismentsExcelRoute}`).expect(401);
  });

  it("by region and aggregated when authenticated", async () => {
    const { request } = await buildTestApp();

    const result = await request
      .get(
        `/${exportEstablismentsExcelRoute}?groupKey=region&aggregateProfession=true`,
      )
      .auth("e2e_tests", "e2e");

    expect(result.status).toBe(200);
    expect(result.headers).toMatchObject({
      "content-disposition":
        'attachment; filename="exportEstablishmentsByRegionAggregatedProfessions.zip"',
      "content-type": "application/zip",
    });

    expect(fse.readdirSync(temporaryStoragePath())).toHaveLength(0);
  });
  it("by departements and expanded when authenticated", async () => {
    const { request } = await buildTestApp();

    const result = await request
      .get(
        `/${exportEstablismentsExcelRoute}?groupKey=department&aggregateProfession=false`,
      )
      .auth("e2e_tests", "e2e");

    expect(result.status).toBe(200);
    expect(result.headers).toMatchObject({
      "content-disposition":
        'attachment; filename="exportEstablishmentsByDepartment.zip"',
      "content-type": "application/zip",
    });

    expect(fse.readdirSync(temporaryStoragePath())).toHaveLength(0);
  });
  it("default to department and not aggregated if incorrect query params", async () => {
    const { request } = await buildTestApp();

    const result = await request
      .get(
        `/${exportEstablismentsExcelRoute}?groupBy=lol&aggregateProfession=poney`,
      )
      .auth("e2e_tests", "e2e");

    expect(result.status).toBe(200);
    expect(result.headers).toMatchObject({
      "content-disposition":
        'attachment; filename="exportEstablishmentsByDepartment.zip"',
      "content-type": "application/zip",
    });

    expect(fse.readdirSync(temporaryStoragePath())).toHaveLength(0);
  });
});
