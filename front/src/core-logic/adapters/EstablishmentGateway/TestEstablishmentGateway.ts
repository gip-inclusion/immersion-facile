import { type Observable, Subject } from "rxjs";
import type {
  ConnectedUserJwt,
  DataWithPagination,
  DiscussionInList,
  DiscussionReadDto,
  EstablishmentNameAndAdmins,
  ExchangeRead,
  FormEstablishmentDto,
  SiretDto,
  WithDiscussionStatusRejected,
} from "shared";
import type {
  FetchDiscussionListRequestedPayload,
  FetchDiscussionRequestedPayload,
  SendExchangeRequestedPayload,
} from "src/core-logic/domain/discussion/discussion.slice";
import type { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";

export class TestEstablishmentGateway implements EstablishmentGateway {
  public addFormEstablishmentResult$ = new Subject<void>();

  public deleteEstablishmentResult$ = new Subject<void>();

  public editFormEstablishmentResult$ = new Subject<void>();

  public formEstablishment$ = new Subject<FormEstablishmentDto>();

  public establishmentAdmins$ = new Subject<EstablishmentNameAndAdmins>();

  public discussions$ = new Subject<DataWithPagination<DiscussionInList>>();

  public discussion$ = new Subject<DiscussionReadDto | undefined>();

  public sendMessageResponse$ = new Subject<ExchangeRead>();

  public updateDiscussionStatusResponse$ = new Subject<void>();

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

  public getDiscussionById$(
    _payload: FetchDiscussionRequestedPayload,
  ): Observable<DiscussionReadDto | undefined> {
    return this.discussion$;
  }
  public getDiscussions$(
    _payload: FetchDiscussionListRequestedPayload,
  ): Observable<DataWithPagination<DiscussionInList>> {
    return this.discussions$;
  }

  public sendMessage$(
    _payload: SendExchangeRequestedPayload,
  ): Observable<ExchangeRead> {
    return this.sendMessageResponse$;
  }

  public updateDiscussionStatus$(
    _payload: {
      jwt: string;
      discussionId: string;
    } & WithDiscussionStatusRejected,
  ): Observable<void> {
    return this.updateDiscussionStatusResponse$;
  }
}
