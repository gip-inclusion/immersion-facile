import {
  NotFoundError,
  TooManyRequestApiError,
} from "../../../adapters/primary/helpers/httpErrors";
import { GetSiret } from "./GetSiret";
import { SirenEstablishmentVO } from "../valueObjects/SirenEstablishmentVO";
import { InMemorySirenGateway } from "../../../adapters/secondary/sirene/InMemorySirenGateway";
import { expectPromiseToFailWithError } from "shared";

const validEstablishment = new SirenEstablishmentVO({
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
});

describe("GetSiret", () => {
  let sirenGateway: InMemorySirenGateway;
  let getSiret: GetSiret;

  beforeEach(() => {
    sirenGateway = new InMemorySirenGateway();
    getSiret = new GetSiret(sirenGateway);
  });

  describe("checking for business being opened", () => {
    const closedEstablishment = new SirenEstablishmentVO({
      ...validEstablishment.props,
      siret: "11111111111111",
      uniteLegale: {
        etatAdministratifUniteLegale: "F",
      },
    });

    beforeEach(() => {
      sirenGateway.setEstablishment(validEstablishment);
      sirenGateway.setEstablishment(closedEstablishment);
    });

    it("marks an open establishment as open, regardless of the period count", async () => {
      const response = await getSiret.execute({
        siret: validEstablishment.siret,
      });

      expect(response).toEqual({
        siret: "12345678901234",
        businessName: "MA P'TITE BOITE",
        businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
        naf: { code: "783Z", nomenclature: "Ref2" },
        isOpen: true,
      });
    });
  });

  it("throws NotFoundError where siret not found", async () => {
    await expectPromiseToFailWithError(
      getSiret.execute({ siret: "40440440440400" }),
      new NotFoundError("Did not find siret : 40440440440400"),
    );
  });

  it("returns the parsed info when siret found", async () => {
    sirenGateway.setEstablishment(validEstablishment);
    const response = await getSiret.execute({
      siret: validEstablishment.siret,
    });
    expect(response).toEqual({
      siret: "12345678901234",
      businessName: "MA P'TITE BOITE",
      businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
      naf: { code: "783Z", nomenclature: "Ref2" },
      isOpen: true,
    });
  });

  it("populates businessName from nom/prenom when denomination not available", async () => {
    sirenGateway.setEstablishment(
      new SirenEstablishmentVO({
        ...validEstablishment.props,
        uniteLegale: {
          prenomUsuelUniteLegale: "ALAIN",
          nomUniteLegale: "PROST",
        },
      }),
    );
    const response = await getSiret.execute({
      siret: validEstablishment.siret,
    });
    expect(response.businessName).toBe("ALAIN PROST");
  });

  it("skips missing parts of adresseEtablissment", async () => {
    sirenGateway.setEstablishment(
      new SirenEstablishmentVO({
        ...validEstablishment.props,
        adresseEtablissement: {
          // No numeroVoieEtablissement
          typeVoieEtablissement: "L'ESPLANADE",
          // No libelleVoieEtablissement
          codePostalEtablissement: "30430",
          libelleCommuneEtablissement: "BARJAC",
        },
      }),
    );
    const response = await getSiret.execute({
      siret: validEstablishment.siret,
    });
    expect(response.businessAddress).toBe("L'ESPLANADE 30430 BARJAC");
  });

  it("skips naf when not available", async () => {
    sirenGateway.setEstablishment(
      new SirenEstablishmentVO({
        ...validEstablishment.props,
        uniteLegale: {
          denominationUniteLegale: "MA P'TITE BOITE",
          // no activitePrincipaleUniteLegale
          // no nomenclatureActivitePrincipaleUniteLegale
        },
      }),
    );
    const response = await getSiret.execute({
      siret: validEstablishment.siret,
    });
    expect(response.naf).toBeUndefined();
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
    sirenGateway.setEstablishment(
      new SirenEstablishmentVO({
        ...validEstablishment.props,
        periodesEtablissement: [
          {
            dateFin: null,
            dateDebut: "2022-01-01",
            etatAdministratifEtablissement: "F",
          },
        ],
      }),
    );
    const response = await getSiret.execute({
      siret: validEstablishment.siret,
    });
    expect(response).toMatchObject({ isOpen: false });
  });
});
