import { expectToEqual } from "shared";
import { convertAdeEstablishmentToSirenEstablishmentDto } from "./AnnuaireDesEntreprisesSiretGateway";
import { AnnuaireDesEntreprisesSiretEstablishment } from "./AnnuaireDesEntreprisesSiretGateway.targets";

const validEstablishment: AnnuaireDesEntreprisesSiretEstablishment = {
  activite_principale: "78.3Z",
  matching_etablissements: [
    {
      nom_commercial: "MA P'TITE BOITE",
      siret: "12345678901234",
      adresse: "20 AVENUE DE SEGUR 75007 PARIS 7",
      etat_administratif: "A",
    },
  ],
  tranche_effectif_salarie: "1",
};

describe("convertAdeEstablishmentToSirenEstablishmentDto", () => {
  const closedEstablishment: AnnuaireDesEntreprisesSiretEstablishment = {
    ...validEstablishment,
    matching_etablissements: [
      {
        ...validEstablishment.matching_etablissements[0],
        etat_administratif: "F",
      },
    ],
  };

  it("marks an open establishment as open, regardless of the period count", async () => {
    const response = await convertAdeEstablishmentToSirenEstablishmentDto(
      closedEstablishment,
    );
    expectToEqual(response, {
      siret: "12345678901234",
      businessName: "MA P'TITE BOITE",
      businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
      nafDto: { code: "783Z", nomenclature: "NAFRev2" },
      isOpen: false,
      numberEmployeesRange: "1-2",
    });
  });

  it("returns the parsed info when siret found", async () => {
    const response = await convertAdeEstablishmentToSirenEstablishmentDto(
      validEstablishment,
    );
    expectToEqual(response, {
      siret: "12345678901234",
      businessName: "MA P'TITE BOITE",
      businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
      nafDto: { code: "783Z", nomenclature: "NAFRev2" },
      isOpen: true,
      numberEmployeesRange: "1-2",
    });
  });
});
