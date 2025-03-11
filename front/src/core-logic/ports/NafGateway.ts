import type { Observable } from "rxjs";
import type { NafSectionSuggestion } from "shared";

export interface NafGateway {
  getNafSuggestions$(searchText: string): Observable<NafSectionSuggestion[]>;
}
