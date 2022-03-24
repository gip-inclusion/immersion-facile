import { FormEstablishmentGateway } from "src/core-logic/ports/FormEstablishmentGateway";
import { FormEstablishmentDto } from "src/shared/formEstablishment/FormEstablishment.dto";
import { AppellationMatchDto } from "src/shared/romeAndAppellationDtos/romeAndAppellation.dto";
import { SiretDto } from "src/shared/siret";
import { sleep } from "src/shared/utils";
import { v4 as uuidV4 } from "uuid";

export class InMemoryFormEstablishmentGateway
  implements FormEstablishmentGateway
{
  private _existingEstablishmentSirets: SiretDto[] = [];

  public constructor(existingEstablishmentSirets: SiretDto[] = []) {
    this._existingEstablishmentSirets = existingEstablishmentSirets;
  }
  public async addFormEstablishment(
    immersionOffer: FormEstablishmentDto,
  ): Promise<SiretDto> {
    console.log(immersionOffer);
    await sleep(2000);
    if (immersionOffer.businessName === "givemeanerrorplease")
      throw new Error("418 I'm a teapot");
    return immersionOffer.siret;
  }

  public async searchAppellation(
    searchText: string,
  ): Promise<AppellationMatchDto[]> {
    await sleep(700);
    if (searchText === "givemeanemptylistplease") return [];
    if (searchText === "givemeanerrorplease")
      throw new Error("418 I'm a teapot");
    return [
      {
        appellation: {
          appellationLabel:
            "Agent(e) chargé(e) protection, sauvegarde patrimoine naturel",
          romeCode: "A1204",
          romeLabel: "Agent",
          appellationCode: "11204",
        },
        matchRanges: [{ startIndexInclusive: 9, endIndexExclusive: 13 }],
      },
      {
        appellation: {
          romeCode: "A1111",
          appellationCode: "11111",
          romeLabel: "Boulangerie",
          appellationLabel: "Boulanger - boulangère",
        },
        matchRanges: [
          { startIndexInclusive: 0, endIndexExclusive: 3 },
          { startIndexInclusive: 5, endIndexExclusive: 8 },
        ],
      },
      {
        appellation: {
          romeCode: "B2222",
          appellationCode: "22222",
          romeLabel: "Boucherie",
          appellationLabel: "Boucher - Bouchère",
        },
        matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 3 }],
      },
      {
        appellation: {
          romeCode: "C3333",
          appellationCode: "33333",
          romeLabel: "Menuiserie",
          appellationLabel: "Menuisier - Menuisière",
        },
        matchRanges: [],
      },
      {
        appellation: {
          romeCode: "D4444",
          appellationCode: "44444",
          romeLabel: "Vente",
          appellationLabel: "Veudeuse - Veudeur",
        },
        matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 7 }],
      },
    ];
  }
  public async getSiretAlreadyExists(siret: SiretDto): Promise<boolean> {
    return this._existingEstablishmentSirets.includes(siret);
  }

  public async requestEmailToEditForm(siret: SiretDto): Promise<void> {
    return;
  }
  public async getFormEstablishmentFromJwt(
    jwt: string,
  ): Promise<FormEstablishmentDto> {
    return {
      siret: "12345678901234",
      source: "immersion-facile",
      businessName: `My business name, retrieved from jwt ${jwt}`,
      businessNameCustomized: `My business customized name, retrieved from jwt ${jwt}`,
      businessAddress: "5 Rue de la Huchette 75005 Paris",
      isEngagedEnterprise: true,
      appellations: [
        {
          appellationCode: "11573",
          romeCode: "D1102",
          romeLabel: "Boulanger",
          appellationLabel: "Boulangerie - viennoiserie",
        },
        {
          appellationCode: "11564",
          romeCode: "D1101",
          romeLabel: "Boucherie",
          appellationLabel: "Boucher / Bouchère",
        },
      ],
      businessContact: {
        firstName: "John",
        lastName: "Doe",
        job: "super job",
        phone: "02837",
        email: "joe@mail.com",
        contactMethod: "EMAIL",
      },
    };
  }
  public async updateFormEstablishment(
    formEstablishmentDto: FormEstablishmentDto,
  ): Promise<void> {
    console.log(
      "Would update form establishment with siret ",
      formEstablishmentDto.siret,
    );
    await sleep(1000);
    if (formEstablishmentDto.businessName === "givemeanerrorplease")
      throw new Error("418 I'm a teapot");
  }
}
