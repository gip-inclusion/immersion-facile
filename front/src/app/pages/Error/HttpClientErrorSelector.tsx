import React from "react";
import { LegacyHttpClientError } from "shared";
import { RenewExpiredLinkContent } from "src/app/routes/RenewExpiredLinkPage";
import { ManagedErrorSelector } from "./ManagedErrors";

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
    return <ManagedErrorSelector kind="httpClientInvalidToken" />;
  if (error.httpStatusCode === 404)
    return <ManagedErrorSelector kind="httpClientNotFoundError" />;
  return (
    <ManagedErrorSelector kind="httpUnknownClientError">
      {JSON.stringify(error)}
    </ManagedErrorSelector>
  );
};
