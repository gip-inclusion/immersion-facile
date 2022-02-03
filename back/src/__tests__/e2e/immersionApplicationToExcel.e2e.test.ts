import { buildTestApp } from "../../_testBuilders/buildTestApp";
import { extractImmersionApplicationsExcelRoute } from "../../shared/routes";
import { ImmersionApplicationEntityBuilder } from "../../_testBuilders/ImmersionApplicationEntityBuilder";

describe("/extract-demande-immersion-excel", () => {
  it("fails with 401 without authentication", async () => {
    const { request } = await buildTestApp();
    await request.get(`/${extractImmersionApplicationsExcelRoute}`).expect(401);
  });

  it("works when authenticated", async () => {
    const { request, reposAndGateways } = await buildTestApp();
    const immersionApplicationEntity =
      new ImmersionApplicationEntityBuilder().build();

    reposAndGateways.immersionApplication.setImmersionApplications({
      [immersionApplicationEntity.id]: immersionApplicationEntity,
    });

    const result = await request
      .get(`/${extractImmersionApplicationsExcelRoute}`)
      .auth("e2e_tests", "e2e");

    expect(result.status).toBe(200);
    expect(result.body).toEqual([
      {
        ...immersionApplicationEntity.toDto(),
        weeklyHours: 35,
      },
    ]);
  });
});
