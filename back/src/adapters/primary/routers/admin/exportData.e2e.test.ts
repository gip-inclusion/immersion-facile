import { SuperTest, Test } from "supertest";

import { BackOfficeJwt, ExportDataDto, exportRoute } from "shared";

import {
  buildTestApp,
  InMemoryGateways,
} from "../../../../_testBuilders/buildTestApp";
import { AppConfig } from "../../config/appConfig";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

describe("/export", () => {
  let adminToken: BackOfficeJwt;
  let request: SuperTest<Test>;
  let appConfig: AppConfig;
  let gateways: InMemoryGateways;
  let inMemoryUow: InMemoryUnitOfWork;

  beforeEach(async () => {
    ({ request, appConfig, gateways, inMemoryUow } = await buildTestApp());

    gateways.timeGateway.setNextDate(new Date());

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
    await request.get(`/admin/${exportRoute}`).expect(401);
  });

  it("returns a ZIP file when authenticated", async () => {
    // Prepare
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
