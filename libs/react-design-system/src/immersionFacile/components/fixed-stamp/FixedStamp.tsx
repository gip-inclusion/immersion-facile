import React from "react";
import { Link } from "type-route";

import "./FixedStamp.css";

type FixedStampProps = {
  image: JSX.Element;
  overtitle?: JSX.Element | string;
  title?: JSX.Element | string;
  subtitle?: JSX.Element | string;
  link?: Link;
};

export const FixedStamp = ({
  image,
  title,
  subtitle,
  overtitle,
  link,
}: FixedStampProps) => (
  <aside className={"fixed-stamp"}>
    {image && <div className={"fixed-stamp__image-wrapper"}>{image}</div>}
    <div className={"fixed-stamp__content"}>
      {overtitle && (
        <span className={"fixed-stamp__overtitle"}>{overtitle}</span>
      )}
      {title && <span className={"fixed-stamp__title"}>{title}</span>}
      {subtitle && <span className={"fixed-stamp__subtitle"}>{subtitle}</span>}
    </div>
    {link && <a className="fixed-stamp__overlay-link" {...link} />}
  </aside>
);
