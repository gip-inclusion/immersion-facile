import { AppellationDto, sleep, toLowerCaseWithoutDiacritics } from "shared";
import { AppellationsGateway } from "../ports/AppellationsGateway";

export class InMemoryAppellationsGateway implements AppellationsGateway {
  public async searchAppellations(query: string): Promise<AppellationDto[]> {
    if (this.#delayInMs > 0) await sleep(this.#delayInMs);

    return this.#nextResults.filter((appellation) =>
      toLowerCaseWithoutDiacritics(appellation.appellationLabel).includes(
        toLowerCaseWithoutDiacritics(query),
      ),
    );
  }

  public setNextSearchAppellationsResult(nextResult: AppellationDto[]) {
    this.#nextResults = nextResult;
  }

  public setDelayInMs(delayInMs: number) {
    this.#delayInMs = delayInMs;
  }

  #delayInMs = 0;

  #nextResults: AppellationDto[] = [];
}
