import { BackOfficeJwt, ExportDataDto, exportRoute } from "shared";
import { SuperTest, Test } from "supertest";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { AppConfig } from "../../config/appConfig";

describe("/export", () => {
  let adminToken: BackOfficeJwt;
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
    await request.get(`/admin/${exportRoute}`).expect(401);
  });

  it("returns a ZIP file when authenticated", async () => {
    // Prepare
    const { request, inMemoryUow } = await buildTestApp();

    inMemoryUow.exportQueries.exported = {
      Paris: [
        { Siret: "124", "Nom de l'entreprise": "une entreprise" },
        { Siret: "567", "Nom de l'entreprise": "une autre entreprise" },
      ],
      "Nantes métropole": [
        { Siret: "124", "Nom de l'entreprise": "une entreprise" },
        { Siret: "567", "Nom de l'entreprise": "une autre entreprise" },
      ],
    };

    const exportDataParams: ExportDataDto = {
      fileName: "etablissements",
      exportableParams: {
        name: "establishments_with_aggregated_offers",
        filters: {},
      },
    };

    // Act
    const result = await request
      .post(`/admin/${exportRoute}`)
      .set("Authorization", adminToken)
      .send(exportDataParams);

    // Assert
    expect(result.status).toBe(200);

    expect(result.headers).toMatchObject({
      "content-disposition": 'attachment; filename="etablissements.zip"',
      "content-type": "application/zip",
    });
  });
});
