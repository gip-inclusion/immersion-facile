import React, { useEffect, useState } from "react";
import { Notification } from "src/../../libs/react-design-system";
import { HttpClientError } from "src/../../shared/src/httpClient/errors/4xxClientError.error";
import { RenewExpiredLinkContent } from "src/helpers/RenewExpiredLinkPage";

// Inspired by https://itnext.io/centralizing-api-error-handling-in-react-apps-810b2be1d39d
interface UseApiCallProps<T> {
  callApi: () => Promise<T>;
}

function useApiCall<T>({ callApi }: UseApiCallProps<T>) {
  const [error, setError] = useState<Error | null>(null);
  const [apiData, setApiData] = useState<T | null>(null);

  useEffect(() => {
    callApi()
      .then((apiData) => {
        setApiData(apiData);
      })
      .catch((e) => {
        setError(e);
      });
  }, []);

  return { data: apiData, error };
}

interface ApiDataContainerProps<T> {
  callApi: () => Promise<T>;
  children: (data: T | null) => React.ReactElement;
  jwt?: string;
}

export function ApiDataContainer<T>({
  callApi,
  children,
  jwt,
}: ApiDataContainerProps<T>): React.ReactElement {
  const { data, error } = useApiCall({ callApi });
  return error ? onError(error, jwt) : children(data);
}

const onError = (error: Error, jwt: string | undefined): JSX.Element =>
  error instanceof HttpClientError
    ? onHttpClientError(error, jwt)
    : showErrorNotification("Erreur inconnue", JSON.stringify(error));

const onHttpClientError = (
  error: HttpClientError,
  jwt: string | undefined,
): JSX.Element => {
  if (error.httpStatusCode === 403 && jwt && error.data.needsNewMagicLink)
    return (
      <RenewExpiredLinkContent
        expiredJwt={jwt}
        originalURL={location.href.replaceAll(jwt, "%jwt%")}
      />
    );
  if (error.httpStatusCode === 401)
    return showErrorNotification("Votre token n'est pas valide.");
  if (error.httpStatusCode === 404)
    return showErrorNotification("404 Page non trouvé.");
  return showErrorNotification("Erreur client inconnue", JSON.stringify(error));
};

const showErrorNotification = (
  title: string,
  children?: string,
): JSX.Element => (
  <Notification title={title} type="error" children={children} />
);
