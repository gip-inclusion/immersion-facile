import {
  ErrorRepository,
  SavedError,
} from "../../../domain/core/ports/ErrorRepository";

export class InMemoryErrorRepository implements ErrorRepository {
  public async save(savedError: SavedError): Promise<void> {
    this._savedErrors.push(savedError);
  }

  // for testing purposes
  private _savedErrors: SavedError[] = [];

  public get savedErrors(): SavedError[] {
    return this._savedErrors;
  }
}
