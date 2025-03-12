import { type Observable, Subject } from "rxjs";
import type {
  ConnectedUserJwt,
  EstablishmentJwt,
  FormEstablishmentDto,
  SiretDto,
} from "shared";
import type { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";

export class TestEstablishmentGateway implements EstablishmentGateway {
  public addFormEstablishmentResult$ = new Subject<void>();

  public deleteEstablishmentResult$ = new Subject<void>();

  public editFormEstablishmentResult$ = new Subject<void>();

  public establishmentModificationResponse$ = new Subject<void>();

  public formEstablishment$ = new Subject<FormEstablishmentDto>();

  public addFormEstablishment$(
    _formEstablishment: FormEstablishmentDto,
  ): Observable<void> {
    return this.addFormEstablishmentResult$;
  }

  public deleteEstablishment$(
    _siret: SiretDto,
    _jwt: ConnectedUserJwt,
  ): Observable<void> {
    return this.deleteEstablishmentResult$;
  }

  public getFormEstablishmentFromJwt$(
    _siret: SiretDto,
    _jwt: EstablishmentJwt,
  ): Observable<FormEstablishmentDto> {
    return this.formEstablishment$;
  }

  public requestEstablishmentModification$(_siret: SiretDto): Observable<void> {
    return this.establishmentModificationResponse$;
  }

  public updateFormEstablishment$(
    _formEstablishment: FormEstablishmentDto,
    _jwt: EstablishmentJwt | ConnectedUserJwt,
  ): Observable<void> {
    return this.editFormEstablishmentResult$;
  }
}
