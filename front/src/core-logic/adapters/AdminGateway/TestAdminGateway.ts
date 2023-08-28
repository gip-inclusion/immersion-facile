import { Observable, Subject } from "rxjs";
import {
  AbsoluteUrl,
  ApiConsumer,
  ApiConsumerJwt,
  BackOfficeJwt,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  IcUserRoleForAgencyParams,
  InclusionConnectedUser,
  NotificationsByKind,
  SetFeatureFlagParam,
} from "shared";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class TestAdminGateway implements AdminGateway {
  public dashboardUrl$ = new Subject<AbsoluteUrl>();

  public establishmentBatchResponse$ = new Subject<EstablishmentBatchReport>();

  public getAgencyUsersToReviewResponse$ = new Subject<
    InclusionConnectedUser[]
  >();

  public lastNotifications$ = new Subject<NotificationsByKind>();

  public setFeatureFlagLastCalledWith: SetFeatureFlagParam | undefined =
    undefined;

  public setFeatureFlagResponse$ = new Subject<void>();

  public token$ = new Subject<string>();

  public updateAgencyRoleForUserResponse$ = new Subject<undefined>();

  public updateFeatureFlags$ = (
    params: SetFeatureFlagParam,
    _adminToken: BackOfficeJwt,
  ) => {
    this.setFeatureFlagLastCalledWith = params;
    return this.setFeatureFlagResponse$;
  };

  public addEstablishmentBatch$(
    _establishmentBatch: FormEstablishmentBatchDto,
    _token: BackOfficeJwt,
  ): Observable<EstablishmentBatchReport> {
    return this.establishmentBatchResponse$;
  }

  public getDashboardUrl$(): Observable<AbsoluteUrl> {
    return this.dashboardUrl$;
  }

  public getInclusionConnectedUsersToReview$(): Observable<
    InclusionConnectedUser[]
  > {
    return this.getAgencyUsersToReviewResponse$;
  }

  public getLastNotifications$(
    _token: BackOfficeJwt,
  ): Observable<NotificationsByKind> {
    return this.lastNotifications$;
  }

  public login$(): Observable<BackOfficeJwt> {
    return this.token$;
  }

  public saveApiConsumer$(
    _apiConsumer: ApiConsumer,
  ): Observable<ApiConsumerJwt> {
    throw new Error("Method not implemented.");
  }

  public updateUserRoleForAgency$(
    _params: IcUserRoleForAgencyParams,
    _token: string,
  ): Observable<void> {
    return this.updateAgencyRoleForUserResponse$;
  }
}
