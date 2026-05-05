import { useEffect } from "react";
import type { AbsoluteUrl, Environment } from "shared";

type SupportedEnvironment = Extract<Environment, "staging" | "production">;

type TagContainerProps = {
  environment: Environment;
};

const SCRIPT_ID = "tc-container-script";

const containerUrlForEnvironment: Record<SupportedEnvironment, AbsoluteUrl> = {
  staging: "https://cdn.tagcommander.com/7774/uat/tc_ImmersionFacile_31.js",
  production: "https://cdn.tagcommander.com/7774/tc_ImmersionFacile_31.js",
};

export const TagContainer = ({ environment }: TagContainerProps) => {
  useEffect(() => {
    if (environment !== "staging" && environment !== "production") return;

    const containerUrl = containerUrlForEnvironment[environment];
    const existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = containerUrl;
    script.setAttribute("data-tc-container", "true");

    document.head.appendChild(script);

    return () => {
      if (script.parentNode && !script.hasAttribute("data-loaded")) {
        script.parentNode.removeChild(script);
      }
    };
  }, [environment]);

  return null;
};
