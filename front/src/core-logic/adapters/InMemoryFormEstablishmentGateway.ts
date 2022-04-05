import { FormEstablishmentGateway } from "src/core-logic/ports/FormEstablishmentGateway";
import { FormEstablishmentDto } from "src/shared/formEstablishment/FormEstablishment.dto";
import { SiretDto } from "src/shared/siret";
import { sleep } from "src/shared/utils";

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
      isSearchable: true,
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
