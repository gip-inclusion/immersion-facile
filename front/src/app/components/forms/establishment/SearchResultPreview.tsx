import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import { SearchResult } from "../../search/SearchResult";
import { FormEstablishmentDto, SearchImmersionResultDto } from "shared";

const establishmentToSearchResultPreview = ({
  appellations,
  naf,
  businessNameCustomized,
  businessName,
  businessAddress,
  siret,
  website,
  fitForDisabledWorkers,
  additionalInformation,
}: FormEstablishmentDto): SearchImmersionResultDto => ({
  rome: appellations.length > 0 ? appellations[0].romeCode : "",
  romeLabel: appellations.length > 0 ? appellations[0].romeLabel : "",
  appellationLabels: appellations.map(
    (appellation) => appellation.appellationLabel,
  ),
  nafLabel: "",
  naf: naf?.code || "",
  name: businessNameCustomized || businessName || "Mon entreprise",
  // Fake data
  voluntaryToImmersion: true,
  position: {
    lat: 0,
    lon: 0,
  },
  address: {
    streetNumberAndAddress: businessAddress,
    city: "",
    departmentCode: "",
    postcode: "",
  },
  siret,
  website,
  fitForDisabledWorkers,
  additionalInformation,
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
