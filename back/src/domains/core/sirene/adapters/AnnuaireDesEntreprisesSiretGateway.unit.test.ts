import { expectToEqual } from "shared";
import { convertAdeEstablishmentToSirenEstablishmentDto } from "./AnnuaireDesEntreprisesSiretGateway";
import type { AnnuaireDesEntreprisesSiretEstablishment } from "./AnnuaireDesEntreprisesSiretGateway.routes";

const validEstablishment: AnnuaireDesEntreprisesSiretEstablishment = {
  activite_principale: "78.3Z",
  nom_complet: "MA P'TITE BOITE - nom complet",
  matching_etablissements: [
    {
      nom_commercial: "MA P'TITE BOITE",
      siret: "12345678901234",
      adresse: "20 AVENUE DE SEGUR 75007 PARIS 7",
      etat_administratif: "A",
    },
  ],
  tranche_effectif_salarie: "01",
  siege: {
    activite_principale: "78.3Z",
  },
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
    const response =
      await convertAdeEstablishmentToSirenEstablishmentDto(closedEstablishment);
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
    const response =
      await convertAdeEstablishmentToSirenEstablishmentDto(validEstablishment);
    expectToEqual(response, {
      siret: "12345678901234",
      businessName: "MA P'TITE BOITE",
      businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
      nafDto: { code: "783Z", nomenclature: "NAFRev2" },
      isOpen: true,
      numberEmployeesRange: "1-2",
    });
  });

  it("falls back to nom_complet if response does not contain nom_commercial", async () => {
    const response = await convertAdeEstablishmentToSirenEstablishmentDto({
      ...validEstablishment,
      matching_etablissements: [
        {
          ...validEstablishment.matching_etablissements[0],
          nom_commercial: null,
        },
      ],
    });

    expectToEqual(response, {
      siret: "12345678901234",
      businessName: validEstablishment.nom_complet,
      businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
      nafDto: { code: "783Z", nomenclature: "NAFRev2" },
      isOpen: true,
      numberEmployeesRange: "1-2",
    });
  });

  it("falls back to nom_complet if response contains an empty nom_commercial", async () => {
    const response = await convertAdeEstablishmentToSirenEstablishmentDto({
      ...validEstablishment,
      matching_etablissements: [
        {
          ...validEstablishment.matching_etablissements[0],
          nom_commercial: " ",
        },
      ],
    });

    expectToEqual(response, {
      siret: "12345678901234",
      businessName: validEstablishment.nom_complet,
      businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
      nafDto: { code: "783Z", nomenclature: "NAFRev2" },
      isOpen: true,
      numberEmployeesRange: "1-2",
    });
  });
});
