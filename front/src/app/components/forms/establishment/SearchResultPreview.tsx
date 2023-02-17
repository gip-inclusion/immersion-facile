import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import { SearchResult } from "../../search/SearchResult";
import { FormEstablishmentDto, SearchImmersionResultDto } from "shared";

const establishmentToSearchResultPreview = (
  establishment: FormEstablishmentDto,
): SearchImmersionResultDto => ({
  ...establishment,
  rome:
    establishment.appellations.length > 0
      ? establishment.appellations[0].romeCode
      : "",
  romeLabel:
    establishment.appellations.length > 0
      ? establishment.appellations[0].romeLabel
      : "",
  appellationLabels: establishment.appellations.map(
    (appellation) => appellation.appellationLabel,
  ),
  nafLabel: establishment.naf?.nomenclature || "",
  naf: establishment.naf?.code || "",
  name:
    establishment.businessNameCustomized ||
    establishment.businessName ||
    "Mon entreprise",
  // Fake data
  voluntaryToImmersion: true,
  position: {
    lat: 0,
    lon: 0,
  },
  address: {
    streetNumberAndAddress: establishment.businessAddress,
    city: "",
    departmentCode: "",
    postcode: "",
  },
});

type SearchResultPreviewProps = {
  establishment: FormEstablishmentDto;
};

export const SearchResultPreview = ({
  establishment,
}: SearchResultPreviewProps) => {
  const { cx } = useStyles();
  return (
    <section className={cx("im-establishment-preview")}>
      <h2 className={fr.cx("fr-text--lead", "fr-mb-2w")}>
        Prévisualisation de votre entreprise
      </h2>
      <p className={fr.cx("fr-hint-text")}>
        Voici un exemple d'aperçu de votre entreprise, tel qu'il apparaitra dans
        notre moteur de recherche
      </p>
      <div
        className={cx(
          fr.cx("fr-grid-row", "fr-mb-4w"),
          "im-establishment-preview__inner",
        )}
      >
        <SearchResult
          establishment={establishmentToSearchResultPreview(establishment)}
          preview
          layout="fr-col-md-6"
        />
      </div>
    </section>
  );
};
