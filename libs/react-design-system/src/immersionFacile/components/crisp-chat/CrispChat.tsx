import React, { useEffect, useRef } from "react";

type CrispChatProperties = {
  crispWebsiteId: string;
};

// Inspired by https://github.com/MinooTavakoli/crisp-react
export const CrispChat = ({ crispWebsiteId }: CrispChatProperties) => {
  const ref = useRef<HTMLDivElement>(null);
  const crispChat = () => {
    (window as any).$crisp = [];
    (window as any).CRISP_WEBSITE_ID = crispWebsiteId;
    const d = document;
    const s = d.createElement("script");
    s.src = "https://client.crisp.chat/l.js";
    s.async = true;
    d.getElementsByTagName("head")[0].appendChild(s);
  };
  useEffect(() => {
    if (crispWebsiteId) {
      const e = document;
      const a = window;
      if ("complete" === e.readyState) crispChat();
      else {
        a.addEventListener("load", crispChat, !1);
      }
    }
  }, [crispWebsiteId]);
  return <div ref={ref} />;
};
