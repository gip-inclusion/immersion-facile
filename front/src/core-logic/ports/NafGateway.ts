import type { Observable } from "rxjs";
import type { NafSectionSuggestion } from "shared";

export interface NafGateway {
  getAllNafSections$(): Observable<NafSectionSuggestion[]>;
}
