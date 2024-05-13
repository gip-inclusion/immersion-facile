import { frontRoutes } from "./routes/routes";

type FrontRoutesKeys = keyof typeof frontRoutes | "home" | "header" | "footer";

type FrontRouteParametrizedKeys = "mode" | "currentStep";

type FrontRouteParametrizedValue = (
  params: Partial<Record<FrontRouteParametrizedKeys, string | number>>,
) => string;

type FrontRoutePossibleValues =
  | Record<
      string,
      string | FrontRouteParametrizedValue | Record<string, string>
    >
  | string
  | FrontRouteParametrizedValue;

type FrontRouteValue<V extends FrontRoutePossibleValues> = V extends Record<
  string,
  string
>
  ? FrontRouteValue<V>
  : V;

type FrontRoutesValues = Record<
  string,
  string | FrontRouteValue<FrontRoutePossibleValues>
>;

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
        dashboard: buildHeaderNavLinkId("establishment-dashboard"),
      },
      agency: {
        home: buildHeaderNavLinkId("agency-home"),
        addAgencyForm: buildHeaderNavLinkId("agency-form"),
        formConvention: buildHeaderNavLinkId("agency-form-convention"),
        dashboard: buildHeaderNavLinkId("agency-my-dashboard"),
      },
      admin: {
        backOffice: buildHeaderNavLinkId("admin-home"),
        emails: buildHeaderNavLinkId("admin-emails"),
      },
    },
  },

  footer: {
    overFooterCols: {
      faq: buildFooterNavLinkId("over-faq"),
      linkedin: buildFooterNavLinkId("over-linkedin"),
      contact: buildFooterNavLinkId("over-contact"),
    },
    navTopGroupLinks: {
      search: buildFooterNavLinkId("footer-nav-top-candidate-search"),
      formConvention: buildFooterNavLinkId("footer-nav-top-form-convention"),
      addEstablishmentForm: buildFooterNavLinkId(
        "footer-nav-top-establishement-form-convention",
      ),
      establishementformConvention: buildFooterNavLinkId(
        "footer-nav-top-establishement-form-convention",
      ),
      addAgencyForm: buildFooterNavLinkId("footer-nav-top-agency-form"),
      agencyformConvention: buildFooterNavLinkId(
        "footer-nav-top-agency-form-convention",
      ),
      linkedin: buildFooterNavLinkId("footer-nav-top-linkedin"),
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
      budget: buildFooterNavLinkId("budget"),
      apiDocumentation: buildFooterNavLinkId("api-documentation"),
      communicationKit: buildFooterNavLinkId("communication-kit"),
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
      editEstablishmentButton: "edit-establishment-button",
    },
    heroHeader: {
      addEstablishmentForm: buildHeroHeaderId("establishment-form-register"),
      formConvention: buildHeroHeaderId("establishment-form-convention"),
      establishmentDashboard: buildHeroHeaderId("establishment-dashboard"),
    },
  },
  homeAgencies: {
    heroHeader: {
      addAgencyForm: buildHeroHeaderId("agency-form-register"),
      formConvention: buildHeroHeaderId("agency-form-convention"),
      agencyDashboard: buildHeroHeaderId("agency-dashboard"),
    },
  },
  homeCandidates: {
    heroHeader: {
      search: buildHeroHeaderId("candidate-search"),
      formConvention: buildHeroHeaderId("candidate-form-convention"),
    },
  },

  search: {
    searchForm: "im-search-page__search-form",
    placeAutocompleteInput: "im-search-page__address-autocomplete",
    resultPerPageDropdown: "im-search-page__results-per-page-dropdown",
    appellationAutocomplete: "im-search-page__appellation-autocomplete",
    distanceSelect: "im-search-page__distance-dropdown",
    sortFilter: "radio-inline-legend",
    searchSubmitButton: "im-search__submit-search",
    searchSortOptionBase: "im-search__search-sort-option-",
    lbbSearchResultButton: "im-search-result__lbb-contact-button",
    searchResultButton: "im-search-result__contact-button",
    contactByMailButton: "im-contact-establishment__contact-email-button",
    contactByMailCancelButton:
      "im-contact-establishment__contact-email-cancel-button",
    contactByPhoneButton: "im-contact-establishment__contact-phone-button",
    contactInPersonButton: "im-contact-establishment__contact-in-person-button",
  },
  addAgency: {
    form: "im-form-add-agency",
    uploadLogoInput: "im-form-add-agency__file-upload-logo",
    id: "im-form-add-agency__id",
    coveredDepartmentsInput: "im-form-add-agency__covered-departments",
    nameInput: "im-form-add-agency__name",
    addressInput: {
      address: "im-form-add-agency__address",
      city: "im-form-add-agency__address-city",
      departmentCode: "im-form-add-agency__address-departement-code",
      postcode: "im-form-add-agency__address-postcode",
      streetNumberAndAddress:
        "im-form-add-agency__address-street-number-and-address",
    },
    positionInput: "im-form-add-agency__position",
    logoUrlInput: "im-form-add-agency__logo-url",
    validatorEmailsInput: "im-form-add-agency__validator-emails",
    adminEmailsInput: "im-form-add-agency__admin-emails",
    signatureInput: "im-form-add-agency__signature",
    statusInput: "im-form-add-agency__status",
    kindSelect: "im-form-add-agency__kind",
    counsellorEmailsInput: "im-form-add-agency__counsellor-emails",
    codeSafirInput: "im-form-add-agency__code-safir",
    questionnaireUrlInput: "im-form-add-agency__questionnaire-url",
    agencySiretInput: "im-form-add-agency__agency-siret",
    agencyRefersToInput:
      "im-form-add-agency__im-form-add-agency__refers-to-agency-input",
    stepsForValidationInput: "im-form-add-agency__steps-for-validation",
    submitButton: "im-form-add-agency__submit-button",
    refersToAgencyId: "im-form-add-agency__refers-to-agency-id",
    addressAutocomplete: "im-form-add-agency__address-autocomplete-input",
  },

  conventionImmersionRoute: {
    form: (params) => `im-convention-immersion-form--${params.mode}`,
    shareForm: "im-convention-form__share-form",
    shareFormSubmitButton: "im-convention-form__share-form-submit-button",
    copyLinkButton: "im-convention-form__copy-link-button",
    showFormButton: "im-convention-form__show-form-button",
    initiateConventionSection: {
      ftConnectButton: "im-convention-form__initiate__ft-connect-button",
      showFormButton: "im-convention-form__initiate__show-form-button",
      iHaveAProblemButton:
        "im-convention-form__initiate__i-have-a-problem-button",
      canIFillOnline: "im-convention-form__initiate__can-i-fill-online-link",
    },
    submitFormButton: "im-convention-form__submit-form-button",
    submitFormButtonMobile: "im-convention-form__submit-form-button--mobile",
    confirmSubmitFormButton: "im-convention-form__confirm-submit-form-button",
    summaryEditButton: "im-convention-form__summary-edit-button",
    conventionSection: {
      agencyDepartment: "im-convention-form__agencyDepartement",
      agencyId: "im-convention-form__agencyId",
      agencyKind: "im-convention-form__agencyKind",
      dateStart: "im-convention-form__dateStart",
      dateEnd: "im-convention-form__dateEnd",
      addHoursButton: "im-convention-form__add-hours-button",
      siret: "im-convention-form__siret",
      businessName: "im-convention-form__businessName",
      workConditions: "im-convention-form__workConditions",
      individualProtection: "im-convention-form__individualProtection",
      sanitaryPrevention: "im-convention-form__sanitaryPrevention",
      sanitaryPreventionDescription:
        "im-convention-form__sanitaryPreventionDescription",
      immersionAddress: "im-convention-form__immersionAddress",
      immersionObjective: "im-convention-form__immersionObjective",
      immersionAppellation: "im-convention-form__immersionAppellation",
      immersionActivities: "im-convention-form__immersionActivities",
      immersionSkills: "im-convention-form__immersionSkills",
      isCurrentEmployer: "im-convention-form__isCurrentEmployer",
      isEstablishmentTutorIsEstablishmentRepresentative:
        "im-convention-form__isEstablishmentTutorIsEstablishmentRepresentative",
      businessAdvantages: "im-convention-form__businessAdvantages",
      isMinor: "im-convention-form__isMinor",
    },
    beneficiarySection: {
      firstName: "im-convention-form__signatories-beneficiary-firstName",
      lastName: "im-convention-form__signatories-beneficiary-lastName",
      birthdate: "im-convention-form__signatories-beneficiary-birthdate",
      email: "im-convention-form__signatories-beneficiary-email",
      phone: "im-convention-form__signatories-beneficiary-phone",
      levelOfEducation:
        "im-convention-form__signatories-beneficiary-level-of-education",
      schoolName: "im-convention-form__signatories-beneficiary-school-name",
      schoolPostcode:
        "im-convention-form__signatories-beneficiary-school-postcode",
      financiaryHelp:
        "im-convention-form__signatories-beneficiary-financiary-help",
      federatedIdentity:
        "im-convention-form__signatories-beneficiary-federatedIdentity",
      emergencyContact:
        "im-convention-form__signatories-beneficiary-emergencyContact",
      emergencyContactPhone:
        "im-convention-form__signatories-beneficiary-emergencyContactPhone",
      emergencyContactEmail:
        "im-convention-form__signatories-beneficiary-emergencyContactEmail",
      isRqth: "im-convention-form__signatories-beneficiary-isRqth",
    },
    establishmentTutorSection: {
      firstName: "im-convention-form__establishmentTutor-firstName",
      lastName: "im-convention-form__establishmentTutor-lastName",
      email: "im-convention-form__establishmentTutor-email",
      phone: "im-convention-form__establishmentTutor-phone",
      job: "im-convention-form__establishmentTutor-job",
    },
    beneficiaryRepresentativeSection: {
      firstName:
        "im-convention-form__signatories-beneficiaryRepresentative-firstName",
      lastName:
        "im-convention-form__signatories-beneficiaryRepresentative-lastName",
      email: "im-convention-form__signatories-beneficiaryRepresentative-email",
      phone: "im-convention-form__signatories-beneficiaryRepresentative-phone",
    },
    beneficiaryCurrentEmployerSection: {
      businessName:
        "im-convention-form__signatories-beneficiaryCurrentEmployer-businessName",
      job: "im-convention-form__signatories-beneficiaryCurrentEmployer-job",
      email: "im-convention-form__signatories-beneficiaryCurrentEmployer-email",
      phone: "im-convention-form__signatories-beneficiaryCurrentEmployer-phone",
      firstName:
        "im-convention-form__signatories-beneficiaryCurrentEmployer-firstName",
      lastName:
        "im-convention-form__signatories-beneficiaryCurrentEmployer-lastName",
      businessSiret:
        "im-convention-form__signatories-beneficiaryCurrentEmployer-businessSiret",
      businessAddress:
        "im-convention-form__signatories-beneficiaryCurrentEmployer-businessAddress",
    },
    establishmentRepresentativeSection: {
      firstName:
        "im-convention-form__signatories-establishmentRepresentative-firstName",
      lastName:
        "im-convention-form__signatories-establishmentRepresentative-lastName",
      email:
        "im-convention-form__signatories-establishmentRepresentative-email",
      phone:
        "im-convention-form__signatories-establishmentRepresentative-phone",
    },
    shareButton: "im-convention-form__share-button",
    deleteHoursButton: "im-convention-form__delete-hours-button",
  },

  manageConvention: {
    conventionValidationRejectButton: "im-convention-validation__reject-button",
    conventionValidationValidateButton:
      "im-convention-validation__validate-button",
    conventionValidationRequestEditButton:
      "im-convention-validation__request-edit-button",
    conventionValidationCancelButton: "im-convention-validation__cancel-button",
    conventionValidationDeprecateButton:
      "im-convention-validation__deprecate-button",
    justificationModalCancelButton: "im-justification-modal__cancel-button",
    justificationModalSubmitButton: "im-justification-modal__submit-button",
    justificationModalResendButton: "im-justification-modal__resend-button",
    justificationModalRequestEditButton:
      "im-justification-modal__request-edit-button",
    validatorModalCancelButton: "im-validator-modal__cancel-button",
    validatorModalSubmitButton: "im-validator-modal__submit-button",
    modifierRoleSelect: "im-validator-modal__modifier-role-select",
    draftModal: "im-justification-modal",
    rejectedModal: "im-rejected-modal",
    deprecatedModal: "im-deprecate-modal",
    validatorModal: "im-validator-modal",
    cancelModal: "im-cancel-modal",
    renewModal: "im-renew-modal",
    openSignModalButton: "im-convention-validation__open-sign-modal-button",
    submitSignModalButton: "im-convention-validation__submit-sign-modal-button",
    submitRenewModalButton:
      "im-convention-validation__submit-renew-modal-button",
    openRenewModalButton: "im-convention-validation__open-renew-modal-button",
    openDocumentButton: "im-convention-validation__open-document-button",
    validatorModalLastNameInput: "im-validator-modal__last-name-input",
    validatorModalFirstNameInput: "im-validator-modal__first-name-input",
  },

  unsubscribeEstablishmentLead: {},

  establishment: {
    create: {
      form: "im-form-create-establishment",
      addressAutocomplete:
        "im-form-create-establishment__autocomplete-address-creation-establishment-form",
      siret: "im-form-create-establishment__siret",
      businessName: "im-form-create-establishment__business-name",
      businessNameCustomized:
        "im-form-create-establishment__business-name-customized",
      businessAddresses: "im-form-create-establishment__business-addresses",
      businessContact: {
        lastName: "im-form-create-establishment__business-contact-last-name",
        firstName: "im-form-create-establishment__business-contact-first-name",
        job: "im-form-create-establishment__businessContact-job",
        phone: "im-form-create-establishment__businessContact-phone",
        email: "im-form-create-establishment__businessContact-email",
        copyEmails: "im-form-create-establishment__businessContact-copy-emails",
        contactMethod:
          "im-form-create-establishment__businessContact-contact-method",
      },
      isEngagedEnterprise:
        "im-form-create-establishment__is-engaged-enterprise",
      fitForDisabledWorkers:
        "im-form-create-establishment__fit-for-disabled-workers",
      appellations: "im-form-create-establishment__appellations",
      website: "im-form-create-establishment__website",
      additionalInformation:
        "im-form-create-establishment__additional-information",
      maxContactsPerWeek: "im-form-create-establishment__max-contact-per-week",
      maxContactsPerWeekWhenAvailable:
        "im-form-create-establishment__max-contact-per-week-when-available",
      errorSiretAlreadyExistButton:
        "im-form-create-establishment__edit-establishment-button",
      startFormButton: "im-form-create-establishment__start-button",
      submitFormButton: "im-form-create-establishment__submit-button",
      nextAvailabilityDateInput:
        "im-form-create-establishment__next-availability-date",
      previousButtonFromStepAndMode: ({ currentStep }) =>
        `im-form-create-establishment__previous-button--step-${currentStep}`,
      nextButtonFromStepAndMode: ({ currentStep }) =>
        `im-form-create-establishment__next-button--step-${currentStep}`,
      searchableBy: "im-form-create-establishment__searchable-by",
    },
    edit: {
      form: "im-form-edit-establishment",
      addressAutocomplete:
        "im-form-edit-establishment__autocomplete-address-creation-establishment-form",
      siret: "im-form-edit-establishment__siret",
      businessName: "im-form-edit-establishment__business-name",
      businessNameCustomized:
        "im-form-edit-establishment__business-name-customized",
      businessAddresses: "im-form-edit-establishment__business-addresses",
      businessContact: {
        lastName: "im-form-edit-establishment__business-contact-last-name",
        firstName: "im-form-edit-establishment__business-contact-first-name",
        job: "im-form-edit-establishment__businessContact-job",
        phone: "im-form-edit-establishment__businessContact-phone",
        email: "im-form-edit-establishment__businessContact-email",
        copyEmails: "im-form-edit-establishment__businessContact-copy-emails",
        contactMethod:
          "im-form-edit-establishment__businessContact-contact-method",
      },
      isEngagedEnterprise: "im-form-edit-establishment__is-engaged-enterprise",
      fitForDisabledWorkers:
        "im-form-edit-establishment__fit-for-disabled-workers",
      appellations: "im-form-edit-establishment__appellations",
      website: "im-form-edit-establishment__website",
      additionalInformation:
        "im-form-edit-establishment__additional-information",
      maxContactsPerWeek: "im-form-edit-establishment__max-contact-per-week",
      maxContactsPerWeekWhenAvailable:
        "im-form-edit-establishment__max-contact-per-week-when-available",
      addAppellationButton:
        "im-form-edit-establishment__add-appellation-button",
      addAddressButton: "im-form-edit-establishment__add-address-button",
      errorSiretAlreadyExistButton:
        "im-form-edit-establishment__edit-establishment-button",
      startFormButton: "im-form-edit-establishment__start-button",
      submitFormButton: "im-form-edit-establishment__submit-button",
      nextAvailabilityDateInput:
        "im-form-edit-establishment__next-availability-date",
      previousButtonFromStepAndMode: ({ currentStep }) =>
        `im-form-edit-establishment__previous-button--step-${currentStep}`,
      nextButtonFromStepAndMode: ({ currentStep }) =>
        `im-form-edit-establishment__next-button--step-${currentStep}`,
      searchableBy: "im-form-edit-establishment__searchable-by",
    },
    admin: {
      form: "im-form-manage-establishment-admin",
      manageButton: "im-form-manage-establishment-admin__manage-button",
      searchableBy: "im-form-manage-establishment-admin__searchable-by",
      startFormButton: "im-form-manage-establishment-admin__start-button",
      submitFormButton: "im-form-manage-establishment-admin__submit-button",
      addAppellationButton:
        "im-form-manage-establishment-admin__add-appellation-button",
      businessAddresses:
        "im-form-manage-establishment-admin__business-addresses",
      previousButtonFromStepAndMode: ({ currentStep }) =>
        `im-form-manage-establishment-admin__previous-button--step-${currentStep}`,
      nextButtonFromStepAndMode: ({ currentStep }) =>
        `im-form-manage-establishment-admin__next-button--step-${currentStep}`,
      addressAutocomplete:
        "im-form-manage-establishment-admin__autocomplete-address-creation-establishment-form",
      siret: "im-form-manage-establishment-admin__siret",
      businessName: "im-form-manage-establishment-admin__business-name",
      businessNameCustomized:
        "im-form-manage-establishment-admin__business-name-customized",
      businessContact: {
        lastName:
          "im-form-manage-establishment-admin__business-contact-last-name",
        firstName:
          "im-form-manage-establishment-admin__business-contact-first-name",
        job: "im-form-manage-establishment-admin__businessContact-job",
        phone: "im-form-manage-establishment-admin__businessContact-phone",
        email: "im-form-manage-establishment-admin__businessContact-email",
        copyEmails:
          "im-form-manage-establishment-admin__businessContact-copy-emails",
        contactMethod:
          "im-form-manage-establishment-admin__businessContact-contact-method",
      },
      isEngagedEnterprise:
        "im-form-manage-establishment-admin__is-engaged-enterprise",
      fitForDisabledWorkers:
        "im-form-manage-establishment-admin__fit-for-disabled-workers",
      appellations: "im-form-manage-establishment-admin__appellations",
      website: "im-form-manage-establishment-admin__website",
      additionalInformation:
        "im-form-manage-establishment-admin__additional-information",
      maxContactsPerWeek:
        "im-form-manage-establishment-admin__max-contact-per-week",
      maxContactsPerWeekWhenAvailable:
        "im-form-manage-establishment-admin__max-contact-per-week-when-available",
      addAddressButton:
        "im-form-manage-establishment-admin__add-address-button",
      errorSiretAlreadyExistButton:
        "im-form-manage-establishment-admin__edit-establishment-button",
      nextAvailabilityDateInput:
        "im-form-manage-establishment-admin__next-availability-date",
    },
  },

  assessment: {
    formSubmitButton: "im-assessment-form__submit-button",
    formDownloadButton: "im-assessment-form__download-button",
  },

  magicLinkRenewal: {
    renewalButton: "im-renew-page__renew-link-button",
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
    login: {
      inclusionConnectButton: "im-login-form__inclusion-connect-button--admin",
    },
    agencyTab: {
      editAgencyForm: "im-form-edit-agency",
      activateAgencySelector: "agency-selector",
      editAgencyFormStatusSelector: "im-form-edit-agency__status-select",
      editAgencyFormSafirCodeInput: "im-form-edit-agency__safir-code-input",
      editAgencyFormEditSubmitButton: "im-form-edit-agency__submit-button",
      rejectAgencyModal: "im-reject-agency-modal",
      agencyToReviewInput: "im-agency-to-review__input",
      agencyToReviewButton: "im-agency-to-review__review-button",
      agencyToReviewActivateButton: "im-agency-to-review__activate-button",
      agencyToReviewRejectButton: "im-agency-to-review__reject-button",
      selectIcUserToReview: "im-agency-user-review__select-ic-user",
      registerIcUserToAgencyButton: "im-agency-user-review__register-button",
      rejectAgencyModalJustificationInput:
        "im-reject-agency-modal__justification-input",
      rejectAgencyModalSubmitButton: "im-reject-agency-modal__submit-button",
    },
    emailPreviewTab: {
      emailTemplateNameSelect: "selectTemplateName",
      internshipKindSelect: "email-preview-internshipKind-select",
    },
    manageEstablishment: {
      siretInput: "im-manage-establishment__siret-input",
      searchButton: "im-manage-establishment__search-button",
      titleInput: "im-form-add-by-batch__title-input",
      descriptionInput: "im-form-add-by-batch__description-input",
      groupNameInput: "im-form-add-by-batch__group-name-input",
      inputFileInput: "im-form-add-by-batch__input-file-input",
      submitEditButton:
        "im-form-manage-establishment-admin__submit-edit-button",
      submitDeleteButton:
        "im-form-manage-establishment-admin__submit-delete-button",
    },
    adminPrivateRoute: {
      formLoginUserInput: "im-login__user-input",
      formLoginPasswordInput: "im-login__password-input",
      formLoginSubmitButton: "im-login__submit-button",
    },
  },

  conventionStatusDashboard: {},
  group: {},
  conventionDocument: {
    downloadPdfButton: "im-convention-document__download-pdf-button",
  },
  landingEstablishment: {},
  conventionToSign: {
    form: "im-convention-to-sign-form",
    submitButton: "im-convention-to-sign__submit-button",
    openSignModalButton: "im-convention-to-sign__open-sign-modal-button",
    openRequestModificationModalButton:
      "im-convention-to-sign__open-modification-modal-button",
    submitModificationrequestButton:
      "im-convention-to-sign__submit-modification-request-button",
  },
  editFormEstablishmentRoute: {},
  error: {},
  conventionMiniStageRoute: {},
  agencyDashboard: {
    login: {
      inclusionConnectButton: "im-login-form__inclusion-connect-button--agency",
    },
    registerAgencies: {
      form: "im-register-agencies-form",
      agencyAutocomplete: "im-register-agencies-form__agency-autocomplete",
      submitButton: "im-register-agencies-form__submit-button",
    },
    dashboard: {
      tabContainer: "im-agency-dashboard__tab-container",
    },
  },
  manageConventionAdmin: {},
  manageConventionInclusionConnected: {
    erroredConventionHandledModal:
      "im-errored-convention-handled-confirmation-modal",
  },
  manageDiscussion: {},
  offer: {},
  offerExternal: {},
  manageEstablishmentAdmin: {},
  establishmentDashboard: {
    login: {
      inclusionConnectButton:
        "im-login-form__inclusion-connect-button--establishment",
    },
    discussion: {
      activateDraftConvention:
        "im-manage-establishment__convert-discussion-to-draft-convention",
      replyToCandidateByEmail:
        "im-manage-establishment__reply-to-candidate-by-email",
    },
  },
  searchDiagoriente: {},
  rootDashboard: {
    establishment: {
      link: "im-root-dashboard__establishment-link",
    },
    agency: {
      link: "im-root-dashboard__agency-link",
    },
  },
} satisfies DomElementIds;
