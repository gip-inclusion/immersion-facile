import { ConventionId } from "shared";
import { NotFoundError } from "../../../../config/helpers/httpErrors";
import {
  SavedError,
  SavedErrorRepository,
  broadcastToPeServiceName,
} from "../ports/SavedErrorRepository";

export class InMemorySavedErrorRepository implements SavedErrorRepository {
  // for testing purposes
  #savedErrors: SavedError[] = [];

  public async markPartnersErroredConventionAsHandled(
    conventionId: ConventionId,
  ): Promise<void> {
    const hasConventionErrorToMarkAsHandled = this.#savedErrors.some(
      (savedError) =>
        isUnhandledSavedErrorForConvention(savedError, conventionId),
    );

    if (!hasConventionErrorToMarkAsHandled)
      throw new NotFoundError(
        `There's no ${broadcastToPeServiceName} unhandled errors for convention id '${conventionId}'.`,
      );

    this.#savedErrors = this.#savedErrors.map((savedError) => {
      if (isUnhandledSavedErrorForConvention(savedError, conventionId)) {
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

const isUnhandledSavedErrorForConvention = (
  savedError: SavedError,
  conventionId: ConventionId,
) =>
  savedError.params &&
  "conventionId" in savedError.params &&
  savedError.params.conventionId === conventionId &&
  savedError.serviceName === broadcastToPeServiceName &&
  savedError.handledByAgency === false;
