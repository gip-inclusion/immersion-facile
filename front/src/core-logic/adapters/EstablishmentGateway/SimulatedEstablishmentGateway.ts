import { delay, Observable, of } from "rxjs";
import {
  BackOfficeJwt,
  EstablishmentJwt,
  FormEstablishmentDto,
  SiretDto,
} from "shared";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";

export class SimulatedEstablishmentGateway implements EstablishmentGateway {
  constructor(
    private establishments: FormEstablishmentDto[],
    private delay: number = 250,
  ) {}

  public addFormEstablishment$(
    establishment: FormEstablishmentDto,
  ): Observable<void> {
    this.establishments.push(establishment);
    return of(undefined).pipe(delay(this.delay));
  }

  public deleteEstablishment$(
    siret: SiretDto,
    _jwt: BackOfficeJwt,
  ): Observable<void> {
    this.establishments = this.establishments.filter(
      (establishment) => establishment.siret !== siret,
    );
    return of(undefined).pipe(delay(this.delay));
  }

  public getFormEstablishmentFromJwt$(
    siret: SiretDto,
    _jwt: BackOfficeJwt | EstablishmentJwt,
  ): Observable<FormEstablishmentDto> {
    const establishment = this.establishments.find(
      (establishment) => establishment.siret === siret,
    );
    if (establishment) return of(establishment).pipe(delay(this.delay));
    throw new Error(`Establishment with siret ${siret} not found.`);
  }

  public requestEstablishmentModification$(_siret: SiretDto): Observable<void> {
    throw new Error("Method not implemented.");
  }

  public updateFormEstablishment$(
    establishment: FormEstablishmentDto,
    _jwt: EstablishmentJwt,
  ): Observable<void> {
    this.establishments.map((currentEstablishment) =>
      establishment.siret === currentEstablishment.siret
        ? establishment
        : currentEstablishment,
    );
    return of(undefined).pipe(delay(this.delay));
  }
}
