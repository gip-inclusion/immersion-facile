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
    conventionId: ConventionId,
  ): Promise<void> {
    const hasConventionErrorToMarkAsHandled = this.#savedErrors.some(
      (savedError) => isSavedErrorForConvention(savedError, conventionId),
    );

    if (!hasConventionErrorToMarkAsHandled)
      throw new NotFoundError(
        `There's no ${broadcastToPeServiceName} errors for convention id '${conventionId}'.`,
      );

    this.#savedErrors = this.#savedErrors.map((savedError) => {
      if (isSavedErrorForConvention(savedError, conventionId)) {
        return { ...savedError, handledByAgency: true };
      }
      return savedError;
    });
  }

  public async save(savedError: SavedError): Promise<void> {
    this.#savedErrors.push(savedError);
  }

  public get savedErrors(): SavedError[] {
    return this.#savedErrors;
  }
}

const isSavedErrorForConvention = (
  savedError: SavedError,
  conventionId: ConventionId,
) =>
  "conventionId" in savedError.params &&
  savedError.params.conventionId === conventionId &&
  savedError.serviceName === broadcastToPeServiceName;
