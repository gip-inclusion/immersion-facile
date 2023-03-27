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

  it("returns the parsed info when siret found", async () => {
    sirenGateway.setSirenEstablishment(validEstablishment);
    const response = await getSiret.execute({
      siret: validEstablishment.siret,
    });
    expectToEqual(response, {
      siret: "12345678901234",
      businessName: "MA P'TITE BOITE",
      businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
      isOpen: true,
    });
  });

  it("populates businessName from nom/prenom when denomination not available", async () => {
    sirenGateway.setSirenEstablishment({
      ...validEstablishment,
      businessName: "ALAIN PROST",
    });
    const response = await getSiret.execute({
      siret: validEstablishment.siret,
    });
    expect(response.businessName).toBe("ALAIN PROST");
  });

  it("skips missing parts of adresseEtablissment", async () => {
    sirenGateway.setSirenEstablishment({
      ...validEstablishment,
      businessAddress: "L'ESPLANADE 30430 BARJAC",
    });
    const response = await getSiret.execute({
      siret: validEstablishment.siret,
    });
    expect(response.businessAddress).toBe("L'ESPLANADE 30430 BARJAC");
  });

  it("skips naf when not available", async () => {
    sirenGateway.setSirenEstablishment({
      ...validEstablishment,
      businessName: "MA P'TITE BOITE",
    });
    const response = await getSiret.execute({
      siret: validEstablishment.siret,
    });
    expect(response.nafDto).toBeUndefined();
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

  it("returns establishment as not Open if it is not at the current period", async () => {
    sirenGateway.setSirenEstablishment({
      ...validEstablishment,
      isOpen: false,
    });

    const response = await getSiret.execute({
      siret: validEstablishment.siret,
      includeClosedEstablishments: true,
    });
    expect(response).toMatchObject({ isOpen: false });
  });
});
