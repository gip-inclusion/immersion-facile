export type ManagedErrorKind = typeof managedErrorKinds[number];
const managedErrorKinds = [
  "peConnectInvalidGrant",
  "peConnectNoAuthorisation",
  "peConnectNoValidAdvisor",
  "peConnectNoValidUser",
  "peConnectAdvisorForbiddenAccess",
  "peConnectGetUserInfoForbiddenAccess",
  "peConnectGetUserStatusInfoForbiddenAccess",
  "peConnectConnectionAborted",
  "httpUnknownClientError",
  "httpClientNotFoundError",
  "httpClientInvalidToken",
  "unknownError",
] as const;

export abstract class RedirectError extends Error {
  constructor(message: string, cause?: Error) {
    super(message, { cause });
  }
}

export class ManagedRedirectError extends RedirectError {
  constructor(public readonly kind: ManagedErrorKind, cause?: Error) {
    super(`A managed redirect error of type ${kind} has been thrown`, cause);
  }
}

export class RawRedirectError extends RedirectError {
  constructor(
    public readonly title: string,
    public override readonly message: string,
    cause?: Error,
  ) {
    super(`A raw redirect error has been thrown : ${title} ${message}`, cause);
    this.name = "RawRedirectError";
  }
}

export const isManagedError = (
  kind: string | undefined,
): kind is ManagedErrorKind =>
  kind ? managedErrorKinds.includes(kind as ManagedErrorKind) : false;

// Use to circumvent the jest/no-conditionnal-expect pattern
export const getTypedError = async <TError>(
  call: () => unknown,
): Promise<TError> => {
  try {
    await call();
    throw new Error();
  } catch (error: unknown) {
    return error as TError;
  }
};

export async function testRawRedirectError(
  cb: () => unknown,
  expectedError: RawRedirectError,
) {
  const error: RawRedirectError = await getTypedError<RawRedirectError>(() =>
    cb(),
  );
  expect(error.constructor.name).toEqual(expectedError.constructor.name);
  expect(error).toStrictEqual(expectedError);
  expect(error.title).toStrictEqual(expectedError.title);
}

export async function testManagedRedirectError(
  cb: () => unknown,
  expectedError: ManagedRedirectError,
) {
  const error: ManagedRedirectError = await getTypedError<ManagedRedirectError>(
    () => cb(),
  );
  expect(error.constructor.name).toEqual(expectedError.constructor.name);
  expect(error).toStrictEqual(expectedError);
  expect(error.kind).toStrictEqual(expectedError.kind);
}
