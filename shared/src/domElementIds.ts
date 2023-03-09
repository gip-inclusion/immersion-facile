import { frontRoutes } from "./routes/routes";

type FrontRoutesKeys = keyof typeof frontRoutes | "home" | "header" | "footer";
type FrontRouteValue = string | Record<string, string>;
type FrontRoutesValues = Record<string, FrontRouteValue>;

type DomElementIds = Record<FrontRoutesKeys, FrontRoutesValues>;

const getHeaderNavLinkId = (chunk: string) => `im-header-nav__${chunk}`;
const getHeroHeaderId = (chunk: string) => `im-hero-header__${chunk}`;
const getSitemapNavLinkId = (chunk: string) => `im-sitemap-nav__${chunk}`;
const getFooterNavLinkId = (chunk: string) => `im-footer-nav__${chunk}`;

export const domElementIds = {
  header: {
    home: getHeaderNavLinkId("home"),
    candidateIds: {
      home: getHeaderNavLinkId("candidate-home"),
      search: getHeaderNavLinkId("candidate-search"),
      formConvention: getHeaderNavLinkId("candidate-form-convention"),
    },
    establishmentIds: {
      home: getHeaderNavLinkId("establishment-home"),
      addEstablishmentForm: getHeaderNavLinkId("establishment-form"),
      formConvention: getHeaderNavLinkId("establishment-form-convention"),
    },
    agencyIds: {
      home: getHeaderNavLinkId("agency-home"),
      addAgencyForm: getHeaderNavLinkId("agency-form"),
      formConvention: getHeaderNavLinkId("agency-form-convention"),
    },
    adminIds: {
      backOffice: getHeaderNavLinkId("admin-home"),
      emails: getHeaderNavLinkId("admin-emails"),
      dashboard: getHeaderNavLinkId("agency-my-dashboard"),
    },
  },
  footer: {
    overFooterColsIds: {
      faq: getFooterNavLinkId("over-faq"),
      linkedin: getFooterNavLinkId("over-linkedin"),
      contact: getFooterNavLinkId("over-contact"),
    },
    linksIds: {
      gouv: getFooterNavLinkId("gouv"),
      civilService: getFooterNavLinkId("service-public"),
    },
    bottomsLinksIds: {
      accessibility: getFooterNavLinkId("accessibility"),
      legals: getFooterNavLinkId("legals"),
      privacy: getFooterNavLinkId("privacy"),
      cgu: getFooterNavLinkId("cgu"),
      contact: getFooterNavLinkId("contact"),
      stats: getFooterNavLinkId("stats"),
      sitemap: getFooterNavLinkId("sitemap"),
    },
  },
  admin: {
    agencyTab: {
      activateAgencySelector: "agency-selector",
      editAgencyformStatusSelector: "im-form-edit-agency__status-select",
      editAgencyformSafirCodeInput: "im-form-edit-agency__safir-code-input",
      editAgencyFormEditButton: "im-form-edit-agency__submit-button",
    },
    emailsPreviewTab: {
      emailTemplateNameSelect: "selectTemplateName",
      internshipKindSelect: "email-preview-internshipKind-select",
    },
    addEstablishmentByBatchTab: {
      groupNameInput: "groupName-input",
      inputFileInput: "inputFile-input",
    },
    adminPrivateRoute: {
      loginButton: "im-login__submit-button",
    },
  },
  addAgency: {
    uploadLogoInput: "file-upload-logo",
    id: "agency-id",
    nameInput: "agency-name",
    addressInput: {
      address: "agency-address",
      city: "agency-address-city",
      departmentCode: "agency-address-departementCode",
      postcode: "agency-address-postCode",
      streetNumberAndAddress: "agency-address-streetNumberAndAddress",
    },
    positionInput: "agency-position",
    logoUrlInput: "Cela permet de personnaliser les mails automatisés.",
    validatorEmailsInput: "agency-validator-emails",
    adminEmailsInput: "agency-adminEmails",
    signatureInput: "agency-signature",
    statusInput: "agency-status",
    kindSelect: "agency-kind",
    counsellorEmailsInput: "agency-counsellor-emails",
    codeSafirInput: "agency-codeSafir",
    questionnaireUrlInput: "agency-questionnaireUrl",
    agencySiretInput: "agency-agencySiret",
    stepsForValidationInput: "steps-for-validation",
    submitButton: "im-form-add-agency__submit-button",
  },
  agencyDashboard: {},
  conventionImmersionRoute: {
    conventionSectionIds: {
      agencyDepartment: "form-convention-agencyDepartement",
      agencyId: "form-convention-agencyId",
      dateStart: "form-convention-dateStart",
      dateEnd: "form-convention-dateStart",
      siret: "form-convention-siret",
      businessName: "form-convention-businessName",
      workConditions: "form-convention-workConditions",
      individualProtection: "form-convention-individualProtection",
      sanitaryPrevention: "form-convention-sanitaryPrevention",
      sanitaryPreventionDescription:
        "form-convention-sanitaryPreventionDescription",
      immersionAddress: "form-convention-workConditions",
      immersionObjective: "form-convention-immersionObjective",
      immersionAppellation: "form-convention-immersionAppellation",
      immersionActivities: "form-convention-immersionActivities",
      immersionSkills: "form-convention-immersionSkills",
      isCurrentEmployer: "form-convention-isCurrentEmployer",
      isEstablishmentTutorIsEstablishmentRepresentative:
        "form-convention-isEstablishmentTutorIsEstablishmentRepresentative",
      businessAdvantages: "form-convention-businessAdvantages",
      isMinor: "form-convention-isMinor",
    },
    beneficiarySectionIds: {
      firstName: "form-convention-signatories-beneficiary-firstName",
      lastName: "form-convention-signatories-beneficiary-lastName",
      birthdate: "form-convention-signatories-beneficiary-birthdate",
      email: "form-convention-signatories-beneficiary-email",
      phone: "form-convention-signatories-beneficiary-phone",
      levelOfEducation:
        "form-convention-signatories-beneficiary-level-of-education",
      financiaryHelp: "form-convention-signatories-beneficiary-financiary-help",
      federatedIdentity:
        "form-convention-signatories-beneficiary-federatedIdentity",
      emergencyContact:
        "form-convention-signatories-beneficiary-emergencyContact",
      emergencyContactPhone:
        "form-convention-signatories-beneficiary-emergencyContactPhone",
      emergencyContactEmail:
        "form-convention-signatories-beneficiary-emergencyContactEmail",
    },

    establishmentTutorSectionIds: {
      firstName: "form-convention-establishmentTutor-firstName",
      lastName: "form-convention-establishmentTutor-lastName",
      email: "form-convention-establishmentTutor-email",
      phone: "form-convention-establishmentTutor-phone",
      job: "form-convention-establishmentTutor-job",
    },

    beneficiaryRepresentativeSectionIds: {
      firstName:
        "form-convention-signatories-beneficiaryRepresentative-firstName",
      lastName:
        "form-convention-signatories-beneficiaryRepresentative-lastName",
      email: "form-convention-signatories-beneficiaryRepresentative-email",
      phone: "form-convention-signatories-beneficiaryRepresentative-phone",
    },

    beneficiaryCurrentEmployerSectionIds: {
      businessName:
        "form-convention-signatories-beneficiaryCurrentEmployer-businessName",
      job: "form-convention-signatories-beneficiaryCurrentEmployer-job",
      email: "form-convention-signatories-beneficiaryCurrentEmployer-email",
      phone: "form-convention-signatories-beneficiaryCurrentEmployer-phone",
      firstName:
        "form-convention-signatories-beneficiaryCurrentEmployer-firstName",
      lastName:
        "form-convention-signatories-beneficiaryCurrentEmployer-lastName",
      businessSiret:
        "form-convention-signatories-beneficiaryCurrentEmployer-businessSiret",
    },

    establishmentRepresentativeSectionIds: {
      firstName:
        "form-convention-signatories-establishmentRepresentative-firstName",
      lastName:
        "form-convention-signatories-establishmentRepresentative-lastName",
      email: "form-convention-signatories-establishmentRepresentative-email",
      phone: "form-convention-signatories-establishmentRepresentative-phone",
    },

    fieldsToExcludeIds: {
      agencyName: "",
      establishmentTutorRole: "",
      beneficiarySignedAt: "",
      beneficiaryRole: "",
      signatories: "",
      establishmentTutor: "",
      externalId: "",
      internshipKind: "",
      id: "",
      status: "",
      rejectionJustification: "",
      dateSubmission: "",
      establishmentRepresentativeSignedAt: "",
      establishmentRepresentativeRole: "",
      beneficiaryCurrentEmployerSignedAt: "",
      beneficiaryCurrentEmployerRole: "",
      beneficiaryRepresentativeSignedAt: "",
      beneficiaryRepresentativeRole: "",
      dateValidation: "",
      schedule: "",
    },
  },
  conventionMiniStageRoute: {},
  conventionToValidate: {
    conventionValidationRejectButton: "im-convention-validation__reject-button",
    conventionValidationValidateButton:
      "im-convention-validation__validate-button",
    justificationModalCancelBtn: "im-justification-modal__cancel-button",
    justificationModalSendBtn: "im-justification-modal__send-button",
  },
  conventionToSign: {},
  editFormEstablishmentRoute: {},
  error: {},
  establishment: {
    establishmentFormAddressAutocomplete:
      "autocomplete-address-creation-establishment-form",
    siret: "establishment-siret",
    businessName: "establishment-businessName",
    businessNameCustomized: "establishment-businessNameCustomized",
    businessAddress: "establishment-businessAddress",
    businessContact: {
      lastName: "establishment-businessContact-lastName",
      firstName: "establishment-businessContact-firstName",
      job: "establishment-businessContact-job",
      phone: "establishment-businessContact-phone",
      email: "establishment-businessContact-email",
      copyEmails: "establishment-businessContact-copyEmails",
      contactMethod: "establishment-businessContact-contactMethod",
    },
    isEngagedEnterprise: "establishment-isEngagedEnterprise",
    fitForDisabledWorkers: "establishment-fitForDisabledWorkers",
    appellations: "establishment-appellations",
    website: "establishment-website",
    additionalInformation: "establishment-additionalInformation",
    maxContactsPerWeek: "establishment-maxContactPerWeek",
    errorSiretAlreadyExistButton:
      "im-form-add-establishment__edit-establishment-button",
  },
  immersionAssessment: {
    assessmentFormSubmitButton: "im-assessment-form__submit-button",
    assessmentFormdownloadButton: "im-assessment-form__download-button",
  },
  landingEstablishment: {},
  magicLinkRenewal: {
    magicLinkRenewalButton: "im-renew-page__renew-link-button",
  },
  home: {
    heroHeadersIds: {
      candidate: getHeroHeaderId("home-candidate"),
      establishment: getHeroHeaderId("home-establishment"),
      agency: getHeroHeaderId("home-agency"),
    },
  },
  homeEstablishments: {
    siretModal: {
      siretFetcherInput: "siret-fetcher-input",
    },
    heroHeadersIds: {
      addEstablishmentForm: getHeroHeaderId("establishment-form-register"),
      editEstablishmentForm: getHeroHeaderId("establishment-form-edit"),
      formConvention: getHeroHeaderId("establishment-form-convention"),
    },
  },
  homeAgencies: {
    heroHeadersIds: {
      addAgencyForm: getHeroHeaderId("agency-form-register"),
      formConvention: getHeroHeaderId("agency-form-convention"),
    },
  },
  homeCandidates: {
    heroHeadersIds: {
      search: getHeroHeaderId("candidate-search"),
      formConvention: getHeroHeaderId("candidate-form-convention"),
    },
  },
  search: {
    placeAutocompleteInput: "im-search-page__address-autocomplete",
    resultPerPageDropdown: "im-search-page__results-per-page-dropdown",
    appellationAutocomplete: "im-search-page__appellation-autocomplete",
    distanceSelect: "im-search-page__distance-dropdown",
    sortRadioInlineLegend: "radio-inline-legend",
    searchButton: "im-search__submit-search",
    searchSortOption: "search-sort-option-",
    contactByMailButton: "im-contact-establishment__contact-email-button",
    contactByPhoneButton: "im-contact-establishment__contact-phone-button",
    contactInPersonButton: "im-contact-establishment__contact-in-person-button",
  },
  standard: {
    siteMapIds: {
      home: getSitemapNavLinkId("home"),
      candidateHome: getSitemapNavLinkId("candidate-home"),
      establishmentHome: getSitemapNavLinkId("establishment-home"),
      agencyHome: getSitemapNavLinkId("agency-home"),
      search: getSitemapNavLinkId("search"),
      coventionForm: getSitemapNavLinkId("covention-form"),
      establishmentForm: getSitemapNavLinkId("establishment-form"),
      agencyForm: getSitemapNavLinkId("agency-form"),
      accessibility: getSitemapNavLinkId("accessibility"),
      legals: getSitemapNavLinkId("legals"),
      privacy: getSitemapNavLinkId("privacy"),
      cgu: getSitemapNavLinkId("cgu"),
      stats: getSitemapNavLinkId("stats"),
    },
  },
  conventionStatusDashboard: {},
  group: {},
} satisfies DomElementIds;
