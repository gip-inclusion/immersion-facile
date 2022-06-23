import { AgencyDto } from "shared/src/agency/agency.dto";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { exportConventionsExcelRoute } from "shared/src/routes";
import { buildTestApp } from "../../_testBuilders/buildTestApp";

describe("/export-demande-immersions-excel", () => {
  it("fails with 401 without authentication", async () => {
    const { request } = await buildTestApp();
    await request.get(`/${exportConventionsExcelRoute}`).expect(401);
  });

  it("works when authenticated", async () => {
    const { request, reposAndGateways } = await buildTestApp();
    const linkedAgency: AgencyDto = (
      await reposAndGateways.agency.getAgencies({})
    )[0];
    const convention = new ConventionDtoBuilder()
      .withAgencyId(linkedAgency.id)
      .build();

    reposAndGateways.convention.setConventions({
      [convention.id]: convention,
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
