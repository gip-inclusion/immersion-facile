export type FTConnectErrorKind = (typeof ftConnectErrorKinds)[number];
const ftConnectErrorKinds = [
  "peConnectInvalidGrant",
  "peConnectNoAuthorisation",
  "peConnectAdvisorForbiddenAccess",
  "peConnectGetUserInfoForbiddenAccess",
  "peConnectGetUserStatusInfoForbiddenAccess",
  "peConnectConnectionAborted",
] as const;

abstract class RedirectError extends Error {
  constructor(message: string, cause?: Error) {
    super(message, { cause });
  }
}

export class ManagedFTConnectError extends RedirectError {
  constructor(
    public readonly kind: FTConnectErrorKind,
    cause?: Error,
  ) {
    super(
      `A France Travail error of type ${kind} has been thrown.`,
      cause && new Error(cause?.message),
    );
  }
}

export class FTConnectError extends RedirectError {
  constructor(
    public readonly title: string,
    public override readonly message: string,
    cause?: Error,
  ) {
    super(`A raw redirect error has been thrown : ${title} ${message}`, cause);
    this.name = "RawRedirectError";
  }
}

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

export async function testRawFTConnectError(
  cb: () => unknown,
  expectedError: FTConnectError,
) {
  const error: FTConnectError = await getTypedError<FTConnectError>(() => cb());
  expect(error.constructor.name).toEqual(expectedError.constructor.name);
  expect(error).toStrictEqual(expectedError);
  expect(error.title).toStrictEqual(expectedError.title);
}

export async function testManagedFTConnectError(
  cb: () => unknown,
  expectedError: ManagedFTConnectError,
) {
  const error: ManagedFTConnectError =
    await getTypedError<ManagedFTConnectError>(() => cb());
  expect(error.constructor.name).toEqual(expectedError.constructor.name);
  expect(error).toStrictEqual(expectedError);
  expect(error.kind).toStrictEqual(expectedError.kind);
}
