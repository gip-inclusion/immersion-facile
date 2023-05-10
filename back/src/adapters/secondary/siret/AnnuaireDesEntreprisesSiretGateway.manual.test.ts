import { expectToEqual } from "shared";
import { configureCreateHttpClientForExternalApi } from "../../primary/config/createHttpClientForExternalApi";
import { AnnuaireDesEntreprisesSiretGateway } from "./AnnuaireDesEntreprisesSiretGateway";
import { annuaireDesEntreprisesSiretTargets } from "./AnnuaireDesEntreprisesSiretGateway.targets";

// These tests are not hermetic and not meant for automated testing. They will make requests to the
// real SIRENE API, use up production quota, and fail for uncontrollable reasons such as quota
// errors.
//
// Requires the following environment variables to be set for the tests to pass:
// - SIRENE_ENDPOINT
// - SIRENE_BEARER_TOKEN
describe("HttpSirenGateway", () => {
  let siretGateway: AnnuaireDesEntreprisesSiretGateway;

  beforeEach(() => {
    siretGateway = new AnnuaireDesEntreprisesSiretGateway(
      configureCreateHttpClientForExternalApi()(
        annuaireDesEntreprisesSiretTargets,
      ),
    );
  });

  it("returns open establishments", async () => {
    // ETABLISSEMENT PUBLIC DU MUSEE DU LOUVRE (should be active)
    const response = await siretGateway.getEstablishmentBySiret(
      "18004623700012",
    );
    expectToEqual(response, {
      businessAddress: "NUM 34 ET 36 34 QUAI FRANCOIS MITTERRAND 75001 PARIS 1",
      businessName: "ETABLISSEMENT PUBLIC DU MUSEE DU LOUVRE",
      isOpen: true,
      nafDto: {
        code: "9103Z",
        nomenclature: "NAFRev2",
      },
      numberEmployeesRange: "50-99",
      siret: "18004623700012",
    });
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
    const response = await siretGateway.getEstablishmentBySiret(
      "38961161700017",
    );
    expectToEqual(response, undefined);
  });
});
