import React, { ReactNode, useRef, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import { ConventionReadDto, path } from "shared";
import { sections } from "src/app/contents/admin/conventionValidation";
import {
  ColField,
  FieldsAndTitle,
  RowFields,
} from "src/app/contents/admin/types";
import type { ConventionValidationProps } from "./ConventionValidation";

const cellStyles = {
  overflow: "hidden",
  whitespace: "nowrap",
};

export const ConventionValidationDetails = ({
  convention,
}: ConventionValidationProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const onCopyButtonClick = () => {
    navigator.clipboard
      .writeText(convention.id)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 3_000);
      })
      // eslint-disable-next-line no-console
      .catch((error) => console.error(error));
  };

  return (
    <>
      <h4>
        Convention{" "}
        <span className={fr.cx("fr-badge", "fr-badge--success")}>
          {convention.id}
        </span>
        <button
          disabled={isCopied}
          onClick={onCopyButtonClick}
          className={fr.cx(
            "fr-btn",
            "fr-btn--sm",
            "fr-icon-clipboard-fill",
            "fr-btn--tertiary-no-outline",
            "fr-btn--icon-left",
            "fr-ml-1w",
          )}
        >
          {isCopied ? "Copié !" : "Copier cet ID"}
        </button>
      </h4>
      {sections.map((list, index) => (
        <ConventionValidationSection
          key={index}
          convention={convention}
          list={list}
          index={index}
        />
      ))}
    </>
  );
};

const ConventionValidationSection = ({
  convention,
  list,
  index,
}: {
  convention: ConventionReadDto;
  list: FieldsAndTitle;
  index: number;
}) => {
  const { cx } = useStyles();
  const [markedAsRead, setMarkedAsRead] = useState<boolean>(false);
  const buildContent = (field: ColField): ReactNode => {
    let value;
    if (field && field.key) {
      value = path(field.key, convention) as string;
      if (field.value) {
        value = field.value(convention);
      }
    }
    return value;
  };
  const renderRows = (rowFields: RowFields[]) => {
    const relevantRows = rowFields.filter(
      (row) =>
        row.fields.filter(
          (field) =>
            (field && path(field.key, convention) !== undefined) ||
            (field &&
              field.key === "additionnalInfos" &&
              path(field.key, convention) !== undefined),
        ).length,
    );

    return relevantRows.map(
      (row, index) =>
        row.fields.length > 0 && (
          <tr key={row.title ?? index}>
            {row.title && (
              <td style={cellStyles}>
                <strong>{row.title}</strong>
              </td>
            )}

            {row.fields.map((field, index) =>
              field ? (
                <td key={field.key} style={cellStyles}>
                  {buildContent(field)}
                </td>
              ) : (
                <td key={index}></td>
              ),
            )}
          </tr>
        ),
    );
  };
  return (
    <div
      className={cx(
        fr.cx("fr-table", "fr-table--bordered"),
        list.additionalClasses,
      )}
      key={list.listTitle}
    >
      <table>
        <caption
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {list.listTitle}
          <div className={fr.cx("fr-toggle")}>
            <input
              type="checkbox"
              onChange={() => setMarkedAsRead((read) => !read)}
              className={fr.cx("fr-toggle__input")}
              id={`fr-toggle__input-${index}`}
              checked={markedAsRead}
            />
            <label
              className={fr.cx("fr-toggle__label")}
              htmlFor={`fr-toggle__input-${index}`}
            >
              {markedAsRead ? "Vérifier à nouveau" : "Marquer comme vu"}
            </label>
          </div>
        </caption>

        {!markedAsRead && (
          <>
            <thead>
              <tr>
                {list.cols &&
                  list.cols?.map((col, index) => (
                    <th key={index} scope="col">
                      {col}
                    </th>
                  ))}
                {!list.cols &&
                  list.rowFields[0] &&
                  list.rowFields[0].fields.map((field) =>
                    field ? (
                      <th key={field.key} scope="col">
                        {field.colLabel}
                      </th>
                    ) : null,
                  )}
              </tr>
            </thead>
            <tbody>{renderRows(list.rowFields)}</tbody>
          </>
        )}
      </table>
    </div>
  );
};
