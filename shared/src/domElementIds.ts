import { frontRoutes } from "./routes/routes";

type FrontRoutesKeys = keyof typeof frontRoutes | "home" | "header" | "footer";
type FrontRouteValue = string | Record<string, string | Record<string, string>>;
type FrontRoutesValues = Record<string, FrontRouteValue>;

type DomElementIds = Record<FrontRoutesKeys, FrontRoutesValues>;

const buildHeaderNavLinkId = (chunk: string) => `im-header-nav__${chunk}`;
const buildHeroHeaderId = (chunk: string) => `im-hero-header__${chunk}`;
const buildSitemapNavLinkId = (chunk: string) => `im-sitemap-nav__${chunk}`;
const buildFooterNavLinkId = (chunk: string) => `im-footer-nav__${chunk}`;

export const domElementIds = {
  header: {
    navLinks: {
      home: buildHeaderNavLinkId("home"),
      candidate: {
        home: buildHeaderNavLinkId("candidate-home"),
        search: buildHeaderNavLinkId("candidate-search"),
        formConvention: buildHeaderNavLinkId("candidate-form-convention"),
      },
      establishment: {
        home: buildHeaderNavLinkId("establishment-home"),
        addEstablishmentForm: buildHeaderNavLinkId("establishment-form"),
        formConvention: buildHeaderNavLinkId("establishment-form-convention"),
      },
      agency: {
        home: buildHeaderNavLinkId("agency-home"),
        addAgencyForm: buildHeaderNavLinkId("agency-form"),
        formConvention: buildHeaderNavLinkId("agency-form-convention"),
      },
      admin: {
        backOffice: buildHeaderNavLinkId("admin-home"),
        emails: buildHeaderNavLinkId("admin-emails"),
        dashboard: buildHeaderNavLinkId("agency-my-dashboard"),
      },
    },
  },

  footer: {
    overFooterCols: {
      faq: buildFooterNavLinkId("over-faq"),
      linkedin: buildFooterNavLinkId("over-linkedin"),
      contact: buildFooterNavLinkId("over-contact"),
    },
    links: {
      gouv: buildFooterNavLinkId("gouv"),
      civilService: buildFooterNavLinkId("service-public"),
      inclusion: buildFooterNavLinkId("plateforme-inclusion"),
    },
    bottomLinks: {
      accessibility: buildFooterNavLinkId("accessibility"),
      legals: buildFooterNavLinkId("legals"),
      privacy: buildFooterNavLinkId("privacy"),
      cgu: buildFooterNavLinkId("cgu"),
      contact: buildFooterNavLinkId("contact"),
      stats: buildFooterNavLinkId("stats"),
      sitemap: buildFooterNavLinkId("sitemap"),
    },
  },

  home: {
    heroHeader: {
      candidate: buildHeroHeaderId("home-candidate"),
      establishment: buildHeroHeaderId("home-establishment"),
      agency: buildHeroHeaderId("home-agency"),
    },
  },

  homeEstablishments: {
    siretModal: {
      siretFetcherInput: "siret-fetcher-input",
    },
    heroHeader: {
      addEstablishmentForm: buildHeroHeaderId("establishment-form-register"),
      editEstablishmentForm: buildHeroHeaderId("establishment-form-edit"),
      formConvention: buildHeroHeaderId("establishment-form-convention"),
    },
  },
  homeAgencies: {
    heroHeader: {
      addAgencyForm: buildHeroHeaderId("agency-form-register"),
      formConvention: buildHeroHeaderId("agency-form-convention"),
    },
  },
  homeCandidates: {
    heroHeader: {
      search: buildHeroHeaderId("candidate-search"),
      formConvention: buildHeroHeaderId("candidate-form-convention"),
    },
  },

  search: {
    placeAutocompleteInput: "im-search-page__address-autocomplete",
    resultPerPageDropdown: "im-search-page__results-per-page-dropdown",
    appellationAutocomplete: "im-search-page__appellation-autocomplete",
    distanceSelect: "im-search-page__distance-dropdown",
    sortFilter: "radio-inline-legend",
    searchSubmitButton: "im-search__submit-search",
    searchSortOptionBase: "search-sort-option-",
    contactByMailButton: "im-contact-establishment__contact-email-button",
    contactByPhoneButton: "im-contact-establishment__contact-phone-button",
    contactInPersonButton: "im-contact-establishment__contact-in-person-button",
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
    logoUrlInput: "agency-logo-url",
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

  conventionImmersionRoute: {
    conventionSection: {
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
    beneficiarySection: {
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
    establishmentTutorSection: {
      firstName: "form-convention-establishmentTutor-firstName",
      lastName: "form-convention-establishmentTutor-lastName",
      email: "form-convention-establishmentTutor-email",
      phone: "form-convention-establishmentTutor-phone",
      job: "form-convention-establishmentTutor-job",
    },
    beneficiaryRepresentativeSection: {
      firstName:
        "form-convention-signatories-beneficiaryRepresentative-firstName",
      lastName:
        "form-convention-signatories-beneficiaryRepresentative-lastName",
      email: "form-convention-signatories-beneficiaryRepresentative-email",
      phone: "form-convention-signatories-beneficiaryRepresentative-phone",
    },
    beneficiaryCurrentEmployerSection: {
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
    establishmentRepresentativeSection: {
      firstName:
        "form-convention-signatories-establishmentRepresentative-firstName",
      lastName:
        "form-convention-signatories-establishmentRepresentative-lastName",
      email: "form-convention-signatories-establishmentRepresentative-email",
      phone: "form-convention-signatories-establishmentRepresentative-phone",
    },
  },

  manageConvention: {
    conventionValidationRejectButton: "im-convention-validation__reject-button",
    conventionValidationValidateButton:
      "im-convention-validation__validate-button",
    justificationModalCancelButton: "im-justification-modal__cancel-button",
    justificationModalSubmitButton: "im-justification-modal__submit-button",
  },

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
    assessmentFormDownloadButton: "im-assessment-form__download-button",
  },

  magicLinkRenewal: {
    magicLinkRenewalButton: "im-renew-page__renew-link-button",
  },

  standard: {
    siteMap: {
      home: buildSitemapNavLinkId("home"),
      candidateHome: buildSitemapNavLinkId("candidate-home"),
      establishmentHome: buildSitemapNavLinkId("establishment-home"),
      agencyHome: buildSitemapNavLinkId("agency-home"),
      search: buildSitemapNavLinkId("search"),
      coventionForm: buildSitemapNavLinkId("covention-form"),
      establishmentForm: buildSitemapNavLinkId("establishment-form"),
      agencyForm: buildSitemapNavLinkId("agency-form"),
      accessibility: buildSitemapNavLinkId("accessibility"),
      legals: buildSitemapNavLinkId("legals"),
      privacy: buildSitemapNavLinkId("privacy"),
      cgu: buildSitemapNavLinkId("cgu"),
      stats: buildSitemapNavLinkId("stats"),
    },
  },

  admin: {
    agencyTab: {
      activateAgencySelector: "agency-selector",
      editAgencyFormStatusSelector: "im-form-edit-agency__status-select",
      editAgencyFormSafirCodeInput: "im-form-edit-agency__safir-code-input",
      editAgencyFormEditSubmitButton: "im-form-edit-agency__submit-button",
    },
    emailPreviewTab: {
      emailTemplateNameSelect: "selectTemplateName",
      internshipKindSelect: "email-preview-internshipKind-select",
    },
    addEstablishmentByBatchTab: {
      groupNameInput: "groupName-input",
      inputFileInput: "inputFile-input",
    },
    adminPrivateRoute: {
      formLoginSubmitButton: "im-login__submit-button",
    },
  },

  conventionStatusDashboard: {},
  group: {},
  conventionDocument: {},
  landingEstablishment: {},
  conventionToSign: {},
  editFormEstablishmentRoute: {},
  error: {},
  conventionMiniStageRoute: {},
  agencyDashboard: {},
  manageConventionAdmin: {},
  manageConventionOld: {},
} satisfies DomElementIds;
