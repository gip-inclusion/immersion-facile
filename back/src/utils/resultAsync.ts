import type { ResultAsync } from "neverthrow";

export const unwrapOrThrow = <T, E>(
  resultAsync: ResultAsync<T, E>,
): Promise<T> =>
  resultAsync.match(
    (result) => result,
    (error) => {
      throw error;
    },
  );
