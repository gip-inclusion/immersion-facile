import {
  NotFoundError,
  TooManyRequestApiError,
} from "../../../adapters/primary/helpers/httpErrors";
import { SirenApiRawEstablishment } from "../ports/SirenGateway";
import { GetSiret } from "./GetSiret";
import { InMemorySirenGateway } from "../../../adapters/secondary/sirene/InMemorySirenGateway";
import { expectPromiseToFailWithError, expectToEqual } from "shared";

const validEstablishment: SirenApiRawEstablishment = {
  siret: "12345678901234",
  uniteLegale: {
    denominationUniteLegale: "MA P'TITE BOITE",
    activitePrincipaleUniteLegale: "78.3Z",
    nomenclatureActivitePrincipaleUniteLegale: "Ref2",
    etatAdministratifUniteLegale: "A",
  },
  adresseEtablissement: {
    numeroVoieEtablissement: "20",
    typeVoieEtablissement: "AVENUE",
    libelleVoieEtablissement: "DE SEGUR",
    codePostalEtablissement: "75007",
    libelleCommuneEtablissement: "PARIS 7",
  },
  periodesEtablissement: [
    {
      dateFin: null,
      dateDebut: "2022-01-01",
      etatAdministratifEtablissement: "A",
    },
  ],
};

describe("GetSiret", () => {
  let sirenGateway: InMemorySirenGateway;
  let getSiret: GetSiret;

  beforeEach(() => {
    sirenGateway = new InMemorySirenGateway();
    getSiret = new GetSiret(sirenGateway);
  });

  describe("checking for business being opened", () => {
    const closedEstablishment: SirenApiRawEstablishment = {
      ...validEstablishment,
      siret: "11111111111111",
      uniteLegale: {
        etatAdministratifUniteLegale: "F",
      },
    };

    beforeEach(() => {
      sirenGateway.setRawEstablishment(validEstablishment);
      sirenGateway.setRawEstablishment(closedEstablishment);
    });

    it("marks an open establishment as open, regardless of the period count", async () => {
      const response = await getSiret.execute({
        siret: validEstablishment.siret,
      });

      expectToEqual(response, {
        siret: "12345678901234",
        businessName: "MA P'TITE BOITE",
        businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
        nafDto: { code: "783Z", nomenclature: "Ref2" },
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
    sirenGateway.setRawEstablishment(validEstablishment);
    const response = await getSiret.execute({
      siret: validEstablishment.siret,
    });
    expectToEqual(response, {
      siret: "12345678901234",
      businessName: "MA P'TITE BOITE",
      businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
      nafDto: { code: "783Z", nomenclature: "Ref2" },
      isOpen: true,
    });
  });

  it("populates businessName from nom/prenom when denomination not available", async () => {
    sirenGateway.setRawEstablishment({
      ...validEstablishment,
      uniteLegale: {
        prenomUsuelUniteLegale: "ALAIN",
        nomUniteLegale: "PROST",
      },
    });
    const response = await getSiret.execute({
      siret: validEstablishment.siret,
    });
    expect(response.businessName).toBe("ALAIN PROST");
  });

  it("skips missing parts of adresseEtablissment", async () => {
    sirenGateway.setRawEstablishment({
      ...validEstablishment,
      adresseEtablissement: {
        // No numeroVoieEtablissement
        typeVoieEtablissement: "L'ESPLANADE",
        // No libelleVoieEtablissement
        codePostalEtablissement: "30430",
        libelleCommuneEtablissement: "BARJAC",
      },
    });
    const response = await getSiret.execute({
      siret: validEstablishment.siret,
    });
    expect(response.businessAddress).toBe("L'ESPLANADE 30430 BARJAC");
  });

  it("skips naf when not available", async () => {
    sirenGateway.setRawEstablishment({
      ...validEstablishment,
      uniteLegale: {
        denominationUniteLegale: "MA P'TITE BOITE",
        // no activitePrincipaleUniteLegale
        // no nomenclatureActivitePrincipaleUniteLegale
      },
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
    sirenGateway.setRawEstablishment({
      ...validEstablishment,
      periodesEtablissement: [
        {
          dateFin: null,
          dateDebut: "2022-01-01",
          etatAdministratifEtablissement: "F",
        },
      ],
    });
    const response = await getSiret.execute({
      siret: validEstablishment.siret,
    });
    expect(response).toMatchObject({ isOpen: false });
  });
});
