import { Observable, of, Subject } from "rxjs";
import { EstablishmentJwt, FormEstablishmentDto, SiretDto } from "shared";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";

export class InMemoryEstablishmentGateway implements EstablishmentGateway {
  public addFormEstablishmentResult$ = new Subject<void>();

  public editFormEstablishmentResult$ = new Subject<void>();

  public establishmentModificationResponse$ = new Subject<void>();

  public formEstablishment$ = new Subject<FormEstablishmentDto>();

  private simulateBack = false;

  constructor(
    public _existingEstablishmentSirets: SiretDto[] = [],
    public _currentEstablishmentModifyRequest: SiretDto | undefined = undefined,
    simulateBack = false,
  ) {
    this.simulateBack = simulateBack;
  }

  public addFormEstablishment$(
    _formEstablishment: FormEstablishmentDto,
  ): Observable<void> {
    return this.addFormEstablishmentResult$;
  }

  public getFormEstablishmentFromJwt$(
    _siret: SiretDto,
    _jwt: EstablishmentJwt,
  ): Observable<FormEstablishmentDto> {
    return this.formEstablishment$;
  }

  public requestEstablishmentModification$(_siret: SiretDto): Observable<void> {
    return this.simulateBack
      ? of(undefined)
      : this.establishmentModificationResponse$;
  }

  public updateFormEstablishment$(
    _formEstablishment: FormEstablishmentDto,
    _jwt: EstablishmentJwt,
  ): Observable<void> {
    return this.editFormEstablishmentResult$;
  }
}
