import { expectToEqual } from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import { createFetchSharedClient } from "shared-routes/fetch";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { makeAxiosInstances } from "../../../../utils/axiosUtils";
import { withNoCache } from "../../caching-gateway/adapters/withNoCache";
import { noRetries } from "../../retry-strategy/ports/RetryStrategy";
import { RealTimeGateway } from "../../time-gateway/adapters/RealTimeGateway";
import {
  AnnuaireDesEntreprisesSiretGateway,
  nonDiffusibleEstablishmentName,
} from "./AnnuaireDesEntreprisesSiretGateway";
import { annuaireDesEntreprisesSiretRoutes } from "./AnnuaireDesEntreprisesSiretGateway.routes";
import { InseeSiretGateway } from "./InseeSiretGateway";
import { inseeExternalRoutes } from "./InseeSiretGateway.routes";

// These tests are not hermetic and not meant for automated testing. They will make requests to the
// real SIRENE API, use up production quota, and fail for uncontrollable reasons such as quota
// errors.
describe("AnnuaireDesEntreprisesSiretGateway", () => {
  let siretGateway: AnnuaireDesEntreprisesSiretGateway;
  const config = AppConfig.createFromEnv();
  const inseeHttpClient = createAxiosSharedClient(
    inseeExternalRoutes,
    makeAxiosInstances(config.externalAxiosTimeout).axiosWithValidateStatus,
    {
      skipResponseValidation: true,
      onResponseSideEffect: ({ input, route, response }) =>
        // biome-ignore lint/suspicious/noConsole: debug purpose
        console.info(
          `SIREN API was called: ${route.method} ${route.url}
          with : ${JSON.stringify(input, null, 2)}.
          Response status was ${response.status}`,
        ),
    },
  );

  beforeEach(() => {
    siretGateway = new AnnuaireDesEntreprisesSiretGateway(
      createFetchSharedClient(annuaireDesEntreprisesSiretRoutes, fetch),
      new InseeSiretGateway(
        config.inseeHttpConfig,
        inseeHttpClient,
        new RealTimeGateway(),
        noRetries,
        withNoCache,
      ),
    );
  });

  it("returns open establishments", async () => {
    // ETABLISSEMENT PUBLIC DU MUSEE DU LOUVRE (should be active)
    const response =
      await siretGateway.getEstablishmentBySiret("18004623700012");
    expectToEqual(response, {
      businessAddress: "NUM 34 ET 36 34 QUAI FRANCOIS MITTERRAND 75001 PARIS",
      businessName: "ETABLISSEMENT PUBLIC DU MUSEE DU LOUVRE",
      isOpen: true,
      nafDto: {
        code: "9103Z",
        nomenclature: "NAFRev2",
      },
      numberEmployeesRange: "2000-4999",
      siret: "18004623700012",
    });
  });

  it("returns non diffusible open establishments", async () => {
    const response =
      await siretGateway.getEstablishmentBySiret("80327462000043");
    expectToEqual(response, {
      businessAddress: "127 RUE DE NANTES 85800 LE FENOUILLER",
      businessName: "LUCIE LEBOURDAIS",
      isOpen: true,
      nafDto: {
        code: "8690D",
        nomenclature: "NAFRev2",
      },
      numberEmployeesRange: "",
      siret: "80327462000043",
    });
  });

  it("returns undefined when no establishment found", async () => {
    const response =
      await siretGateway.getEstablishmentBySiret("00000000000000");
    expect(response).toBeUndefined();
  });

  it("retrieves closed establishments", async () => {
    // SOCIETE TEXTILE D'HENIN LIETARD, closed in 1966.
    const includeClosedEstablishments = true;
    const response = await siretGateway.getEstablishmentBySiret(
      "38961161700017",
      includeClosedEstablishments,
    );
    expectToEqual(response, {
      businessAddress: "RTE BEAUMONT COURCELLES 62110 HENIN-BEAUMONT",
      businessName: "SOCIETE TEXTILE D'HENIN LIETARD",
      isOpen: false,
      nafDto: {
        code: "4701",
        nomenclature: "NAFRev2",
      },
      numberEmployeesRange: "",
      siret: "38961161700017",
    });
  });

  it("filters out closed establishments", async () => {
    // SOCIETE TEXTILE D'HENIN LIETARD, closed in 1966.
    const response =
      await siretGateway.getEstablishmentBySiret("38961161700017");
    expectToEqual(response, undefined);
  });

  const parallelCallQty = 20;
  it(
    "Should support several of parallel calls, and queue the calls if over accepted rate",
    async () => {
      const siretsPromises = Array(parallelCallQty).fill("34493368400021");
      const results = await Promise.all(
        siretsPromises.map((siret) =>
          siretGateway.getEstablishmentBySiret(siret),
        ),
      );
      expect(results).toHaveLength(siretsPromises.length);
    },
    1_000 * parallelCallQty * 1.2,
  );

  it("Should return a non diffusible establishment using fallback API", async () => {
    const nonDiffusibleEstablishment =
      await siretGateway.getEstablishmentBySiret("44117926400078");
    expect(
      nonDiffusibleEstablishment?.businessName.includes(
        nonDiffusibleEstablishmentName,
      ),
    ).toBe(false);
  });

  it("Should work also with an establishment with no nom_commercial", async () => {
    const establishment =
      await siretGateway.getEstablishmentBySiret("83748116700026");
    expect(establishment?.businessName).toBe("P E CONSEIL");
  });

  it("Should work also with an establishment with no root 'activite_principale'", async () => {
    const establishment =
      await siretGateway.getEstablishmentBySiret("77570970201646");
    expect(establishment?.businessName).toBe(
      "MUTUELLE ASSURANCE INSTITUTEUR FRANCE (MAIF)",
    );
    expectToEqual(establishment, {
      businessAddress: "200 AVENUE SALVADOR ALLENDE 79000 NIORT",
      businessName: "MUTUELLE ASSURANCE INSTITUTEUR FRANCE (MAIF)",
      isOpen: true,
      nafDto: {
        code: "6512Z",
        nomenclature: "NAFRev2",
      },
      numberEmployeesRange: "5000-9999",
      siret: "77570970201646",
    });
  });
});
