import {
  NotFoundError,
  TooManyRequestApiError,
} from "../../../adapters/primary/helpers/httpErrors";
import { GetSiret } from "./GetSiret";
import { InMemorySirenGateway } from "../../../adapters/secondary/sirene/InMemorySirenGateway";
import {
  expectPromiseToFailWithError,
  expectToEqual,
  SirenEstablishmentDto,
} from "shared";

const validEstablishment: SirenEstablishmentDto = {
  siret: "12345678901234",
  businessName: "MA P'TITE BOITE",
  businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
  isOpen: true,
  numberEmployeesRange: "",
};

describe("GetSiret", () => {
  let sirenGateway: InMemorySirenGateway;
  let getSiret: GetSiret;

  beforeEach(() => {
    sirenGateway = new InMemorySirenGateway();
    getSiret = new GetSiret(sirenGateway);
  });

  describe("checking for business being opened", () => {
    const closedEstablishment: SirenEstablishmentDto = {
      ...validEstablishment,
      siret: "11111111111111",
      isOpen: false,
    };

    beforeEach(() => {
      sirenGateway.setSirenEstablishment(validEstablishment);
      sirenGateway.setSirenEstablishment(closedEstablishment);
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
    await expectPromiseToFailWithError(
      getSiret.execute({ siret: "40440440440400" }),
      new NotFoundError(
        "Did not find establishment with siret : 40440440440400 in siren API",
      ),
    );
  });

  it("returns unavailable Api error if it gets a 429 from API", async () => {
    sirenGateway.setError({
      initialError: {
        message: "Request failed with status code 429",
        status: 429,
        data: "some error",
      },
    });
    await expectPromiseToFailWithError(
      getSiret.execute({ siret: "42942942942900" }),
      new TooManyRequestApiError("Sirene API"),
    );
  });
});
