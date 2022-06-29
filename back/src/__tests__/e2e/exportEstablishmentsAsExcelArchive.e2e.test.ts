import { AdminToken } from "shared/src/admin/admin.dto";
import { SuperTest, Test } from "supertest";
import { buildTestApp } from "../../_testBuilders/buildTestApp";
import { exportEstablismentsExcelRoute } from "shared/src/routes";
import { AppConfig } from "../../adapters/primary/config/appConfig";

describe("/export-establishments", () => {
  let adminToken: AdminToken;
  let request: SuperTest<Test>;
  let appConfig: AppConfig;

  beforeEach(async () => {
    ({ request, appConfig } = await buildTestApp());

    const response = await request
      .post("/admin/login")
      .send({
        user: appConfig.backofficeUsername,
        password: appConfig.backofficePassword,
      })
      .expect(200);

    adminToken = response.body;
  });

  it("fails with 401 without authentication", async () => {
    const { request } = await buildTestApp();
    await request
      .get(`/admin/excel/${exportEstablismentsExcelRoute}`)
      .expect(401);
  });

  it("by region and aggregated when authenticated", async () => {
    const { request } = await buildTestApp();

    const result = await request
      .get(
        `/admin/excel/${exportEstablismentsExcelRoute}?groupKey=region&aggregateProfession=true&sourceProvider=all`,
      )
      .set("Authorization", adminToken);

    expect(result.headers).toMatchObject({
      "content-disposition":
        'attachment; filename="exportAllEstablishmentsByRegionAggregatedProfessions.zip"',
      "content-type": "application/zip",
    });

    expect(result.status).toBe(200);
  });
  it("by departements and expanded when authenticated", async () => {
    const { request } = await buildTestApp();

    const result = await request
      .get(
        `/admin/excel/${exportEstablismentsExcelRoute}?groupKey=department&aggregateProfession=false&sourceProvider=all`,
      )
      .set("Authorization", adminToken);

    expect(result.headers).toMatchObject({
      "content-disposition":
        'attachment; filename="exportAllEstablishmentsByDepartment.zip"',
      "content-type": "application/zip",
    });
    expect(result.status).toBe(200);
  });
  it("default to department and not aggregated if incorrect query params", async () => {
    const { request } = await buildTestApp();

    const result = await request
      .get(
        `/admin/excel/${exportEstablismentsExcelRoute}?groupBy=lol&aggregateProfession=poney&sourceProvider=cma`,
      )
      .set("Authorization", adminToken);

    expect(result.status).toBe(200);
    expect(result.headers).toMatchObject({
      "content-disposition":
        'attachment; filename="exportCmaEstablishmentsByDepartment.zip"',
      "content-type": "application/zip",
    });
  });
  it("source provider is cci", async () => {
    const { request } = await buildTestApp();

    const result = await request
      .get(
        `/admin/excel/${exportEstablismentsExcelRoute}?groupKey=region&aggregateProfession=true&sourceProvider=cci`,
      )
      .set("Authorization", adminToken);

    expect(result.status).toBe(200);
    expect(result.headers).toMatchObject({
      "content-disposition":
        'attachment; filename="exportCciEstablishmentsByRegionAggregatedProfessions.zip"',
      "content-type": "application/zip",
    });
  });
});
