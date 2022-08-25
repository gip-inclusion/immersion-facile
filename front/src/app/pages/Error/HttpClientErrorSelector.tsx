import React from "react";
import { HttpClientError } from "shared/src/httpClient/errors/4xxClientError.error";
import { RenewExpiredLinkContent } from "src/helpers/RenewExpiredLinkPage";
import { ManagedErrorSelector } from "./ManagedErrors";

type HttpClientErrorProperties = {
  error: HttpClientError;
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
