import React from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Toastr } from "react-design-system";
import { ENV } from "src/config/environmentVariables";

export const ReloadPrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(serviceWorkerUrl, registration) {
      registration &&
        setInterval(async () => {
          if (!(!registration.installing && navigator)) return;
          if ("connection" in navigator && !navigator.onLine) return;
          const shouldSWBeUpdatedResponse = await fetch(serviceWorkerUrl, {
            cache: "no-store",
            headers: {
              cache: "no-store",
              "cache-control": "no-cache",
            },
          });
          if (shouldSWBeUpdatedResponse?.status === 200)
            await registration.update();
        }, ENV.updateServiceWorkerIntervalInSeconds * 1000);
    },
    onRegisterError(error) {
      // eslint-disable-next-line no-console
      console.error("SW registration error", error);
    },
  });
  return (
    <Toastr
      isVisible={needRefresh}
      message="Une nouvelle version d'Immersion Facilitée est disponible, veuillez recharger la page pour en profiter."
      confirmButton={{
        label: "Recharger la page",
        onClick: async () => {
          await updateServiceWorker(true);
          setNeedRefresh(false);
          window.location.reload();
        },
      }}
    />
  );
};
