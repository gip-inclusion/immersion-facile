import { FormEstablishmentGateway } from "src/core-logic/ports/FormEstablishmentGateway";
import { FormEstablishmentDto } from "src/shared/FormEstablishmentDto";
import { RomeSearchMatchDto } from "src/shared/rome";
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

  public async searchProfession(
    searchText: string,
  ): Promise<RomeSearchMatchDto[]> {
    await sleep(700);
    if (searchText === "givemeanemptylistplease") return [];
    if (searchText === "givemeanerrorplease")
      throw new Error("418 I'm a teapot");
    return [
      {
        profession: {
          description:
            "Agent(e) chargé(e) protection, sauvegarde patrimoine naturel",
          romeCodeMetier: "A1204",
        },
        matchRanges: [{ startIndexInclusive: 9, endIndexExclusive: 13 }],
      },
      {
        profession: {
          description: "Boulanger",
          romeCodeMetier: "A1111",
        },
        matchRanges: [
          { startIndexInclusive: 0, endIndexExclusive: 3 },
          { startIndexInclusive: 5, endIndexExclusive: 8 },
        ],
      },
      {
        profession: {
          description: "Boucher",
          romeCodeMetier: "B2222",
        },
        matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 3 }],
      },
      {
        profession: {
          romeCodeMetier: "C3333",
          description: "Menuisier",
        },
        matchRanges: [],
      },
      {
        profession: {
          romeCodeMetier: "D4444",
          description: "Vendeur",
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
      professions: [
        {
          romeCodeAppellation: "11573",
          romeCodeMetier: "D1102",
          description: "Boulanger",
        },
        {
          description: "Boucher / Bouchère",
          romeCodeAppellation: "11564",
          romeCodeMetier: "D1101",
        },
      ],
      businessContacts: [
        {
          firstName: "John",
          lastName: "Doe",
          job: "super job",
          phone: "02837",
          email: "joe@mail.com",
        },
      ],
      preferredContactMethods: ["EMAIL"],
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
