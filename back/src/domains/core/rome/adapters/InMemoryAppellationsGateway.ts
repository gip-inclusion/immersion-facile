import { type AppellationDto, toLowerCaseWithoutDiacritics } from "shared";
import type { AppellationsGateway } from "../ports/AppellationsGateway";

export class InMemoryAppellationsGateway implements AppellationsGateway {
  public async searchAppellations(query: string): Promise<AppellationDto[]> {
    return this.#nextResults.filter((appellation) =>
      toLowerCaseWithoutDiacritics(appellation.appellationLabel).includes(
        toLowerCaseWithoutDiacritics(query),
      ),
    );
  }

  public setNextSearchAppellationsResult(nextResult: AppellationDto[]) {
    this.#nextResults = nextResult;
  }

  #nextResults: AppellationDto[] = [];
}
