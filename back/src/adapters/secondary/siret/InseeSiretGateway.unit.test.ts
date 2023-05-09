import { expectToEqual } from "shared";
import {
  convertSirenRawEstablishmentToSirenEstablishmentDto,
  SirenApiRawEstablishment,
} from "./InseeSiretGateway";

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

describe("convertSirenRawEstablishmentToSirenEstablishmentDto", () => {
  const closedEstablishment: SirenApiRawEstablishment = {
    ...validEstablishment,
    uniteLegale: {
      ...validEstablishment.uniteLegale,
      etatAdministratifUniteLegale: "F",
    },
  };

  it("marks an open establishment as open, regardless of the period count", async () => {
    const response = await convertSirenRawEstablishmentToSirenEstablishmentDto(
      closedEstablishment,
    );

    expectToEqual(response, {
      siret: "12345678901234",
      businessName: "MA P'TITE BOITE",
      businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
      nafDto: { code: "783Z", nomenclature: "Ref2" },
      isOpen: false,
      numberEmployeesRange: "",
    });
  });

  it("returns the parsed info when siret found", async () => {
    const response = await convertSirenRawEstablishmentToSirenEstablishmentDto(
      validEstablishment,
    );
    expectToEqual(response, {
      siret: "12345678901234",
      businessName: "MA P'TITE BOITE",
      businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
      nafDto: { code: "783Z", nomenclature: "Ref2" },
      isOpen: true,
      numberEmployeesRange: "",
    });
  });

  it("populates businessName from nom/prenom when denomination not available", async () => {
    const response = await convertSirenRawEstablishmentToSirenEstablishmentDto({
      ...validEstablishment,
      uniteLegale: {
        prenomUsuelUniteLegale: "ALAIN",
        nomUniteLegale: "PROST",
      },
    });
    expect(response.businessName).toBe("ALAIN PROST");
  });

  it("skips missing parts of adresseEtablissment", async () => {
    const response = await convertSirenRawEstablishmentToSirenEstablishmentDto({
      ...validEstablishment,
      adresseEtablissement: {
        // No numeroVoieEtablissement
        typeVoieEtablissement: "L'ESPLANADE",
        // No libelleVoieEtablissement
        codePostalEtablissement: "30430",
        libelleCommuneEtablissement: "BARJAC",
      },
    });
    expect(response.businessAddress).toBe("L'ESPLANADE 30430 BARJAC");
  });

  it("skips naf when not available", async () => {
    const response = await convertSirenRawEstablishmentToSirenEstablishmentDto({
      ...validEstablishment,
      uniteLegale: {
        denominationUniteLegale: "MA P'TITE BOITE",
        // no activitePrincipaleUniteLegale
        // no nomenclatureActivitePrincipaleUniteLegale
      },
    });
    expect(response.nafDto).toBeUndefined();
  });

  it("returns establishment as not Open if it is not at the current period", async () => {
    const response = await convertSirenRawEstablishmentToSirenEstablishmentDto({
      ...validEstablishment,
      periodesEtablissement: [
        {
          dateFin: null,
          dateDebut: "2022-01-01",
          etatAdministratifEtablissement: "F",
        },
      ],
    });
    expect(response).toMatchObject({ isOpen: false });
  });
});
