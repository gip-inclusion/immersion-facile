import { Observable, Subject } from "rxjs";
import {
  ApiConsumer,
  ApiConsumerJwt,
  BackOfficeJwt,
  DashboardUrlAndName,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  IcUserRoleForAgencyParams,
  InclusionConnectedUser,
  NotificationsByKind,
  RejectIcUserRoleForAgencyParams,
  SetFeatureFlagParam,
} from "shared";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class TestAdminGateway implements AdminGateway {
  public apiConsumers$ = new Subject<ApiConsumer[]>();

  public dashboardUrl$ = new Subject<DashboardUrlAndName>();

  public establishmentBatchResponse$ = new Subject<EstablishmentBatchReport>();

  public getAgencyUsersToReviewResponse$ = new Subject<
    InclusionConnectedUser[]
  >();

  public getAllApiConsumers$ = (_adminToken: BackOfficeJwt) =>
    this.apiConsumers$;

  public lastNotifications$ = new Subject<NotificationsByKind>();

  public rejectUserToAgencyResponse$ = new Subject<void>();

  public saveApiConsumersResponse$ = new Subject<ApiConsumerJwt>();

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

  public getDashboardUrl$(): Observable<DashboardUrlAndName> {
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

  public rejectUserForAgency$(
    _params: RejectIcUserRoleForAgencyParams,
    _token: string,
  ): Observable<void> {
    return this.rejectUserToAgencyResponse$;
  }

  public saveApiConsumer$(
    _apiConsumer: ApiConsumer,
    _adminToken: BackOfficeJwt,
  ): Observable<ApiConsumerJwt> {
    return this.saveApiConsumersResponse$;
  }

  public updateUserRoleForAgency$(
    _params: IcUserRoleForAgencyParams,
    _token: string,
  ): Observable<void> {
    return this.updateAgencyRoleForUserResponse$;
  }
}
