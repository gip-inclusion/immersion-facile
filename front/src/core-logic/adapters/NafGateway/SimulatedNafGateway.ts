import { delay, type Observable, of, Subject } from "rxjs";
import type { NafSectionSuggestion } from "shared";
import type { NafGateway } from "src/core-logic/ports/NafGateway";

export class SimulatedNafGateway implements NafGateway {
  public nafSuggestions$ = new Subject<NafSectionSuggestion[]>();

  constructor(private readonly simulatedLatency = 0) {}

  #simulatedResponse: NafSectionSuggestion[] = [
    {
      label: "Agriculture, sylviculture et pêche",
      nafCodes: ["1000A", "1000B"],
    },
    {
      label: "Industries extractives",
      nafCodes: ["1000C", "1000D"],
    },
    {
      label: "Industrie manufacturière",
      nafCodes: ["1000E", "1000F"],
    },
  ];

  getAllNafSections$(): Observable<NafSectionSuggestion[]> {
    return of(this.#simulatedResponse).pipe(delay(this.simulatedLatency));
  }
}
