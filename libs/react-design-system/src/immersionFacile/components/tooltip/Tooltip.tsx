import React, { useId } from "react";

export type TooltipProps =
  | {
      type: "click";
      description: string;
      id?: string;
      className?: string;
    }
  | {
      type: "hover";
      elementToDescribe: React.ReactElement;
      description: string;
      id?: string;
      className?: string;
    };

export const Tooltip = (props: TooltipProps) => {
  const id = props.id ?? `tooltip-${useId()}`;

  return (
    <>
      {props.type === "hover" && (
        <span>
          {React.cloneElement(props.elementToDescribe, {
            "aria-describedby": id,
          })}
          <span
            className={`fr-tooltip fr-placement ${
              props.className ? props.className : ""
            }`}
            id={id}
            role="tooltip"
            aria-hidden="true"
          >
            {props.description}
          </span>
        </span>
      )}
      {props.type === "click" && (
        <span>
          <button
            className="fr-btn--tooltip fr-btn"
            aria-describedby={id}
            type="button"
          >
            Plus d'information ?
          </button>
          <span
            className={`fr-tooltip fr-placement ${
              props.className ? props.className : ""
            }`}
            id={id}
            role="tooltip"
            aria-hidden="true"
          >
            {props.description}
          </span>
        </span>
      )}
    </>
  );
};
