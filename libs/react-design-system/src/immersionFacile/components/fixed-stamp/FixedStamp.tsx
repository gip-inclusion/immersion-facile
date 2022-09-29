import React from "react";

type FixedStampProps = {
  image?: JSX.Element;
  overtitle?: JSX.Element | string;
  title?: JSX.Element | string;
  subtitle?: JSX.Element | string;
};

export const FixedStamp = ({
  image,
  title,
  subtitle,
  overtitle,
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
  </aside>
);
