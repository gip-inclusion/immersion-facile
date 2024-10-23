import { FrClassName, FrIconClassName, fr } from "@codegouvfr/react-dsfr";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import Tag from "@codegouvfr/react-dsfr/Tag";
import React, { useState } from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./SearchFilter.styles";

export type SearchFilterProps = {
  defaultValue: string;
  values: string[];
  submenu: {
    title: string;
    content: React.ReactNode;
  };
  iconId: FrIconClassName;
  className?: FrClassName;
};

export const SearchFilter = ({
  defaultValue,
  values,
  submenu,
  iconId,
  className,
}: SearchFilterProps) => {
  const { cx } = useStyles();
  const [isOpened, setIsOpened] = useState<boolean>(false);
  const hasValue = values && values.length > 0;
  return (
    <div className={cx(Styles.root)}>
      <Tag
        iconId={iconId}
        className={className}
        nativeButtonProps={{
          onClick: (event) => {
            event.preventDefault();
            setIsOpened((opened) => !opened);
          },
        }}
      >
        {hasValue ? values.join(", ") : defaultValue}
      </Tag>
      {isOpened && (
        <section className={cx(fr.cx("fr-p-3w"), Styles.submenu)}>
          <p className={fr.cx("fr-text--bold")}>{submenu.title}</p>
          {submenu.content}
          <ButtonsGroup
            className={fr.cx("fr-hr", "fr-pt-2w", "fr-pb-0")}
            inlineLayoutWhen="always"
            alignment="right"
            buttons={[
              {
                children: "Annuler",
                type: "button",
                priority: "secondary",
                onClick: () => setIsOpened(false),
                className: fr.cx("fr-mb-0"),
              },
              {
                children: "Appliquer",
                type: "submit",
                onClick: () => setIsOpened(false),
                className: fr.cx("fr-mb-0"),
              },
            ]}
          />
        </section>
      )}
    </div>
  );
};
