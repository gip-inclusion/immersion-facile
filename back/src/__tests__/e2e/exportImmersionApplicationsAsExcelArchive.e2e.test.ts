import { AgencyDto } from "shared/src/agency/agency.dto";
import { exportConventionsExcelRoute } from "shared/src/routes";
import { buildTestApp } from "../../_testBuilders/buildTestApp";
import { ConventionEntityBuilder } from "../../_testBuilders/ConventionEntityBuilder";

describe("/export-demande-immersions-excel", () => {
  it("fails with 401 without authentication", async () => {
    const { request } = await buildTestApp();
    await request.get(`/${exportConventionsExcelRoute}`).expect(401);
  });

  it("works when authenticated", async () => {
    const { request, reposAndGateways } = await buildTestApp();
    const linkedAgency: AgencyDto = (
      await reposAndGateways.agency.getAllActive()
    )[0];
    const conventionEntity = new ConventionEntityBuilder()
      .withAgencyId(linkedAgency.id)
      .build();

    reposAndGateways.convention.setConventions({
      [conventionEntity.id]: conventionEntity,
    });

    const result = await request
      .get(`/${exportConventionsExcelRoute}`)
      .auth("e2e_tests", "e2e");

    expect(result.status).toBe(200);
    expect(result.headers).toMatchObject({
      "content-disposition": 'attachment; filename="exportAgencies.zip"',
      "content-type": "application/zip",
    });
  });
});
