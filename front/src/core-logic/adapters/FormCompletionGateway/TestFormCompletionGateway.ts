import { BehaviorSubject, type Observable, Subject, delay, of } from "rxjs";
import {
  type AppellationMatchDto,
  type GetSiretInfo,
  type RomeDto,
  sleep,
} from "shared";
import type { FormCompletionGateway } from "src/core-logic/ports/FormCompletionGateway";

export class TestFormCompletionGateway implements FormCompletionGateway {
  public getSiretInfoCallCount = 0;

  public getSiretInfoIfNotAlreadySavedCallCount = 0;

  public isSiretInDb$ = new Subject<boolean>();

  public siretInfo$ = new Subject<GetSiretInfo>();

  readonly #romeDtos$: Subject<RomeDto[]>;

  constructor(
    private readonly simulatedLatency = 0,
    seedRomeDtos?: RomeDto[],
  ) {
    this.#romeDtos$ = seedRomeDtos
      ? new BehaviorSubject(seedRomeDtos)
      : new Subject<RomeDto[]>();
  }

  public async getAppellationDtoMatching(
    searchText: string,
  ): Promise<AppellationMatchDto[]> {
    await sleep(700);
    if (searchText === "givemeanemptylistplease") return [];
    if (searchText === "givemeanerrorplease")
      throw new Error("418 I'm a teapot");
    return [
      {
        appellation: {
          appellationLabel:
            "Agent(e) chargé(e) protection, sauvegarde patrimoine naturel",
          romeCode: "A1204",
          romeLabel: "Agent",
          appellationCode: "11204",
        },
        matchRanges: [{ startIndexInclusive: 9, endIndexExclusive: 13 }],
      },
      {
        appellation: {
          romeCode: "A1111",
          appellationCode: "11111",
          romeLabel: "Boulangerie",
          appellationLabel: "Boulanger - boulangère",
        },
        matchRanges: [
          { startIndexInclusive: 0, endIndexExclusive: 3 },
          { startIndexInclusive: 5, endIndexExclusive: 8 },
        ],
      },
      {
        appellation: {
          romeCode: "B2222",
          appellationCode: "22222",
          romeLabel: "Boucherie",
          appellationLabel: "Boucher - Bouchère",
        },
        matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 3 }],
      },
      {
        appellation: {
          romeCode: "C3333",
          appellationCode: "33333",
          romeLabel: "Menuiserie",
          appellationLabel: "Menuisier - Menuisière",
        },
        matchRanges: [],
      },
      {
        appellation: {
          romeCode: "D4444",
          appellationCode: "44444",
          romeLabel: "Vente",
          appellationLabel: "Veudeuse - Veudeur",
        },
        matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 7 }],
      },
    ];
  }

  public getRomeDtoMatching(searchText: string): Observable<RomeDto[]> {
    if (searchText === "givemeanemptylistplease") return of([]);
    if (searchText === "givemeanerrorplease")
      throw new Error("418 I'm a teapot");

    return this.simulatedLatency
      ? this.#romeDtos$.pipe(delay(this.simulatedLatency))
      : this.#romeDtos$;
  }

  public getSiretInfo(): Observable<GetSiretInfo> {
    this.getSiretInfoCallCount++;
    return this.siretInfo$;
  }

  public getSiretInfoIfNotAlreadySaved(): Observable<GetSiretInfo> {
    this.getSiretInfoIfNotAlreadySavedCallCount++;
    return this.siretInfo$;
  }

  public isSiretAlreadySaved(): Observable<boolean> {
    return this.isSiretInDb$;
  }

  // for test purpose
  public get romeDtos$() {
    return this.#romeDtos$;
  }
}

export const seedRomeDtos: RomeDto[] = [
  {
    romeCode: "C1504",
    romeLabel: "Transaction immobilière",
  },
  {
    romeCode: "D1102",
    romeLabel: "Boulangerie - viennoiserie",
  },
  {
    romeCode: "D1101",
    romeLabel: "Boucherie",
  },
  {
    romeCode: "D1105",
    romeLabel: "Poissonneriee",
  },
];
