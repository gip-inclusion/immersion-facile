import React from "react";
import { LegacyHttpClientError } from "shared";
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
  error instanceof LegacyHttpClientError ? (
    <HttpClientErrorSelector error={error} jwt={jwt} />
  ) : (
    <ErrorPage>
      <ManagedErrorSelector kind="unknownError">
        {JSON.stringify(error)}
      </ManagedErrorSelector>
    </ErrorPage>
  );
