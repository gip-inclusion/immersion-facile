import React, { useEffect, useState } from "react";
import { RenewExpiredLinkContent } from "src/helpers/RenewExpiredLinkPage";

// Inspired by https://itnext.io/centralizing-api-error-handling-in-react-apps-810b2be1d39d
interface UseApiCallProps<T> {
  callApi: () => Promise<T>;
}

function useApiCall<T>({ callApi }: UseApiCallProps<T>) {
  const [error, setError] = useState<any | null>(null);
  const [apiData, setApiData] = useState<T | null>(null);

  useEffect(() => {
    callApi()
      .then((apiData) => {
        console.log(apiData);
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

  if (error) {
    if (error.response) {
      if (error.response.status === 403) {
        if (jwt && error.response.data.needsNewMagicLink) {
          const originalURL = location.href.replaceAll(jwt, "%jwt%");
          return (
            <RenewExpiredLinkContent
              expiredJwt={jwt}
              originalURL={originalURL}
            />
          );
        }
        return <h1>403 Accès refusé</h1>;
      }

      if (error.response?.status === 404) {
        return <h1>404 Page non trouvé</h1>;
      }
    }
    return <h1>{JSON.stringify(error)}</h1>;
  }

  return children(data);
}
