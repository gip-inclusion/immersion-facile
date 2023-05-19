import {
  ErrorRepository,
  SavedError,
} from "../../../domain/core/ports/ErrorRepository";

export class PgErrorRepository implements ErrorRepository {
  public save(_savedError: SavedError): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
