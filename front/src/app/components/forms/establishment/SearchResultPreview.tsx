import { fr } from "@codegouvfr/react-dsfr";
import { FormEstablishmentDto, SearchResultDto } from "shared";
import { useStyles } from "tss-react/dsfr";
import { SearchResult } from "../../search/SearchResult";

const establishmentToSearchResultPreview = ({
  appellations,
  naf,
  businessNameCustomized,
  businessName,
  businessAddresses,
  siret,
  website,
  fitForDisabledWorkers,
  additionalInformation,
}: FormEstablishmentDto): SearchResultDto => ({
  rome: appellations.length > 0 ? appellations[0].romeCode : "",
  romeLabel: appellations.length > 0 ? appellations[0].romeLabel : "",
  appellations,
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
    streetNumberAndAddress: businessAddresses[0]?.rawAddress ?? "",
    city: "",
    departmentCode: "",
    postcode: "",
  },
  siret,
  website,
  fitForDisabledWorkers,
  additionalInformation,
  locationId: "",
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
