import { firstValueFrom } from "rxjs";
import {
  apiSirenNotAvailableSiret,
  conflictErrorSiret,
  tooManySirenRequestsSiret,
} from "shared/src/siret";
import {
  GetSiretInfoError,
  SiretGatewayThroughBack,
} from "../ports/SiretGatewayThroughBack";
import { expectToEqual } from "../storeConfig/redux.helpers";
import { HttpSiretGatewayThroughBack } from "./HttpSiretGatewayThroughBack";
import { InMemorySiretGatewayThroughBack } from "./InMemorySiretGatewayThroughBack";

const inMemory = new InMemorySiretGatewayThroughBack();
inMemory.sireneEstablishments = {
  "12345678901234": {
    businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
    businessName: "MA P'TITE BOITE",
    isOpen: true,
    naf: {
      code: "7112B",
      nomenclature: "Ref2",
    },
    siret: "12345678901234",
  },
  [tooManySirenRequestsSiret]: {
    businessAddress: "",
    businessName: "",
    isOpen: false,
    siret: tooManySirenRequestsSiret,
  },
  [apiSirenNotAvailableSiret]: {
    businessAddress: "",
    businessName: "",
    isOpen: false,
    siret: apiSirenNotAvailableSiret,
  },
};
const http = new HttpSiretGatewayThroughBack("http://localhost:1234");

const siretGatewaysThroughBack: SiretGatewayThroughBack[] = [inMemory, http];

siretGatewaysThroughBack.forEach((siretGatewayThroughBack) => {
  describe(`${siretGatewayThroughBack.constructor.name} - manual`, () => {
    it("gets siret when all is good", async () => {
      const response = await siretGatewayThroughBack.getSiretInfo(
        "12345678901234",
      );
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

    describe("when there is expected errors", () => {
      it("Missing establishment on SIRENE API.", async () => {
        await expectGetSirenInfoError(
          "00000000000000",
          "Missing establishment on SIRENE API.",
        );
      });

      it("Too many requests", async () => {
        await expectGetSirenInfoError(
          tooManySirenRequestsSiret,
          "Too many requests on SIRENE API.",
        );
      });

      it("Sirene api not available", async () => {
        await expectGetSirenInfoError(
          apiSirenNotAvailableSiret,
          "SIRENE API not available.",
        );
      });

      it("Conflict error", async () => {
        await expectGetSirenInfoErrorWhenCallingGetSiretInfoIfNotAlreadySaved(
          conflictErrorSiret,
          "Establishment with this siret is already in our DB",
        );
      });
    });

    const expectGetSirenInfoError = (
      siret: string,
      expectedInfoError: GetSiretInfoError,
    ) =>
      siretGatewayThroughBack.getSiretInfo(siret).then((result) => {
        expect(result).toBe(expectedInfoError);
      });

    const expectGetSirenInfoErrorWhenCallingGetSiretInfoIfNotAlreadySaved = (
      siret: string,
      expectedInfoError: GetSiretInfoError,
    ) =>
      firstValueFrom(
        siretGatewayThroughBack.getSiretInfoIfNotAlreadySaved(siret),
      ).then((result) => {
        expect(result).toBe(expectedInfoError);
      });
  });
});
