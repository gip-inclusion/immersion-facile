import { Observable, Subject } from "rxjs";
import { FormEstablishmentDto, InclusionConnectJwt, SiretDto } from "shared";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";

export class TestEstablishmentGateway implements EstablishmentGateway {
  public addFormEstablishmentResult$ = new Subject<void>();

  public deleteEstablishmentResult$ = new Subject<void>();

  public editFormEstablishmentResult$ = new Subject<void>();

  public formEstablishment$ = new Subject<FormEstablishmentDto>();

  public addFormEstablishment$(
    _formEstablishment: FormEstablishmentDto,
  ): Observable<void> {
    return this.addFormEstablishmentResult$;
  }

  public deleteEstablishment$(
    _siret: SiretDto,
    _jwt: InclusionConnectJwt,
  ): Observable<void> {
    return this.deleteEstablishmentResult$;
  }

  public getFormEstablishmentFromJwt$(
    _siret: SiretDto,
    _jwt: InclusionConnectJwt,
  ): Observable<FormEstablishmentDto> {
    return this.formEstablishment$;
  }

  public updateFormEstablishment$(
    _formEstablishment: FormEstablishmentDto,
    _jwt: InclusionConnectJwt,
  ): Observable<void> {
    return this.editFormEstablishmentResult$;
  }
}
