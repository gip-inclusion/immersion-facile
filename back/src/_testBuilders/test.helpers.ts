import { addDays as dateFnsAddDays, format } from "date-fns";
import type { GenerateVerificationMagicLink } from "../adapters/primary/config";
import { EventBus } from "../domain/core/eventBus/EventBus";
import { DomainEvent, DomainTopic } from "../domain/core/eventBus/events";
import { Role } from "../shared/tokens/MagicLinkPayload";
import { ImmersionApplicationId } from "../shared/ImmersionApplication/ImmersionApplication.dto";

export const expectPromiseToFailWith = async (
  promise: Promise<unknown>,
  errorMessage: string,
) => {
  await expect(promise).rejects.toThrowError(new Error(errorMessage));
};

export const expectPromiseToFailWithError = async (
  promise: Promise<unknown>,
  expectedError: Error,
) => {
  await expect(promise).rejects.toThrowError(expectedError);
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
  eventBus.subscribe(topic, async (event) => {
    publishedEvents.push(event);
  });
  return publishedEvents;
};
export const fakeGenerateMagicLinkUrlFn: GenerateVerificationMagicLink = (
  applicationId: ImmersionApplicationId,
  role: Role,
  targetRoute: string,
) => `http://fake-magic-link/${applicationId}/${targetRoute}/${role}`;

export const expectArraysToMatch = <T>(actual: T[], expected: Partial<T>[]) => {
  expect(actual).toMatchObject(expected);
};

export const expectArraysToEqual = <T>(actual: T[], expected: T[]) => {
  expect(actual).toEqual(expected);
};

export const expectTypeToMatchAndEqual = <T>(actual: T, expected: T) => {
  expect(actual).toStrictEqual(expected);
};

export const expectObjectsToMatch = <T extends Record<any, unknown>>(
  actual: T,
  expected: Partial<T>,
) => {
  expect(actual).toMatchObject(expected);
};
