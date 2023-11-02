import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import "./SimpleSection.scss";

export type SimpleSectionProps = {
  button: {
    label: string;
    onClick: () => void;
  };
  illustrationUrl: string;
  link: {
    href: string;
    label: string;
  };
  children: React.ReactNode;
};

export const SimpleSection = (props: SimpleSectionProps) => (
  <section className={"im-simple-section"}>
    <div className={"im-simple-section__content"}>
      {props.children}
      <Button onClick={props.button.onClick}>{props.button.label}</Button>
      <div className={fr.cx("fr-mt-2w")}>
        <a href={props.link.href} className={fr.cx("fr-link")}>
          {props.link.label}
        </a>
      </div>
    </div>
    <div className={"im-simple-section__illustration"}>
      <img src={props.illustrationUrl} alt="" />
    </div>
  </section>
);
