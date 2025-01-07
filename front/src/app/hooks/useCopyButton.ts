import { useState } from "react";

export const useCopyButton = (defaultLabel = "Copier cet ID") => {
  const [isCopied, setIsCopied] = useState(false);

  const onCopyButtonClick = (stringToCopy: string) => {
    navigator.clipboard
      .writeText(stringToCopy)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 3_000);
      })

      .catch((error) => console.error(error));
  };

  const copyButtonIsDisabled = isCopied;

  const copyButtonLabel = isCopied ? "Copié !" : defaultLabel;

  return { onCopyButtonClick, copyButtonLabel, copyButtonIsDisabled, isCopied };
};
