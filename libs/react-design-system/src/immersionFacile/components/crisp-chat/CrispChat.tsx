import React, { ElementRef, useEffect, useRef } from "react";

type CrispChatProperties = {
  crispWebsiteId: string;
  userConsent: boolean;
};

// Inspired by https://github.com/MinooTavakoli/crisp-react
export const CrispChat = ({
  crispWebsiteId,
  userConsent,
}: CrispChatProperties) => {
  const ref = useRef<ElementRef<"div">>(null);
  const appendCrispChatScript = () => {
    (window as any).$crisp = [];
    (window as any).CRISP_WEBSITE_ID = crispWebsiteId;
    const d = document;
    const s = d.createElement("script");
    s.src = "https://client.crisp.chat/l.js";
    s.async = true;
    d.getElementsByTagName("head")[0].appendChild(s);
  };
  useEffect(() => {
    if (crispWebsiteId && userConsent) {
      const e = document;
      const a = window;
      if ("complete" === e.readyState) appendCrispChatScript();
      else {
        a.addEventListener("load", appendCrispChatScript);
      }
    }
  }, [crispWebsiteId]);
  return <div ref={ref} />;
};
