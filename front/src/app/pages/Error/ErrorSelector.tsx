import React from "react";
import { HttpClientError } from "src/../../shared/src/httpClient/errors/4xxClientError.error";
import { ErrorPage } from "./ErrorPage";
import { HttpClientErrorSelector } from "./HttpClientErrorSelector";
import { ManagedErrorSelector } from "./ManagedErrors";

type ErrorSelectorProperties = {
  error: Error;
  jwt: string | undefined;
};

export const ErrorSelector = ({
  error,
  jwt,
}: ErrorSelectorProperties): JSX.Element =>
  error instanceof HttpClientError ? (
    <HttpClientErrorSelector error={error} jwt={jwt} />
  ) : (
    <ErrorPage>
      <ManagedErrorSelector kind="unknownError">
        {JSON.stringify(error)}
      </ManagedErrorSelector>
    </ErrorPage>
  );
