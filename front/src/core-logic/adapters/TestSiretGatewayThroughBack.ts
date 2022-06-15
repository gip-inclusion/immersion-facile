import { Observable, Subject } from "rxjs";
import {
  GetSiretInfo,
  SiretGatewayThroughBack,
} from "src/core-logic/ports/SiretGatewayThroughBack";

export class TestSiretGatewayThroughBack implements SiretGatewayThroughBack {
  isSiretAlreadyInSaved(): Observable<boolean> {
    return this.isSiretInDb$;
  }

  getSiretInfoIfNotAlreadySaved(): Observable<GetSiretInfo> {
    this.getSiretInfoIfNotAlreadySavedCallCount++;
    return this.siretInfo$;
  }

  getSiretInfo(): Observable<GetSiretInfo> {
    this.getSiretInfoObservableCallCount++;
    return this.siretInfo$;
  }

  public isSiretInDb$ = new Subject<boolean>();
  public siretInfo$ = new Subject<GetSiretInfo>();
  public getSiretInfoObservableCallCount = 0;
  public getSiretInfoIfNotAlreadySavedCallCount = 0;
}
