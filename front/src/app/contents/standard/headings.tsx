import { fr } from "@codegouvfr/react-dsfr";
import type { PropsWithChildren } from "react";

export const SectionTitle = ({ children }: PropsWithChildren) => (
  <h2 className={fr.cx("fr-h5")}>{children}</h2>
);

export const SubSectionTitle = ({ children }: PropsWithChildren) => (
  <h3 className={fr.cx("fr-h6")}>{children}</h3>
);

export const SubSubSectionTitle = ({ children }: PropsWithChildren) => (
  <h4 className={fr.cx("fr-h6")}>{children}</h4>
);
