import { useCallback, useEffect } from "react";
import { useConsent } from "src/app/components/ConsentManager";

type MatomoTagManagerProps = {
  containerUrl: string;
};

export const MatomoTagManager = ({ containerUrl }: MatomoTagManagerProps) => {
  const consent = useConsent();
  // biome-ignore lint/suspicious/noAssignInExpressions: This is a Matomo script
  const _mtm = ((window as any)._mtm = (window as any)._mtm || []);
  // biome-ignore lint/suspicious/noAssignInExpressions: This is a Matomo script
  const _paq = ((window as any)._paq = (window as any)._paq || []);
  const appendMatomoScript = useCallback(() => {
    appendDiagorienteABTest(_paq);
    _paq.push(["requireCookieConsent"]);
    _mtm.push({ "mtm.startTime": new Date().getTime(), event: "mtm.Start" });
    // to debug, go to http://localhost:3000/?mtmPreviewMode=gXlljpZ7&mtmSetDebugFlag=1
    const script = document.createElement("script");
    script.id = "matomo-tag-manager";
    script.async = true;
    script.src = containerUrl;
    document.getElementsByTagName("head")[0].appendChild(script);
  }, [containerUrl, _paq, _mtm]);

  useEffect(() => {
    const tagManagerScript = document.getElementById("matomo-tag-manager");
    if (containerUrl && !tagManagerScript) {
      if ("complete" === document.readyState) appendMatomoScript();
      else {
        window.addEventListener("load", appendMatomoScript, !1);
      }
    }
    if (consent?.finalityConsent?.statistics) {
      _paq.push(["rememberCookieConsentGiven"]);
    }
  }, [containerUrl, appendMatomoScript, consent, _paq]);

  return null;
};

const appendDiagorienteABTest = (_paq: any) => {
  _paq.push([
    "AbTesting::create",
    {
      name: "recherche-diagoriente",
      percentage: 100,
      includedTargets: [
        {
          attribute: "url",
          inverted: "0",
          type: "regexp",
          value: "immersion-facile\\.beta\\.gouv\\.fr\\/recherche($|\\?.*)",
        },
      ],
      excludedTargets: [],
      variations: [
        {
          name: "original",
          activate: () => {
            // console.log("AB test diagoriente original activated");
          },
        },
        {
          name: "diagoriente",
          percentage: 50,
          activate: (event: any) => {
            // console.log("AB test diagoriente variation activated");
            event.redirect(
              "https://immersion-facile.beta.gouv.fr/recherche-diagoriente",
            );
          },
        },
      ],
      trigger: () => true,
    },
  ]);
};
