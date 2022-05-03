import { SiretGatewayThroughBack } from "../ports/SiretGatewayThroughBack";
import { expectToEqual } from "../storeConfig/redux.helpers";
import { HttpSiretGatewayThroughBack } from "./HttpSiretGatewayThroughBack";

describe("HttpSiretGatewayThroughBack - manual", () => {
  let siretGateway: SiretGatewayThroughBack;

  beforeEach(() => {
    siretGateway = new HttpSiretGatewayThroughBack("http://localhost:1234");
  });

  it("gets siret when all is good", async () => {
    const response = await siretGateway.getSiretInfo("12345678901234");
    expectToEqual(response, {
      businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
      businessName: "MA P'TITE BOITE",
      isOpen: true,
      naf: {
        code: "7112B",
        nomenclature: "Ref2",
      },
      siret: "12345678901234",
    });
  });

  describe("when there is an error", () => {
    it("not found", async () => {
      await expectGetSirenInfoError("40400000000404", {
        status: 404,
        errorMessage: "Request failed with status code 404",
      });
    });

    it("to many requests", async () => {
      await expectGetSirenInfoError("42900000000429", {
        status: 429,
        errorMessage: "Request failed with status code 429",
      });
    });

    it("siren api not available", async () => {
      await expectGetSirenInfoError("50300000000503", {
        status: 503,
        errorMessage: "Request failed with status code 503",
      });
    });
  });

  const expectGetSirenInfoError = async (
    siret: string,
    expected: { status: number; errorMessage: string },
  ) =>
    siretGateway
      .getSiretInfo(siret)
      .then(() => {
        throw "Sould not be reached";
      })
      .catch((e) => {
        // eslint-disable-next-line
        expect(e.response.status).toBe(expected.status);
        // eslint-disable-next-line
        expect(e.message).toBe(expected.errorMessage);
      });
});
