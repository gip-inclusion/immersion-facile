import React, { useEffect, useState } from "react";
import { RenewExpiredLinkContent } from "src/helpers/RenewExpiredLink";
import { random } from "src/shared/utils";

// Inspired by https://itnext.io/centralizing-api-error-handling-in-react-apps-810b2be1d39d
interface UseApiCallProps<T> {
  apiCall: () => Promise<T>;
}

function useApiCall<T>({ apiCall }: UseApiCallProps<T>) {
  const [error, setError] = useState<any | null>(null);
  const [apiData, setApiData] = useState<T | null>(null);

  useEffect(() => {
    apiCall()
      .then((apiData) => {
        console.log(apiData);
        setApiData(apiData);
      })
      .catch((e) => {
        setError(e);
      });
  }, [apiCall]);

  return { data: apiData, error };
}

interface ApiDataContainerProps<T> {
  apiCall: () => Promise<T>;
  children: (data: any) => React.ReactElement;
  jwt?: string;
}

export function ApiDataContainer<T>({
  apiCall,
  children,
  jwt,
}: ApiDataContainerProps<T>): React.ReactElement {
  const { data, error } = useApiCall({ apiCall });

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

      if (error.response.status === 404) {
        return <h1>404 Page non trouvé</h1>;
      }
    }
    return <h1>{JSON.stringify(error)}</h1>;
  }

  return children(data);
}
