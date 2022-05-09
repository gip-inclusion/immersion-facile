import { InMemorySireneGateway } from "../../../adapters/secondary/InMemorySireneGateway";
import { GetSiret } from "../../../domain/sirene/useCases/GetSiret";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { SireneEstablishmentVO } from "../../../domain/sirene/ports/SireneGateway";
import {
  NotFoundError,
  TooManyRequestApiError,
} from "../../../adapters/primary/helpers/httpErrors";

const validEstablishment = new SireneEstablishmentVO({
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
  let repository: InMemorySireneGateway;
  let getSiret: GetSiret;

  beforeEach(() => {
    repository = new InMemorySireneGateway();
    getSiret = new GetSiret(repository);
  });

  describe("checking for business being opened", () => {
    const closedEstablishment = new SireneEstablishmentVO({
      ...validEstablishment.props,
      siret: "11111111111111",
      uniteLegale: {
        etatAdministratifUniteLegale: "F",
      },
    });

    beforeEach(() => {
      repository.setEstablishment(validEstablishment);
      repository.setEstablishment(closedEstablishment);
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
    repository.setEstablishment(validEstablishment);
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
    repository.setEstablishment(
      new SireneEstablishmentVO({
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
    repository.setEstablishment(
      new SireneEstablishmentVO({
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
    repository.setEstablishment(
      new SireneEstablishmentVO({
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
    repository.setError({
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
    repository.setEstablishment(
      new SireneEstablishmentVO({
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
