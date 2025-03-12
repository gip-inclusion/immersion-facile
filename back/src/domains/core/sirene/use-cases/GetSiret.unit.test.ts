import {
  type SiretEstablishmentDto,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { InMemorySiretGateway } from "../adapters/InMemorySiretGateway";
import { GetSiret } from "./GetSiret";

const validEstablishment: SiretEstablishmentDto = {
  siret: "12345678901234",
  businessName: "MA P'TITE BOITE",
  businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
  isOpen: true,
  numberEmployeesRange: "",
};

describe("GetSiret", () => {
  let siretGateway: InMemorySiretGateway;
  let getSiret: GetSiret;

  beforeEach(() => {
    siretGateway = new InMemorySiretGateway();
    getSiret = new GetSiret(siretGateway);
  });

  describe("checking for business being opened", () => {
    const closedEstablishment: SiretEstablishmentDto = {
      ...validEstablishment,
      siret: "11111111111111",
      isOpen: false,
    };

    beforeEach(() => {
      siretGateway.setSirenEstablishment(validEstablishment);
      siretGateway.setSirenEstablishment(closedEstablishment);
    });

    it("marks an open establishment as open, regardless of the period count", async () => {
      const response = await getSiret.execute({
        siret: validEstablishment.siret,
      });

      expectToEqual(response, {
        siret: "12345678901234",
        businessName: "MA P'TITE BOITE",
        businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
        isOpen: true,
        numberEmployeesRange: "",
      });
    });
  });

  it("throws NotFoundError where siret not found", async () => {
    const siret = "40440440440400";
    await expectPromiseToFailWithError(
      getSiret.execute({ siret }),
      errors.siretApi.notFound({ siret }),
    );
  });

  it("returns unavailable Api error if it gets a 429 from API", async () => {
    siretGateway.setError({
      initialError: {
        message: "Request failed with status code 429",
        status: 429,
        data: "some error",
      },
    });
    await expectPromiseToFailWithError(
      getSiret.execute({ siret: "42942942942900" }),
      errors.siretApi.tooManyRequests({ serviceName: "Sirene API" }),
    );
  });
});
