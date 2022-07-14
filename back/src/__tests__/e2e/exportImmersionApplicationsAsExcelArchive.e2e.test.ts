import { AdminToken } from "shared/src/admin/admin.dto";
import { AgencyDto } from "shared/src/agency/agency.dto";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { exportConventionsExcelRoute } from "shared/src/routes";
import { SuperTest, Test } from "supertest";
import { buildTestApp } from "../../_testBuilders/buildTestApp";
import { AppConfig } from "../../adapters/primary/config/appConfig";
import { InMemoryUnitOfWork } from "../../adapters/primary/config/uowConfig";

describe("/export-demande-immersions-excel", () => {
  let adminToken: AdminToken;
  let request: SuperTest<Test>;
  let inMemoryUow: InMemoryUnitOfWork;
  let appConfig: AppConfig;

  beforeEach(async () => {
    ({ request, inMemoryUow, appConfig } = await buildTestApp());

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
    await request
      .get(`/admin/excel/${exportConventionsExcelRoute}`)
      .expect(401);
  });

  it("works when authenticated", async () => {
    const linkedAgency: AgencyDto = (
      await inMemoryUow.agencyRepository.getAgencies({})
    )[0];
    const convention = new ConventionDtoBuilder()
      .withAgencyId(linkedAgency.id)
      .build();

    inMemoryUow.conventionRepository.setConventions({
      [convention.id]: convention,
    });

    const result = await request
      .get(`/admin/excel/${exportConventionsExcelRoute}`)
      .set("Authorization", adminToken);

    expect(result.body).toEqual({});
    expect(result.status).toBe(200);
    expect(result.headers).toMatchObject({
      "content-disposition": 'attachment; filename="exportAgencies.zip"',
      "content-type": "application/zip",
    });
  });
});
