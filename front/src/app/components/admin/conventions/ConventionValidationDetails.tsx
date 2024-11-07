import { fr } from "@codegouvfr/react-dsfr";
import React, { ReactNode, useState } from "react";
import { ConventionRenewedInformations } from "react-design-system";
import { path, ConventionReadDto, isConventionRenewed } from "shared";
import { sections } from "src/app/contents/admin/conventionValidation";
import {
  ColField,
  FieldsAndTitle,
  RowFields,
} from "src/app/contents/admin/types";
import { useCopyButton } from "src/app/hooks/useCopyButton";
import { useStyles } from "tss-react/dsfr";
import type { ConventionValidationProps } from "./ConventionValidation";

const cellStyles = {
  overflow: "hidden",
  whitespace: "nowrap",
};

export const ConventionValidationDetails = ({
  convention,
}: ConventionValidationProps) => {
  const { copyButtonIsDisabled, copyButtonLabel, onCopyButtonClick } =
    useCopyButton("Copier");

  return (
    <>
      <h4>
        Convention{" "}
        <span className={fr.cx("fr-badge", "fr-badge--success")}>
          {convention.id}
        </span>
        <button
          disabled={copyButtonIsDisabled}
          onClick={() => onCopyButtonClick(convention.id)}
          className={fr.cx(
            "fr-btn",
            "fr-btn--sm",
            "fr-icon-clipboard-fill",
            "fr-btn--tertiary-no-outline",
            "fr-btn--icon-left",
            "fr-ml-1w",
          )}
          type="button"
        >
          {copyButtonLabel}
        </button>
      </h4>
      {isConventionRenewed(convention) && (
        <ConventionRenewedInformations renewed={convention.renewed} />
      )}
      {sections.map((list, index) => (
        <ConventionValidationSection
          // biome-ignore lint/suspicious/noArrayIndexKey: Index is ok here
          key={index}
          convention={convention}
          list={list}
          index={index}
        />
      ))}
    </>
  );
};

export const ConventionValidationSection = ({
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
    let value: React.ReactNode;
    if (field?.key) {
      value = path(field.key, convention) as string;
      if (field.getValue) {
        value = (
          <>
            {field.getValue?.(convention)}
            {field.copyButton?.(convention)}
          </>
        );
      }
    }

    return value;
  };

  const renderRows = (rowFields: RowFields[]) => {
    const relevantRows = rowFields.filter(
      (row) =>
        row.fields.filter((field) => {
          if (!field) return false;

          const pathValue = path(field.key, convention);
          const fieldValue = field?.getValue?.(convention);

          if (pathValue === undefined) return false;
          return fieldValue ?? pathValue;
        }).length,
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
                // biome-ignore lint/suspicious/noArrayIndexKey: Index is ok here
                <td key={index} />
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
                {list.cols?.map((col, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: Index is ok here
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
