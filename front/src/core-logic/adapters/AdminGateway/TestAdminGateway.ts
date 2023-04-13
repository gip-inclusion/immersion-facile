import { Observable, Subject } from "rxjs";
import {
  AbsoluteUrl,
  BackOfficeJwt,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
} from "shared";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class TestAdminGateway implements AdminGateway {
  login(): Observable<BackOfficeJwt> {
    return this.token$;
  }

  public getDashboardUrl$(): Observable<AbsoluteUrl> {
    return this.dashboardUrl$;
  }

  public addEstablishmentBatch$(
    _establishmentBatch: FormEstablishmentBatchDto,
    _token: BackOfficeJwt,
  ): Observable<EstablishmentBatchReport> {
    return this.establishmentBatchResponse$;
  }

  public token$ = new Subject<string>();
  public dashboardUrl$ = new Subject<AbsoluteUrl>();
  public establishmentBatchResponse$ = new Subject<EstablishmentBatchReport>();
}
