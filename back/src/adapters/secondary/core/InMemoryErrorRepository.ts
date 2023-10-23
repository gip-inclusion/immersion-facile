import { ConventionId } from "shared";
import {
  broadcastToPeServiceName,
  ErrorRepository,
  SavedError,
} from "../../../domain/core/ports/ErrorRepository";
import { NotFoundError } from "../../primary/helpers/httpErrors";

export class InMemoryErrorRepository implements ErrorRepository {
  // for testing purposes
  #savedErrors: SavedError[] = [];

  public async markPartnersErroredConventionAsHandled(
    id: ConventionId,
  ): Promise<void> {
    let erroredConventionMarked = false;
    this.#savedErrors = this.#savedErrors.map((savedError) => {
      if (
        "conventionId" in savedError.params &&
        savedError.params.conventionId === id &&
        savedError.serviceName === broadcastToPeServiceName
      ) {
        erroredConventionMarked = true;
        return { ...savedError, handledByAgency: true };
      }

      return savedError;
    });
    if (!erroredConventionMarked)
      throw new NotFoundError(
        `There's no ${broadcastToPeServiceName} errors for convention id '${id}'.`,
      );
  }

  public async save(savedError: SavedError): Promise<void> {
    this.#savedErrors.push(savedError);
  }

  public get savedErrors(): SavedError[] {
    return this.#savedErrors;
  }
}
