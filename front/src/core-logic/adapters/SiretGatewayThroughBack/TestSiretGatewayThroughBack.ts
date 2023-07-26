import { Observable, Subject } from "rxjs";
import { GetSiretInfo } from "shared";
import { SiretGatewayThroughBack } from "src/core-logic/ports/SiretGatewayThroughBack";

export class TestSiretGatewayThroughBack implements SiretGatewayThroughBack {
  public getSiretInfoCallCount = 0;

  public getSiretInfoIfNotAlreadySavedCallCount = 0;

  public isSiretInDb$ = new Subject<boolean>();

  public siretInfo$ = new Subject<GetSiretInfo>();

  getSiretInfo(): Observable<GetSiretInfo> {
    this.getSiretInfoCallCount++;
    return this.siretInfo$;
  }

  getSiretInfoIfNotAlreadySaved(): Observable<GetSiretInfo> {
    this.getSiretInfoIfNotAlreadySavedCallCount++;
    return this.siretInfo$;
  }

  isSiretAlreadySaved(): Observable<boolean> {
    return this.isSiretInDb$;
  }
}
