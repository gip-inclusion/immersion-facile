import axios from "axios";
import { firstValueFrom } from "rxjs";
import {
  type GetSiretInfoError,
  apiSirenNotAvailableSiret,
  conflictErrorSiret,
  expectToEqual,
  formCompletionRoutes,
  tooManySirenRequestsSiret,
} from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import type { FormCompletionGateway } from "src/core-logic/ports/FormCompletionGateway";
import { HttpFormCompletionGateway } from "./HttpFormCompletionGateway";
import { SimulatedFormCompletionGateway } from "./SimulatedFormCompletionGateway";

const simulated = new SimulatedFormCompletionGateway(0, {
  "12345678901234": {
    businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
    businessName: "MA P'TITE BOITE",
    isOpen: true,
    nafDto: {
      code: "7112B",
      nomenclature: "Ref2",
    },
    siret: "12345678901234",
    numberEmployeesRange: "",
  },
  [tooManySirenRequestsSiret]: {
    businessAddress: "",
    businessName: "",
    isOpen: false,
    siret: tooManySirenRequestsSiret,
    numberEmployeesRange: "1-2",
  },
  [apiSirenNotAvailableSiret]: {
    businessAddress: "",
    businessName: "",
    isOpen: false,
    siret: apiSirenNotAvailableSiret,
    numberEmployeesRange: "3-5",
  },
});

const axiosInstance = axios.create({ baseURL: "http://localhost:1234" });

const http = new HttpFormCompletionGateway(
  createAxiosSharedClient(formCompletionRoutes, axiosInstance),
);

const siretGatewaysThroughBack: FormCompletionGateway[] = [simulated, http];

siretGatewaysThroughBack.forEach((siretGatewayThroughBack) => {
  describe(`${siretGatewayThroughBack.constructor.name} - manual`, () => {
    it("isSiretAlreadyInSaved - returns false if establishment with siret is in DB", async () => {
      const isSaved = await firstValueFrom(
        siretGatewayThroughBack.isSiretAlreadySaved$("40400000000404"),
      );
      expect(isSaved).toBe(false);
    });

    it("gets siret when all is good", async () => {
      const response = await firstValueFrom(
        siretGatewayThroughBack.getSiretInfo$("12345678901234"),
      );
      expectToEqual(response, {
        businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
        businessName: "MA P'TITE BOITE",
        isOpen: true,
        nafDto: {
          code: "7112B",
          nomenclature: "Ref2",
        },
        siret: "12345678901234",
        numberEmployeesRange: "10-19",
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
      firstValueFrom(siretGatewayThroughBack.getSiretInfo$(siret)).then(
        (result) => {
          expect(result).toBe(expectedInfoError);
        },
      );

    const expectGetSirenInfoErrorWhenCallingGetSiretInfoIfNotAlreadySaved = (
      siret: string,
      expectedInfoError: GetSiretInfoError,
    ) =>
      firstValueFrom(
        siretGatewayThroughBack.getSiretInfoIfNotAlreadySaved$(siret),
      ).then((result) => {
        expect(result).toBe(expectedInfoError);
      });
  });
});
