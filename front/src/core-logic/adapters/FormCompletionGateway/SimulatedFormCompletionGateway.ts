import { BehaviorSubject, Observable, Subject, delay, of } from "rxjs";
import {
  AppellationMatchDto,
  GetSiretInfo,
  RomeDto,
  SiretDto,
  SiretEstablishmentDto,
  apiSirenNotAvailableSiret,
  apiSirenUnexpectedError,
  conflictErrorSiret,
  siretApiMissingEstablishmentMessage,
  siretApiUnavailableSiretErrorMessage,
  siretApiUnexpectedErrorErrorMessage,
  siretSchema,
  sleep,
  tooManiSirenRequestsSiretErrorMessage,
  tooManySirenRequestsSiret,
} from "shared";
import { FormCompletionGateway } from "../../ports/FormCompletionGateway";

export class SimulatedFormCompletionGateway implements FormCompletionGateway {
  readonly #romeDtos$: Subject<RomeDto[]>;

  constructor(
    private readonly simulatedLatency = 0,
    public sireneEstablishments: {
      [siret: SiretDto]: SiretEstablishmentDto;
    } = {},
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

  public getSiretInfo(siret: SiretDto): Observable<GetSiretInfo> {
    const response$ = of(this.#simulatedResponse(siret));
    return this.simulatedLatency
      ? response$.pipe(delay(this.simulatedLatency))
      : response$;
  }

  public getSiretInfoIfNotAlreadySaved(
    siret: SiretDto,
  ): Observable<GetSiretInfo> {
    return this.getSiretInfo(siret);
  }

  public isSiretAlreadySaved(siret: SiretDto): Observable<boolean> {
    const response = this.#simulatedResponse(siret);
    const response$ = of(
      response === "Establishment with this siret is already in our DB",
    );
    return this.simulatedLatency
      ? response$.pipe(delay(this.simulatedLatency))
      : response$;
  }

  // for test purpose
  public get romeDtos$() {
    return this.#romeDtos$;
  }

  #simulatedResponse(rawSiret: SiretDto): GetSiretInfo {
    const siret = siretSchema.parse(rawSiret);

    if (siret === tooManySirenRequestsSiret)
      return tooManiSirenRequestsSiretErrorMessage;
    if (siret === apiSirenNotAvailableSiret)
      return siretApiUnavailableSiretErrorMessage;
    if (siret === conflictErrorSiret)
      return "Establishment with this siret is already in our DB";
    if (siret === apiSirenUnexpectedError)
      throw new Error(siretApiUnexpectedErrorErrorMessage);
    const establishment = this.sireneEstablishments[siret];
    return establishment || siretApiMissingEstablishmentMessage;
  }
}
