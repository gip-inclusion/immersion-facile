import { Observable, Subject } from "rxjs";
import {
  AbsoluteUrl,
  BackOfficeJwt,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  IcUserRoleForAgencyParams,
  InclusionConnectedUser,
  NotificationsByKind,
} from "shared";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class TestAdminGateway implements AdminGateway {
  public dashboardUrl$ = new Subject<AbsoluteUrl>();

  public establishmentBatchResponse$ = new Subject<EstablishmentBatchReport>();

  public getAgencyUsersToReviewResponse$ = new Subject<
    InclusionConnectedUser[]
  >();

  public lastNotifications$ = new Subject<NotificationsByKind>();

  public token$ = new Subject<string>();

  public updateAgencyRoleForUserResponse$ = new Subject<undefined>();

  public addEstablishmentBatch$(
    _establishmentBatch: FormEstablishmentBatchDto,
    _token: BackOfficeJwt,
  ): Observable<EstablishmentBatchReport> {
    return this.establishmentBatchResponse$;
  }

  public getDashboardUrl$(): Observable<AbsoluteUrl> {
    return this.dashboardUrl$;
  }

  getInclusionConnectedUsersToReview$(): Observable<InclusionConnectedUser[]> {
    return this.getAgencyUsersToReviewResponse$;
  }

  getLastNotifications(_token: BackOfficeJwt): Observable<NotificationsByKind> {
    return this.lastNotifications$;
  }

  login(): Observable<BackOfficeJwt> {
    return this.token$;
  }

  updateUserRoleForAgency$(
    _params: IcUserRoleForAgencyParams,
    _token: string,
  ): Observable<void> {
    return this.updateAgencyRoleForUserResponse$;
  }
}
