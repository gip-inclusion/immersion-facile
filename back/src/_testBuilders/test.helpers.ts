import { addDays as dateFnsAddDays, format } from "date-fns";
import { partition } from "ramda";
import { EmailType, TemplatedEmail } from "shared/email";
import { ConventionId } from "shared/src/convention/convention.dto";
import { Role } from "shared/src/tokens/MagicLinkPayload";
import { GenerateConventionMagicLink } from "../adapters/primary/config/createGenerateConventionMagicLink";
import { CustomClock } from "../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../adapters/secondary/core/UuidGeneratorImplementations";
import { EventBus, makeCreateNewEvent } from "../domain/core/eventBus/EventBus";
import { DomainEvent, DomainTopic } from "../domain/core/eventBus/events";

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

export const fakeGenerateMagicLinkUrlFn: GenerateConventionMagicLink = ({
  id,
  role,
  targetRoute,
}: {
  id: ConventionId;
  role: Role;
  targetRoute: string;
}) => `http://fake-magic-link/${id}/${targetRoute}/${role}`;

export const makeTestCreateNewEvent = () => {
  const clock = new CustomClock();
  const uuidGenerator = new TestUuidGenerator();
  return makeCreateNewEvent({ clock, uuidGenerator });
};

export const expectArraysToMatch = <T>(actual: T[], expected: Partial<T>[]) => {
  expect(actual).toMatchObject(expected);
};

export const expectArraysToEqual = <T>(actual: T[], expected: T[]) => {
  expect(actual).toEqual(expected);
};

export const expectTypeToMatchAndEqual = <T>(actual: T, expected: T) => {
  expect(actual).toEqual(expected);
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

export const splitCasesBetweenPassingAndFailing = <T>(
  cases: readonly T[],
  passing: readonly T[],
): [T[], T[]] => partition((status: T) => passing.includes(status), cases);

export const expectEmailOfType = <
  T extends EmailType,
  E extends TemplatedEmail = TemplatedEmail,
>(
  email: E,
  expectedEmailType: T,
): Extract<E, { type: T }> => {
  expect(email.type).toBe(expectedEmailType);
  return email as Extract<E, { type: T }>;
};
