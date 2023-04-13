import React from "react";

import { LegacyHttpClientError } from "shared";

import { ErrorPageContent } from "./ErrorPageContent";
import { HttpClientErrorSelector } from "./HttpClientErrorSelector";

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
    <ErrorPageContent
      message={`<pre><code>${JSON.stringify(error, null, 2)}</code></pre>`}
    />
  );
