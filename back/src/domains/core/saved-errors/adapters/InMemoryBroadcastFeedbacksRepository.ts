import { ConventionId, errors } from "shared";

import {
  BroadcastFeedback,
  BroadcastFeedbacksRepository,
} from "../ports/BroadcastFeedbacksRepository";

export class InMemoryBroadcastFeedbacksRepository
  implements BroadcastFeedbacksRepository
{
  // for testing purposes
  #broadcastFeedbacks: BroadcastFeedback[] = [];

  public async markPartnersErroredConventionAsHandled(
    conventionId: ConventionId,
  ): Promise<void> {
    const hasConventionErrorToMarkAsHandled = this.#broadcastFeedbacks.some(
      (broadcastFeedback) =>
        isBroadcastFeedbackUnhandledErrorForConvention(
          broadcastFeedback,
          conventionId,
        ),
    );

    if (!hasConventionErrorToMarkAsHandled)
      throw errors.broadcastFeedback.notFound({
        conventionId,
      });

    this.#broadcastFeedbacks = this.#broadcastFeedbacks.map(
      (broadcastFeedback) => {
        if (
          isBroadcastFeedbackUnhandledErrorForConvention(
            broadcastFeedback,
            conventionId,
          )
        ) {
          return { ...broadcastFeedback, handledByAgency: true };
        }
        return broadcastFeedback;
      },
    );
  }

  public async save(broadcastFeedback: BroadcastFeedback): Promise<void> {
    this.#broadcastFeedbacks.push(broadcastFeedback);
  }

  public async getLastBroadcastFeedback(
    conventionId: ConventionId,
  ): Promise<BroadcastFeedback | null> {
    return (
      this.#broadcastFeedbacks
        .filter(
          (broadcast) => broadcast.requestParams.conventionId === conventionId,
        )
        .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
        .at(-1) || null
    );
  }

  public get broadcastFeedbacks(): BroadcastFeedback[] {
    return this.#broadcastFeedbacks;
  }
}

const isBroadcastFeedbackUnhandledErrorForConvention = (
  broadcastFeedback: BroadcastFeedback,
  conventionId: ConventionId,
) =>
  broadcastFeedback.requestParams &&
  "conventionId" in broadcastFeedback.requestParams &&
  broadcastFeedback.requestParams.conventionId === conventionId &&
  broadcastFeedback.handledByAgency === false;
