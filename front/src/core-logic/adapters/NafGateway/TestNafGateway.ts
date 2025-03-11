import { type Observable, Subject } from "rxjs";
import type { NafSectionSuggestion } from "shared";
import type { NafGateway } from "src/core-logic/ports/NafGateway";

export class TestNafGateway implements NafGateway {
  public nafSuggestions$ = new Subject<NafSectionSuggestion[]>();

  getNafSuggestions$(_searchTerm: string): Observable<NafSectionSuggestion[]> {
    return this.nafSuggestions$;
  }
}
