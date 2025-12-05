import { fr } from "@codegouvfr/react-dsfr";
import type { InputProps } from "@codegouvfr/react-dsfr/Input";
import Select, {
  type GroupBase,
  type OptionProps,
  type Props as SelectProps,
} from "react-select";
import { useStyles } from "tss-react/dsfr";
import Styles from "./RSAutocomplete.styles";

export type OptionType<T> = { value: T; label: string };

export type RSAutocompleteProps<T, L> = InputProps.Common &
  InputProps.RegularInput & {
    selectProps?: SelectProps<
      OptionType<T>,
      false,
      GroupBase<OptionType<T>>
    > & {
      isDebouncing?: boolean;
    };
    initialInputValue?: string;
    locator: L;
    multiple?: boolean;
  };

type Capitalize<T extends string> = T extends `${infer First}${infer Rest}`
  ? `${Uppercase<First>}${Rest}`
  : T;

export type RSAutocompleteComponentProps<
  K extends string,
  T,
  L,
> = RSAutocompleteProps<T, L> &
  Record<`on${Capitalize<K>}Selected`, (value: T) => void> &
  Record<`on${Capitalize<K>}Clear`, () => void>;

export const prefix = "im-select";

export const RSAutocomplete = <T, L>({
  state,
  stateRelatedMessage,
  label,
  hintText,
  className,
  selectProps,
}: RSAutocompleteProps<T, L>) => {
  const { cx } = useStyles();
  const CustomizedOption = selectProps?.components?.Option;
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
        classNamePrefix={prefix}
        className={cx(
          `${prefix}`,
          state === "error" ? "im-select--has-error" : "",
        )}
        unstyled
        defaultInputValue={selectProps?.defaultInputValue}
        value={selectProps?.value}
        placeholder={selectProps?.placeholder}
        loadingMessage={selectProps?.loadingMessage || (() => <>...</>)}
        inputId={selectProps?.inputId}
        filterOption={() => true}
        classNames={{
          input: () =>
            fr.cx("fr-input", { "fr-input--error": state === "error" }),
          menu: () => cx(fr.cx("fr-menu", "fr-p-0", "fr-m-0"), Styles.menu),
          menuList: () =>
            cx(fr.cx("fr-menu__list", "fr-mb-0"), Styles.menuList),
          option: () => cx(fr.cx("fr-nav__link")),
          control: () => cx(fr.cx("fr-mt-1w")),
        }}
        components={{
          DropdownIndicator: () => null,
          ...(CustomizedOption
            ? {
                Option: (
                  props: OptionProps<
                    OptionType<T>,
                    false,
                    GroupBase<OptionType<T>>
                  >,
                ) => <CustomizedOption {...props} />,
              }
            : {}),
        }}
        noOptionsMessage={
          selectProps?.noOptionsMessage ||
          (({ inputValue }) => {
            if (inputValue.length < 3) return "Saisissez au moins 3 caractères";
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
      {state === "info" && (
        <p className="fr-info-text">{stateRelatedMessage}</p>
      )}
      {state === "error" && (
        <p className="fr-error-text">{stateRelatedMessage}</p>
      )}
    </div>
  );
};
