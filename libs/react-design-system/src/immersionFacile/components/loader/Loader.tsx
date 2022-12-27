import React from "react";
import "./Loader.scss";

const componentName = "im-loader";
export const Loader = () => (
  <div className={componentName} aria-live="polite">
    <div className={`${componentName}__overlay`}></div>
    <div className={`${componentName}__spinner`}>
      <span
        className={`${componentName}__spinner-icon fr-icon-refresh-line`}
      ></span>
      <span className={`${componentName}__spinner-text fr-sr-only`}>
        Chargement en cours...
      </span>
    </div>
  </div>
);
