import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import {
  Pagination,
  type PaginationProps,
} from "@codegouvfr/react-dsfr/Pagination";
import { Table, type TableProps } from "@codegouvfr/react-dsfr/Table";
import { useBreakpointsValuesPx } from "@codegouvfr/react-dsfr/useBreakpointsValuesPx";
import { useLayoutEffect, useState } from "react";
import { useStyles } from "tss-react/dsfr";
import { Loader } from "../loader";
import { RichDropdown, type RichDropdownProps } from "../rich-dropdown";
import Styles from "./RichTable.styles";

type RichTableProps = {
  headers: TableProps["headers"];
  data: TableProps["data"];
  dropdownFilters?: {
    items: RichDropdownProps[];
    onSubmit: () => void;
  };
  searchBar: {
    label: string;
    placeholder: string;
    onSubmit: (value: string) => void;
  };
  pagination: PaginationProps;
  isLoading: boolean;
  className?: string;
};

export const RichTable = ({
  headers,
  data,
  dropdownFilters,
  searchBar,
  pagination,
  isLoading,
  className,
}: RichTableProps) => {
  const { cx } = useStyles();
  const {
    breakpointsValues: { lg: lgBreakpoint },
  } = useBreakpointsValuesPx();
  const [isFixedOnDesktop, setIsFixedOnDesktop] = useState(
    window.matchMedia(`(min-width: ${lgBreakpoint}px)`).matches,
  );
  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${lgBreakpoint}px)`);
    mediaQuery.addEventListener("change", () =>
      setIsFixedOnDesktop(mediaQuery.matches),
    );
    return () => {
      mediaQuery.removeEventListener("change", () =>
        setIsFixedOnDesktop(mediaQuery.matches),
      );
    };
  }, [lgBreakpoint]);
  return (
    <section
      role="tabpanel"
      aria-label="Listing des candidatures"
      className={cx(Styles.root, className)}
    >
      {isLoading && <Loader />}
      <header className={cx(Styles.header)}>
        {dropdownFilters && (
          <form
            onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              dropdownFilters.onSubmit();
            }}
            className={cx(Styles.dropdowns)}
          >
            {dropdownFilters?.items.map((dropdownFilter) => (
              <RichDropdown
                {...dropdownFilter}
                as="Button"
                key={dropdownFilter.id}
              />
            ))}
          </form>
        )}

        <form
          onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const query = formData.get("search");
            if (query && typeof query === "string") {
              searchBar.onSubmit(query);
            }
          }}
          className={fr.cx("fr-grid-row", "fr-search-bar")}
        >
          <Input
            label={searchBar.label}
            nativeInputProps={{
              placeholder: searchBar.placeholder,
              role: "search",
              name: "search",
            }}
            className={fr.cx("fr-mb-0")}
          />
          <Button type="submit">Rechercher</Button>
        </form>
      </header>

      <Table
        headers={headers}
        data={data}
        bordered={false}
        fixed={isFixedOnDesktop}
      />
      <Pagination {...pagination} />
    </section>
  );
};
