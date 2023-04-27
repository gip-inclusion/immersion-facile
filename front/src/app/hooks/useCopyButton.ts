import { useState } from "react";

export const useCopyButton = () => {
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
      // eslint-disable-next-line no-console
      .catch((error) => console.error(error));
  };

  const copyButtonIsDisabled = isCopied;

  const copyButtonLabel = isCopied ? "Copié !" : "Copier cet ID";

  return { onCopyButtonClick, copyButtonLabel, copyButtonIsDisabled };
};
