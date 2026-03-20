import { useEffect } from "react";

type TagContainerProps = {
  containerUrl: string;
};

const SCRIPT_ID = "tc-container-script";

export const TagContainer = ({ containerUrl }: TagContainerProps) => {
  useEffect(() => {
    if (!containerUrl) return;

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
  }, [containerUrl]);

  return null;
};
