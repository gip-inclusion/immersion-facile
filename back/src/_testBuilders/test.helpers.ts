import { addDays as dateFnsAddDays, format } from "date-fns";
import { GenerateVerificationMagicLink } from "../adapters/primary/config/createGenerateVerificationMagicLink";
import { EventBus } from "../domain/core/eventBus/EventBus";
import { DomainEvent, DomainTopic } from "../domain/core/eventBus/events";
import { Role } from "shared/src/tokens/MagicLinkPayload";
import { ImmersionApplicationId } from "shared/src/ImmersionApplication/ImmersionApplication.dto";

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
  subscriptionId: string,
): DomainEvent[] => {
  const publishedEvents: DomainEvent[] = [];
  //eslint-disable-next-line @typescript-eslint/require-await
  eventBus.subscribe(topic, subscriptionId, async (event) => {
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

export const expectJwtInMagicLinkAndGetIt = (link: string | unknown) => {
  expect(typeof link).toBe("string");
  const split = (link as string).split("jwt=");
  const last = split[split.length - 1];
  expect(last).toBeTruthy();
  return last;
};

export const expectArraysToEqualIgnoringOrder = <T>(
  actual: T[],
  expected: T[],
) => {
  expect(actual).toHaveLength(expected.length);
  expect(actual).toEqual(expect.arrayContaining(expected));
};
