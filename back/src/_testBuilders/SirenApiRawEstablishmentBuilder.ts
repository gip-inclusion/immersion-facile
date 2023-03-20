import { Builder, NafDto } from "shared";
import { SirenApiRawEstablishment } from "../domain/sirene/ports/SirenGateway";

const validSireneEstablishmentProps: SirenApiRawEstablishment = {
  siret: "20006765000016",
  uniteLegale: {
    denominationUniteLegale: "MA P'TITE BOITE 2",
    activitePrincipaleUniteLegale: "85.59A",
    nomenclatureActivitePrincipaleUniteLegale: "Ref2",
    trancheEffectifsUniteLegale: "01",
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

export class SirenApiRawEstablishmentBuilder
  implements Builder<SirenApiRawEstablishment>
{
  public constructor(
    private sirenApiEstablishment: SirenApiRawEstablishment = validSireneEstablishmentProps,
  ) {}

  public withSiret(siret: string): SirenApiRawEstablishmentBuilder {
    return new SirenApiRawEstablishmentBuilder({
      ...this.sirenApiEstablishment,
      siret,
    });
  }

  public withBusinessName(
    businessName: string,
  ): SirenApiRawEstablishmentBuilder {
    return new SirenApiRawEstablishmentBuilder({
      ...this.sirenApiEstablishment,
      uniteLegale: {
        ...this.sirenApiEstablishment.uniteLegale,
        denominationUniteLegale: businessName,
      },
    });
  }

  public withIsActive(isActive: boolean): SirenApiRawEstablishmentBuilder {
    return new SirenApiRawEstablishmentBuilder({
      ...this.sirenApiEstablishment,
      uniteLegale: {
        ...this.sirenApiEstablishment.uniteLegale,
        etatAdministratifUniteLegale: isActive ? "A" : "F",
      },
    });
  }

  public withNafDto(nafDto: NafDto) {
    return new SirenApiRawEstablishmentBuilder({
      ...this.sirenApiEstablishment,
      uniteLegale: {
        ...this.sirenApiEstablishment.uniteLegale,
        activitePrincipaleUniteLegale: nafDto.code,
        nomenclatureActivitePrincipaleUniteLegale: nafDto.nomenclature,
      },
    });
  }

  public withUniteLegale(
    uniteLegale: SirenApiRawEstablishment["uniteLegale"],
  ): SirenApiRawEstablishmentBuilder {
    return new SirenApiRawEstablishmentBuilder({
      ...this.sirenApiEstablishment,
      uniteLegale,
    });
  }
  public withAdresseEtablissement(
    adresseEtablissement: SirenApiRawEstablishment["adresseEtablissement"],
  ): SirenApiRawEstablishmentBuilder {
    return new SirenApiRawEstablishmentBuilder({
      ...this.sirenApiEstablishment,
      adresseEtablissement,
    });
  }
  build(): SirenApiRawEstablishment {
    return this.sirenApiEstablishment;
  }
}
