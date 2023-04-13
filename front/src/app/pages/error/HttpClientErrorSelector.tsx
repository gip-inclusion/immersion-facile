import React from "react";
import { LegacyHttpClientError } from "shared";
import { RenewExpiredLinkContent } from "src/app/routes/RenewExpiredLinkPage";
import { ErrorPage } from "./ErrorPage";

type HttpClientErrorProperties = {
  error: LegacyHttpClientError;
  jwt: string | undefined;
};

export const HttpClientErrorSelector = ({
  error,
  jwt,
}: HttpClientErrorProperties): JSX.Element => {
  if (error.httpStatusCode === 403 && jwt && error.data.needsNewMagicLink)
    return (
      <RenewExpiredLinkContent
        expiredJwt={jwt}
        originalURL={location.href.replaceAll(jwt, "%jwt%")}
      />
    );
  if (error.httpStatusCode === 401 && jwt)
    return <ErrorPage type="httpClientInvalidToken" />;
  if (error.httpStatusCode === 404)
    return <ErrorPage type="httpClientNotFoundError" />;
  return (
    <ErrorPage
      type="httpUnknownClientError"
      message={`<pre><code>${JSON.stringify(error, null, 2)}</code></pre>`}
    />
  );
};
