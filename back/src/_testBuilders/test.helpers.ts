import { addDays as dateFnsAddDays, format } from "date-fns";
import { EventBus } from "../domain/core/eventBus/EventBus";
import { DomainEvent, DomainTopic } from "../domain/core/eventBus/events";
import type { GenerateMagicLinkFn } from "../adapters/primary/config";
import { ImmersionApplicationId } from "../shared/ImmersionApplicationDto";
import { Role } from "../shared/tokens/MagicLinkPayload";

export const expectPromiseToFailWith = async (
  promise: Promise<unknown>,
  errorMessage: string,
) => {
  await expect(promise).rejects.toThrowError(new Error(errorMessage));
};

export const expectPromiseToFailWithError = async (
  promise: Promise<unknown>,
  error: Error,
) => {
  await expect(promise).rejects.toThrowError(error);
};

export const expectPromiseToFailWithErrorMatching = async (
  promise: Promise<unknown>,
  expectedErrorMatch: Record<string, unknown>,
) => {
  await expect(promise).rejects.toThrow();
  await promise.catch((e) => expect(e).toMatchObject(expectedErrorMatch));
};

export const addDays = (dateStr: string, amount: number) => {
  const newDate = dateFnsAddDays(new Date(dateStr), amount);
  return format(newDate, "yyyy-MM-dd");
};

export const spyOnTopic = (
  eventBus: EventBus,
  topic: DomainTopic,
): DomainEvent[] => {
  const publishedEvents: DomainEvent[] = [];
  eventBus.subscribe(topic, (event) => {
    publishedEvents.push(event);
  });
  return publishedEvents;
};

export const fakeGenerateMagicLinkUrlFn: GenerateMagicLinkFn = (
  applicationId: ImmersionApplicationId,
  role: Role,
) => `http://fake-magic-link/${applicationId}/${role}`;
