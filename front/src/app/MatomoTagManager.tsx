import { useEffect } from "react";
import { useRoute } from "src/app/routes/routes";

type MatomoTagManagerProps = {
  containerUrl: string;
};

export const MatomoTagManager = ({ containerUrl }: MatomoTagManagerProps) => {
  const _route = useRoute();

  const appendMatomoScript = () => {
    const _mtm = ((window as any)._mtm = (window as any)._mtm || []);
    _mtm.push({ "mtm.startTime": new Date().getTime(), event: "mtm.Start" });
    // to debug, go to http://localhost:3000/?mtmPreviewMode=gXlljpZ7&mtmSetDebugFlag=1

    const script = document.createElement("script");
    script.async = true;
    script.src = containerUrl;

    document.getElementsByTagName("head")[0].appendChild(script);
  };

  useEffect(() => {
    if (containerUrl) {
      if ("complete" === document.readyState) appendMatomoScript();
      else {
        window.addEventListener("load", appendMatomoScript, !1);
      }
    }
  }, [containerUrl]);

  return null;
};
