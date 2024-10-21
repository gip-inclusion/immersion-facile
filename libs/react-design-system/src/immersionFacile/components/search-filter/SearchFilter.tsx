import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
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
};

export const SearchFilter = ({
  defaultValue,
  values,
  submenu,
}: SearchFilterProps) => {
  const { cx } = useStyles();
  const [isOpened, setIsOpened] = useState<boolean>(false);
  return (
    <div className={cx(Styles.root)}>
      <Tag
        nativeButtonProps={{
          onClick: (event) => {
            event.preventDefault();
            setIsOpened((opened) => !opened);
          },
        }}
      >
        {values && values.length > 0 ? values.join(", ") : defaultValue}
      </Tag>
      {isOpened && (
        <section className={cx(fr.cx("fr-p-2w"), Styles.submenu)}>
          <p className={fr.cx("fr-text--bold")}>{submenu.title}</p>
          {submenu.content}
          <div>
            <Button
              priority="secondary"
              type="button"
              onClick={() => {
                setIsOpened(false);
              }}
            >
              Annuler
            </Button>
            <Button type="submit">Valider</Button>
          </div>
        </section>
      )}
    </div>
  );
};
