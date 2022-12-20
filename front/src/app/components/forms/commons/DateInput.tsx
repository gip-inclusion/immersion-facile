import { format } from "date-fns";
import { useField } from "formik";
import React from "react";
import { cleanStringToHTMLAttribute } from "shared";

type DateInputProps = {
  name: string;
  label: string;
  disabled?: boolean;
  onDateChange: (value: string) => void;
  max?: string;
};

export const DateInput = (props: DateInputProps) => {
  const [field, meta] = useField(props.name);

  return (
    <>
      <div
        className={`fr-input-group${
          meta.touched && meta.error ? " fr-input-group--error" : ""
        }`}
      >
        <label className="fr-label" htmlFor="text-input-calendar">
          {props.label}
        </label>
        <div>
          <input
            {...field}
            style={{
              backgroundColor: "var(--background-contrast-grey)",
              padding: "0.5rem 1rem",
              color: "var(--text-label-grey)",
              borderBottom: "2px solid #161616",
              minWidth: "200px",
            }}
            value={field.value && format(new Date(field.value), "yyyy-MM-dd")}
            type="date"
            disabled={props.disabled}
            aria-label={props.label}
            id={cleanStringToHTMLAttribute(props.name)}
            max={
              props.max ? format(new Date(props.max), "yyyy-MM-dd") : undefined
            }
            onChange={(event) => props.onDateChange(event.target.value)}
          />
        </div>
        {/*<div className="fr-input-wrap fr-fi-calendar-line">*/}
        {/*  <input*/}
        {/*    className={`fr-input${*/}
        {/*      meta.touched && meta.error ? " fr-input--error" : ""*/}
        {/*    }`}*/}
        {/*    {...field}*/}
        {/*    value={format(new Date(field.value), "yyyy-MM-dd")}*/}
        {/*    type="date"*/}
        {/*    disabled={props.disabled}*/}
        {/*    max={*/}
        {/*      props.max ? format(new Date(props.max), "yyyy-MM-dd") : undefined*/}
        {/*    }*/}
        {/*    onChange={(event) => props.onDateChange(event.target.value)}*/}
        {/*  />*/}
        {/*</div>*/}
        {meta.touched && meta.error && (
          <p id="text-input-email-error-desc-error" className="fr-error-text">
            {meta.error}
          </p>
        )}
      </div>
    </>
  );
};
