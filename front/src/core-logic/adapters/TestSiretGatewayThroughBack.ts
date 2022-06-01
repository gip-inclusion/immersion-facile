import { Observable, Subject } from "rxjs";
import {
  GetSiretInfo,
  SiretGatewayThroughBack,
} from "src/core-logic/ports/SiretGatewayThroughBack";

export class TestSiretGatewayThroughBack implements SiretGatewayThroughBack {
  getSiretInfo(): Promise<GetSiretInfo> {
    throw new Error("Method not implemented. Should be deleted soon.");
  }

  getSiretInfoIfNotAlreadySaved(): Observable<GetSiretInfo> {
    this.getSiretInfoIfNotAlreadySavedCallCount++;
    return this.siretInfo$;
  }

  getSiretInfoObservable(): Observable<GetSiretInfo> {
    this.getSiretInfoObservableCallCount++;
    return this.siretInfo$;
  }

  public siretInfo$ = new Subject<GetSiretInfo>();
  public getSiretInfoObservableCallCount = 0;
  public getSiretInfoIfNotAlreadySavedCallCount = 0;
}
