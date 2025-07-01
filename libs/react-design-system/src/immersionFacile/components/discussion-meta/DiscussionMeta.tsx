import { fr } from "@codegouvfr/react-dsfr/fr";
import type { ReactNode } from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./DiscussionMeta.styles";

export const DiscussionMeta = ({ children }: { children: ReactNode[] }) => {
  const { cx } = useStyles();
  return (
    <ul className={cx(fr.cx("fr-mb-2w", "fr-pl-0"), Styles.root)}>
      {children.map((child) => (
        <li
          className={cx(Styles.item)}
          key={
            child && typeof child === "object" && "key" in child
              ? child.key
              : child?.toString()
          }
        >
          {child}
        </li>
      ))}
    </ul>
  );
};
