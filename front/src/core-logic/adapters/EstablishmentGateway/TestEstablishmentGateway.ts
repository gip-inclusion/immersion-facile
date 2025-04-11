import { type Observable, Subject } from "rxjs";
import type {
  ConnectedUserJwt,
  EstablishmentNameAndAdmins,
  FormEstablishmentDto,
  SiretDto,
} from "shared";
import type { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";

export class TestEstablishmentGateway implements EstablishmentGateway {
  public addFormEstablishmentResult$ = new Subject<void>();

  public deleteEstablishmentResult$ = new Subject<void>();

  public editFormEstablishmentResult$ = new Subject<void>();

  public formEstablishment$ = new Subject<FormEstablishmentDto>();

  public establishmentAdmins$ = new Subject<EstablishmentNameAndAdmins>();

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
    _jwt: ConnectedUserJwt,
  ): Observable<FormEstablishmentDto> {
    return this.formEstablishment$;
  }

  public getEstablishmentNameAndAdmins$(
    _siret: SiretDto,
    _jwt: ConnectedUserJwt,
  ): Observable<EstablishmentNameAndAdmins> {
    return this.establishmentAdmins$;
  }

  public updateFormEstablishment$(
    _formEstablishment: FormEstablishmentDto,
    _jwt: ConnectedUserJwt,
  ): Observable<void> {
    return this.editFormEstablishmentResult$;
  }
}
