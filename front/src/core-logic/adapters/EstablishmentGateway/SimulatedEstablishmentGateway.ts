import { delay, type Observable, of } from "rxjs";
import {
  type ConnectedUserJwt,
  type DataWithPagination,
  DiscussionBuilder,
  type DiscussionInList,
  type DiscussionReadDto,
  type EstablishmentNameAndAdmins,
  type Exchange,
  type FormEstablishmentDto,
  type SiretDto,
  type WithDiscussionStatusRejected,
} from "shared";
import {
  type FetchDiscussionListRequestedPayload,
  type FetchDiscussionRequestedPayload,
  initialDiscussionsWithPagination,
  type SendExchangeRequestedPayload,
} from "src/core-logic/domain/discussion/discussion.slice";
import type { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";

export class SimulatedEstablishmentGateway implements EstablishmentGateway {
  constructor(
    private establishments: FormEstablishmentDto[],
    private delay = 250,
  ) {}

  getEstablishmentNameAndAdmins$(
    siret: SiretDto,
    _jwt: ConnectedUserJwt,
  ): Observable<EstablishmentNameAndAdmins> {
    const establishment = this.establishments.find(
      (establishment) => establishment.siret === siret,
    );
    if (establishment)
      return of({
        name:
          establishment.businessNameCustomized || establishment.businessName,
        adminEmails: establishment.userRights
          .filter((right) => right.role === "establishment-admin")
          .map(({ email }) => email),
      }).pipe(delay(this.delay));
    throw new Error(`Establishment with siret ${siret} not found.`);
  }

  public addFormEstablishment$(
    establishment: FormEstablishmentDto,
  ): Observable<void> {
    this.establishments.push(establishment);
    return of(undefined).pipe(delay(this.delay));
  }

  public deleteEstablishment$(
    siret: SiretDto,
    _jwt: ConnectedUserJwt,
  ): Observable<void> {
    this.establishments = this.establishments.filter(
      (establishment) => establishment.siret !== siret,
    );
    return of(undefined).pipe(delay(this.delay));
  }

  public getFormEstablishmentFromJwt$(
    siret: SiretDto,
    _jwt: ConnectedUserJwt,
  ): Observable<FormEstablishmentDto> {
    const establishment = this.establishments.find(
      (establishment) => establishment.siret === siret,
    );
    if (establishment) return of(establishment).pipe(delay(this.delay));
    throw new Error(`Establishment with siret ${siret} not found.`);
  }

  public updateFormEstablishment$(
    establishment: FormEstablishmentDto,
    _jwt: ConnectedUserJwt,
  ): Observable<void> {
    this.establishments.map((currentEstablishment) =>
      establishment.siret === currentEstablishment.siret
        ? establishment
        : currentEstablishment,
    );
    return of(undefined).pipe(delay(this.delay));
  }

  getDiscussionById$(
    _payload: FetchDiscussionRequestedPayload,
  ): Observable<DiscussionReadDto | undefined> {
    return of(new DiscussionBuilder().buildRead()).pipe(delay(this.delay));
  }

  public updateDiscussionStatus$(
    _payload: {
      jwt: string;
      discussionId: string;
    } & WithDiscussionStatusRejected,
  ): Observable<void> {
    return of(undefined).pipe(delay(this.delay));
  }

  public sendMessage$(
    _payload: SendExchangeRequestedPayload,
  ): Observable<Exchange> {
    return of({
      subject: "Réponse de My businessName à votre demande",
      message: "My message",
      sentAt: new Date().toISOString(),
      sender: "establishment",
      recipient: "potentialBeneficiary",
      attachments: [],
    } satisfies Exchange).pipe(delay(this.delay));
  }

  public getDiscussions$(
    _payload: FetchDiscussionListRequestedPayload,
  ): Observable<DataWithPagination<DiscussionInList>> {
    return of(initialDiscussionsWithPagination).pipe(delay(this.delay));
  }
}
