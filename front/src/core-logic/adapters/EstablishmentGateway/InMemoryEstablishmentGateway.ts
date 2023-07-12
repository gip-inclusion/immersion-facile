import { Observable, of, Subject } from "rxjs";
import {
  defaultMaxContactsPerWeek,
  FormEstablishmentDto,
  SiretDto,
  sleep,
} from "shared";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";

export class InMemoryEstablishmentGateway implements EstablishmentGateway {
  private simulateBack = false;
  public constructor(
    public _existingEstablishmentSirets: SiretDto[] = [],
    public _currentEstablishmentModifyRequest: SiretDto | undefined = undefined,
    simulateBack = false,
  ) {
    this.simulateBack = simulateBack;
  }

  public formEstablishment$ = new Subject<FormEstablishmentDto>();
  public addFormEstablishmentResult$ = new Subject<void>();

  public async addFormEstablishment(
    formEstablishment: FormEstablishmentDto,
  ): Promise<void> {
    //eslint-disable-next-line no-console
    console.log("addFormEstablishment", formEstablishment);
    await sleep(2000);
    if (formEstablishment.businessName === "givemeanerrorplease")
      throw new Error("418 I'm a teapot");
  }

  public addFormEstablishment$(
    _formEstablishment: FormEstablishmentDto,
  ): Observable<void> {
    return this.addFormEstablishmentResult$;
  }

  public async requestEstablishmentModification(
    siret: SiretDto,
  ): Promise<void> {
    this._currentEstablishmentModifyRequest = siret;
  }

  public establishmentModificationResponse$ = new Subject<void>();

  public requestEstablishmentModification$(_siret: SiretDto): Observable<void> {
    return this.simulateBack
      ? of(undefined)
      : this.establishmentModificationResponse$;
  }
  public getFormEstablishmentFromJwt$(
    _jwt: string,
  ): Observable<FormEstablishmentDto> {
    return this.formEstablishment$;
  }
  public async getFormEstablishmentFromJwt(
    _siret: string,
    jwt: string,
  ): Promise<FormEstablishmentDto> {
    if (jwt === "renew")
      throw {
        response: {
          status: 403,
          data: {
            needsNewMagicLink: true,
          },
        },
      };
    return {
      siret: "12345678901234",
      source: "immersion-facile",
      businessName: `My business name, retrieved from jwt ${jwt}`,
      businessNameCustomized: `My business customized name, retrieved from jwt ${jwt}`,
      businessAddress: "5 Rue de la Huchette, 75005 Paris",
      isEngagedEnterprise: true,
      maxContactsPerWeek: defaultMaxContactsPerWeek,
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
        copyEmails: ["recrutement@boucherie.net"],
      },
      website: "www.boulanger-immerge.com",
      additionalInformation:
        "Si vous aimez les croissants et êtes à l'aise avec la monnaie, vous allez adorer !",
    };
  }
  public async updateFormEstablishment(
    formEstablishmentDto: FormEstablishmentDto,
  ): Promise<void> {
    //eslint-disable-next-line no-console
    console.log(
      "Would update form establishment with siret ",
      formEstablishmentDto.siret,
    );
    await sleep(1000);
    if (formEstablishmentDto.businessName === "givemeanerrorplease")
      throw new Error("418 I'm a teapot");
  }
}
