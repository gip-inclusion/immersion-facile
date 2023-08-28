import { useState } from "react";
import { ContactErrorKind } from "src/core-logic/ports/SearchGateway";

type ErrorTitleAndDescription = {
  title: string;
  description: string;
};

const errorKindToTitleAndDescription = {
  alreadyContactedRecently: {
    title: "Mise en contact effectuée",
    description:
      "Vous avez déjà contacté cette entreprise. Elle a bien reçu votre demande. Il n'est pas nécessaire de la contacter de nouveau.",
  },
} satisfies Record<ContactErrorKind, ErrorTitleAndDescription>;

type ActiveError =
  | { isActive: false }
  | { isActive: true; title: string; description: string };

export const useContactEstablishmentError = (): {
  activeError: ActiveError;
  setActiveErrorKind: React.Dispatch<
    React.SetStateAction<ContactErrorKind | null>
  >;
} => {
  const [activeErrorKind, setActiveErrorKind] =
    useState<ContactErrorKind | null>(null);

  return {
    activeError:
      activeErrorKind === null
        ? { isActive: false }
        : {
            isActive: true,
            title: errorKindToTitleAndDescription[activeErrorKind].title,
            description:
              errorKindToTitleAndDescription[activeErrorKind].description,
          },
    setActiveErrorKind,
  };
};
