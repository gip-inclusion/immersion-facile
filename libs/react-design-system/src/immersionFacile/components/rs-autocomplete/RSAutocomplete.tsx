import { fr } from "@codegouvfr/react-dsfr";
import type { InputProps } from "@codegouvfr/react-dsfr/Input";

import Select, {
  type Props as SelectProps,
  type GroupBase,
} from "react-select";
import { useStyles } from "tss-react/dsfr";
import Styles from "./RSAutocomplete.styles";

export type OptionType<T> = { value: T; label: string };

export type RSAutocompleteProps<T> = InputProps.Common &
  InputProps.RegularInput & {
    selectProps?: SelectProps<
      OptionType<T>,
      false,
      GroupBase<OptionType<T>>
    > & {
      isDebouncing?: boolean;
    };
    initialInputValue?: string;
  };

type Capitalize<T extends string> = T extends `${infer First}${infer Rest}`
  ? `${Uppercase<First>}${Rest}`
  : T;

export type RSAutocompleteComponentProps<
  K extends string,
  T,
> = RSAutocompleteProps<T> &
  Record<`on${Capitalize<K>}Selected`, (value: T) => void> &
  Record<`on${Capitalize<K>}Clear`, () => void>;

export const prefix = "im-select";

export const RSAutocomplete = <T,>({
  state,
  stateRelatedMessage,
  label,
  hintText,
  className,
  selectProps,
}: RSAutocompleteProps<T>) => {
  const hasError = state === "error";
  const { cx } = useStyles();
  return (
    <div
      className={cx(fr.cx("fr-input-group"), className)}
      id={selectProps?.id ?? `${selectProps?.inputId}-wrapper`}
    >
      <label className={fr.cx("fr-label")} htmlFor={selectProps?.inputId}>
        {label}
        {hintText && <span className="fr-hint-text">{hintText}</span>}
      </label>
      <Select
        {...selectProps}
        onInputChange={(value, actionMeta) => {
          if (actionMeta.action === "input-change") {
            selectProps?.onInputChange?.(value, actionMeta);
          }
        }}
        classNamePrefix={prefix}
        className={cx(`${prefix}`, hasError ? "im-select--has-error" : "")}
        unstyled
        defaultInputValue={selectProps?.defaultInputValue}
        value={selectProps?.value}
        placeholder={selectProps?.placeholder}
        loadingMessage={selectProps?.loadingMessage || (() => <>...</>)}
        inputId={selectProps?.inputId}
        filterOption={() => true}
        classNames={{
          input: () => fr.cx("fr-input", { "fr-input--error": hasError }),
          menu: () => cx(fr.cx("fr-menu", "fr-p-0", "fr-m-0"), Styles.menu),
          menuList: () => cx(fr.cx("fr-menu__list"), Styles.menuList),
          option: () => cx(fr.cx("fr-nav__link")),
        }}
        components={{
          DropdownIndicator: () => null,
        }}
        noOptionsMessage={
          selectProps?.noOptionsMessage ||
          (({ inputValue }) => {
            if (inputValue.length < 3)
              return <>Saisissez au moins 3 caractères</>;
            if (selectProps?.isLoading || selectProps?.isDebouncing)
              return selectProps?.loadingMessage ? (
                selectProps.loadingMessage({ inputValue })
              ) : (
                <>Recherche en cours...</>
              );
            return <>Aucune suggestion trouvée pour {inputValue}</>;
          })
        }
        hideSelectedOptions
        isClearable
        id={`${selectProps?.inputId}-wrapper`}
      />

      {hasError && <p className="fr-error-text">{stateRelatedMessage}</p>}
    </div>
  );
};
