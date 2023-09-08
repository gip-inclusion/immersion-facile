import {
  ErrorRepository,
  SavedError,
} from "../../../domain/core/ports/ErrorRepository";

export class InMemoryErrorRepository implements ErrorRepository {
  // for testing purposes
  #savedErrors: SavedError[] = [];

  public async save(savedError: SavedError): Promise<void> {
    this.#savedErrors.push(savedError);
  }

  public get savedErrors(): SavedError[] {
    return this.#savedErrors;
  }
}
