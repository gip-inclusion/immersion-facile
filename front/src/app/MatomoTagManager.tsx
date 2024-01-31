import { useCallback, useEffect } from "react";
import { useConsent } from "src/app/components/ConsentManager";

type MatomoTagManagerProps = {
  containerUrl: string;
};

export const MatomoTagManager = ({ containerUrl }: MatomoTagManagerProps) => {
  const appendMatomoScript = useCallback(() => {
    const _mtm = ((window as any)._mtm = (window as any)._mtm || []);
    _mtm.push({ "mtm.startTime": new Date().getTime(), event: "mtm.Start" });
    // to debug, go to http://localhost:3000/?mtmPreviewMode=gXlljpZ7&mtmSetDebugFlag=1

    const script = document.createElement("script");
    script.async = true;
    script.src = containerUrl;

    document.getElementsByTagName("head")[0].appendChild(script);
  }, [containerUrl]);
  const consent = useConsent();

  useEffect(() => {
    if (containerUrl && consent.finalityConsent?.statistics) {
      if ("complete" === document.readyState) appendMatomoScript();
      else {
        window.addEventListener("load", appendMatomoScript, !1);
      }
    }
  }, [containerUrl, appendMatomoScript, consent]);

  return null;
};
