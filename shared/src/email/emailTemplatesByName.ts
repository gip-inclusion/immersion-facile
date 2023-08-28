import { createTemplatesByName, EmailButtonProps } from "html-templates";
import { ConventionId, InternshipKind } from "../convention/convention.dto";
import { isStringDate, toDisplayedDate } from "../utils/date";
import { advices } from "./advices";
import { defaultConventionFinalLegals } from "./defaultConventionFinalLegals";
import { EmailParamsByEmailType } from "./EmailParamsByEmailType";
import { immersionFacileContactEmail } from "./knownEmailsAddresses";

const defaultSignature = (internshipKind: InternshipKind) =>
  internshipKind === "immersion"
    ? `
    Bonne journée,
    L'équipe Immersion Facilitée
`
    : `
    Bonne journée, 
    L’équipe du Point Orientation Apprentissage
`;

const createConventionStatusButton = (link: string): EmailButtonProps => ({
  url: link,
  label: "Voir l'état de ma demande",
  target: "_blank",
});

// to add a new EmailType, or changes the params of one, edit first EmailParamsByEmailType and let types guide you
export const emailTemplatesByName =
  createTemplatesByName<EmailParamsByEmailType>({
    ESTABLISHMENT_DELETED: {
      niceName: "Suppression de l'entreprise",
      tags: ["suppression entreprise"],
      createEmailVariables: ({ businessAddress, businessName, siret }) => ({
        subject:
          "Votre entreprise a été supprimée de la liste des entreprises accueillantes d'Immersion Facilitée",
        greetings: "Bonjour,",
        content: `
        Suite à votre demande de suppression de votre établissement (SIRET ${siret} - ${businessName} - ${businessAddress}), nous vous confirmons que ce dernier a été supprimé définitivement de la liste des entreprises accueillantes exposées sur Immersion Facilitée.
        `,
        subContent: `Bien cordialement,
        l'équipe d'Immersion Facilitée`,
      }),
    },
    DISCUSSION_EXCHANGE: {
      niceName: "Échange entre établissement et potentiel bénéficiaire",
      tags: ["échange établissement potentiel bénéficiaire"],
      createEmailVariables: ({ subject, htmlContent }) => ({
        bypassLayout: true,
        subject,
        content: htmlContent,
      }),
    },
    SIGNATORY_FIRST_REMINDER: {
      niceName: "Signataire - Premier rappel",
      tags: ["relance signatures manquantes"],
      createEmailVariables: ({
        actorFirstName,
        actorLastName,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        magicLinkUrl,
        signatoriesSummary,
      }) => ({
        subject:
          "RAPPEL - La convention démarrant d'ici 3 jours n'est pas complètement signée",
        greetings: greetingsWithConventionId(
          conventionId,
          `${actorFirstName} ${actorLastName}`,
        ),
        content: `
      Certains signataires n'ont pas encore signé la demande de convention d'immersion en milieu professionnel pour ${beneficiaryFirstName} ${beneficiaryLastName}.
      
      Voici, à date, l'état des signatures :
      ${signatoriesSummary}

      <strong>Sans toutes les signatures, la convention ne peut être établie et l'établissement ${businessName} ne pourra pas accueillir en immersion ${beneficiaryFirstName} ${beneficiaryLastName}.</strong>

      Nous vous remercions de confirmer au plus vite cette demande.`,
        buttons: magicLinkUrl && [
          {
            label: "Ouvrir la demande de convention",
            url: `${magicLinkUrl}`,
          },
        ],
        subContent: `Bonne journée,
      L'équipe Immersion Facilitée`,
      }),
    },
    SIGNATORY_LAST_REMINDER: {
      niceName: "Signataire - Dernier rappel",
      tags: ["relance signatures manquantes"],
      createEmailVariables: ({
        actorFirstName,
        actorLastName,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        magicLinkUrl,
        signatoriesSummary,
      }) => ({
        subject:
          "RAPPEL URGENT - La convention démarrant dans moins de 24h n'est pas complètement signée",
        greetings: greetingsWithConventionId(
          conventionId,
          `${actorFirstName} ${actorLastName}`,
        ),
        content: `
      Certains signataires n'ont pas encore signé la demande de convention d'immersion en milieu professionnel pour ${beneficiaryFirstName} ${beneficiaryLastName}.
      
      Voici, à date, l'état des signatures :
      ${signatoriesSummary}

      <strong>Sans toutes les signatures, la convention ne peut être établie et l'établissement ${businessName} ne pourra pas accueillir en immersion ${beneficiaryFirstName} ${beneficiaryLastName}.</strong>

      Nous vous remercions de confirmer au plus vite cette demande.`,
        buttons: magicLinkUrl && [
          {
            label: "Ouvrir la demande de convention",
            url: `${magicLinkUrl}`,
          },
        ],
        subContent: `Bonne journée,
      L'équipe Immersion Facilitée`,
      }),
    },
    AGENCY_FIRST_REMINDER: {
      niceName: "Agence - Premier rappel",
      tags: ["relance vérification manquante"],
      createEmailVariables: ({
        agencyMagicLinkUrl,
        agencyName,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        dateEnd,
        dateStart,
      }) => ({
        subject:
          "RAPPEL - Une demande de convention d'immersion démarrant d'ici 3 jours ouvrés doit être vérifiée",
        greetings: greetingsWithConventionId(conventionId),
        content: `
      Merci de ne pas oublier de traiter la demande de convention d'immersion qui concerne :

      Bénéficiaire : ${beneficiaryFirstName} ${beneficiaryLastName}

      Entreprise : ${businessName}

      Structure d'accompagnement : ${agencyName}

      Dates de l'immersion :
      - du ${dateStart}
      - au ${dateEnd}

      Cette demande d'immersion a bien été signée par le bénéficiaire et l'entreprise d'accueil.`,
        buttons: [
          {
            label: "Voir la convention",
            url: agencyMagicLinkUrl,
          },
        ],
        subContent: `Bonne journée,
      L'équipe Immersion Facilitée`,
      }),
    },
    AGENCY_LAST_REMINDER: {
      niceName: "Agence - Dernier rappel",
      tags: ["relance vérification manquante"],
      createEmailVariables: ({
        agencyMagicLinkUrl,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
      }) => ({
        subject:
          "RAPPEL URGENT - Une demande de convention d'immersion démarrant demain doit être vérifiée",
        greetings: greetingsWithConventionId(conventionId),
        content: `
      L'immersion demandée par Bénéficiaire <strong>${beneficiaryFirstName} ${beneficiaryLastName}</strong> au sein de l'entreprise <strong>${businessName}</strong> doit démarrer demain.

      Nous vous remercions d'examiner rapidement la demande de convention qui vous a été envoyée afin que votre décision soit transmise au bénéficiaire et à l'entreprise.`,
        buttons: [
          {
            label: "Voir la convention",
            url: agencyMagicLinkUrl,
          },
        ],
        subContent: `
      Pour rappel, nous vous transmettons tous les renseignements nécessaires pour examiner la demande. Si vous la validez, la convention est automatiquement établie.

      Bonne journée,
      L'équipe Immersion Facilitée
      `,
      }),
    },
    AGENCY_WAS_ACTIVATED: {
      niceName: "Activation agence",
      tags: ["activation prescripteur"],
      createEmailVariables: ({ agencyLogoUrl, agencyName }) => ({
        subject: `Immersion Facilitée - Votre structure a été activée`,
        greetings: "Bonjour,",
        content: `<strong>Votre structure prescriptrice d'immersion est activée !</strong> 

        Nous avons bien activé l'accès à la demande de convention dématérialisée pour des immersions professionnelles pour: ${agencyName}. 
        
        Merci à vous !`,
        agencyLogoUrl,
        subContent: defaultSignature("immersion"),
      }),
    },
    NEW_CONVENTION_BENEFICIARY_CONFIRMATION: {
      niceName: "Confirmation bénéficiaire nouvelle convention",
      tags: ["demande signature bénéficiaire"],
      createEmailVariables: ({
        agencyLogoUrl,
        conventionId,
        firstName,
        internshipKind,
        lastName,
      }) => ({
        subject: `${
          internshipKind === "immersion"
            ? "Votre confirmation pour votre demande de convention est enregistrée"
            : "Mini Stage - Votre confirmation pour votre demande de mini stage est enregistrée"
        }`,
        greetings: greetingsWithConventionId(
          conventionId,
          `${firstName} ${lastName}`,
        ),
        content: `
        Merci d'avoir confirmé votre demande de convention. Elle va être transmise à votre conseiller référent.

        Il vous informera par mail de la validation ou non ${
          internshipKind === "immersion" ? "de l'immersion" : "du mini stage"
        }. Le tuteur qui vous encadrera pendant cette période recevra aussi la réponse.`,
        highlight: {
          content: `Attention, ne démarrez pas ${
            internshipKind === "immersion" ? "cette immersion" : "ce mini stage"
          } tant que vous n'avez pas reçu cette validation !`,
        },
        subContent: defaultSignature(internshipKind),
        attachmentUrls:
          internshipKind === "immersion"
            ? [
                "https://immersion.cellar-c2.services.clever-cloud.com/les_bons_conseils_beneficiaire.pdf",
              ]
            : undefined,
        agencyLogoUrl,
      }),
    },
    NEW_CONVENTION_ESTABLISHMENT_TUTOR_CONFIRMATION: {
      niceName: "Confirmation tuteur nouvelle convention",
      tags: ["confirmation tuteur enregistrée"],
      createEmailVariables: ({
        agencyLogoUrl,
        beneficiaryFirstName,
        beneficiaryLastName,
        conventionId,
        establishmentTutorName,
        internshipKind,
      }) => ({
        subject: `${
          internshipKind === "immersion"
            ? "Demande de convention confirmée"
            : "Mini Stage - Demande de mini stage confirmée"
        }`,
        greetings: greetingsWithConventionId(
          conventionId,
          establishmentTutorName,
        ),
        content: `
      Vous venez de confirmer la demande ${
        internshipKind === "immersion"
          ? "d'immersion professionnelle"
          : "de mini stage"
      } pour ${beneficiaryFirstName} ${beneficiaryLastName}  au sein de votre entreprise.      

      Cette demande va être transmise à son ${
        internshipKind === "immersion"
          ? "conseiller référent"
          : "conseiller de la Chambre de Commerce et d'Instrustrie - CCI"
      }.
      Il vous informera prochainement par mail de la validation ou non ${
        internshipKind === "immersion" ? "de l'immersion" : "du mini stage"
      }. 
      `,
        highlight: {
          content: `Attention, ne démarrez pas ${
            internshipKind === "immersion" ? "cette immersion" : "ce mini stage"
          } tant que vous n'avez pas reçu la validation !`,
        },
        subContent: defaultSignature(internshipKind),
        agencyLogoUrl,
      }),
    },
    NEW_CONVENTION_AGENCY_NOTIFICATION: {
      niceName: "Notification agence nouvelle convention",
      tags: ["notification conseiller création demande d’immersion"],
      createEmailVariables: ({
        agencyLogoUrl,
        agencyName,
        businessName,
        conventionId,
        conventionStatusLink,
        dateEnd,
        dateStart,
        firstName,
        internshipKind,
        lastName,
        magicLink,
        warning,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? `Une demande de convention d'immersion est déposée : ${firstName}, ${lastName} - ${businessName} - ${agencyName}.`
            : `Mini Stage - une demande de convention de mini stage est déposée : ${firstName}, ${lastName} - ${businessName} - ${agencyName}.`,
        greetings: greetingsWithConventionId(conventionId),
        content: `
      <strong>Une nouvelle demande ${
        internshipKind === "immersion"
          ? "d'immersion professionnelle"
          : "de mini stage"
      } a été enregistrée.</strong>

      

      Vous pouvez prendre connaissance de la demande en <a href="${magicLink}" target="_blank">cliquant ici</a>.
      Vous pouvez également suivre <a href="${conventionStatusLink}" target="_blank">l'état de la convention en cliquant ici</a>.
      <ul>
        <li>Vous pouvez dès maintenant demander des modifications ou la refuser si nécessaire.</li>
        <li>Vous ne pouvez pas la valider tant que le bénéficiaire et l'entreprise n'ont pas confirmé chacun leur accord pour cette demande.</li>
        <li>Vous avez connaissance du mail et du téléphone de chacun. Vous pouvez les relancer en cas de besoin.</li>
      </ul> 
      <strong>Dates ${
        internshipKind === "immersion" ? "de l'immersion" : "du mini stage"
      } :</strong> 
      - du ${dateStart}
      - au ${dateEnd}      

      <strong>Bénéficiaire :</strong> 
      ${firstName} ${lastName}      

      <strong>Entreprise :</strong>
      ${businessName}      

      <strong>Structure d'accompagnement :</strong>
      ${agencyName}
      `,
        highlight: {
          content: warning,
        },
        subContent: defaultSignature(internshipKind),
        attachmentUrls:
          internshipKind === "immersion"
            ? [
                "https://immersion.cellar-c2.services.clever-cloud.com/les_bons_conseils_prescripteur.pdf",
              ]
            : undefined,
        agencyLogoUrl,
      }),
    },
    VALIDATED_CONVENTION_FINAL_CONFIRMATION: {
      niceName: "Convention finale validée",
      tags: ["envoi convention"],
      createEmailVariables: ({
        agencyLogoUrl,
        beneficiaryBirthdate,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        dateEnd,
        dateStart,
        emergencyContactInfos,
        establishmentTutorName,
        immersionAppellationLabel,
        internshipKind,
        magicLink,
        validatorName,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? `Validation et convention de l'immersion pour observer l'activité de ${immersionAppellationLabel} au sein de ${businessName}`
            : `Mini Stage - Validation et convention du mini stage pour observer l'activité de ${immersionAppellationLabel} au sein de ${businessName}`,
        greetings: greetingsWithConventionId(conventionId),
        content: `
      Bonne nouvelle ! 

      La demande faite par ${beneficiaryFirstName} ${beneficiaryLastName} (né le ${
          isStringDate(beneficiaryBirthdate)
            ? toDisplayedDate(new Date(beneficiaryBirthdate))
            : "Date invalide"
        }) pour réaliser une immersion du ${dateStart} au ${dateEnd}, au sein de ${businessName} et encadrée par ${establishmentTutorName} a été validée${
          validatorName ? ` par ${validatorName} ` : " "
        }et la convention est bien enregistrée. 
      
      ${
        internshipKind === "immersion" ? "L'immersion" : "Le mini stage"
      } peut donc démarrer aux dates convenues.       
      `,
        buttons: [
          {
            label:
              internshipKind === "immersion"
                ? "Voir la convention d'immersion"
                : "Voir la convention du mini-stage",
            url: magicLink,
          },
          {
            label: "Télécharger la fiche bilan",
            url: `${
              internshipKind === "immersion"
                ? "https://immersion.cellar-c2.services.clever-cloud.com/bilan-immersion-professionnelle-inscriptible.pdf"
                : "https://immersion.cellar-c2.services.clever-cloud.com/CCI_MiniStage_Bilan.pdf"
            }`,
          },
        ],
        highlight: {
          kind: "info",
          content: `${
            internshipKind === "immersion"
              ? "À la fin de l'immersion, nous vous remercions de compléter la fiche bilan de l'immersion, et de l'envoyer au conseiller qui a signé la convention (Pôle Emploi, Mission Locale…). Cette évaluation doit être complétée par le tuteur, si possible en présence du bénéficiaire de l'immersion."
              : "À la fin du mini stage, nous vous remercions de compléter la fiche bilan du mini stage, et de l'envoyer au conseiller de la Chambre de Commerce et d'Instrustrie - CCI qui a signé la convention. Cette évaluation doit être complétée par le tuteur, si possible en présence du bénéficiaire du mini stage."
          }`,
        },
        subContent: `
      ${defaultSignature(internshipKind)}


      En cas de difficulté, prévenez au plus vite votre ${
        internshipKind === "immersion"
          ? "conseiller"
          : "conseiller de la Chambre de Commerce et d'Instrustrie - CCI"
      } pour qu'il vous conseille au mieux. 
      
      ${
        emergencyContactInfos
          ? `Si la situation l'impose, le contact d'urgence de ${beneficiaryFirstName} ${beneficiaryLastName} : ${emergencyContactInfos}`
          : ""
      }`,
        agencyLogoUrl,
      }),
    },
    POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED: {
      niceName:
        "Notification de convention signée au conseiller pole-emploi lié",
      tags: ["immersion à étudier (mail conseiller)"],
      createEmailVariables: ({
        advisorFirstName,
        advisorLastName,
        agencyLogoUrl,
        beneficiaryEmail,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        dateEnd,
        dateStart,
        magicLink,
        immersionAddress,
      }) => ({
        subject: `Pour action : la demande de convention d'immersion envoyée par ${beneficiaryFirstName} ${beneficiaryLastName} est totalement signée. À vous de la valider !`,
        greetings: greetingsWithConventionId(
          conventionId,
          `${advisorFirstName} ${advisorLastName}`,
        ),
        content: `
      <strong>La demande d'immersion de ${beneficiaryFirstName} ${beneficiaryLastName} est signée. 
      À vous de l'étudier !</strong>`,
        buttons: [
          {
            url: magicLink,
            label: "Voir la demande",
            target: "_blank",
          },
        ],
        subContent: `
      Vous pouvez demander des modifications ou la refuser, si nécessaire  ou la valider si cette demande correspond au projet de ${beneficiaryFirstName} ${beneficiaryLastName}, ${beneficiaryEmail}.      
      
      N'hésitez pas à le joindre ou à appeler l'entreprise. Leurs coordonnées sont présentes dans la demande de convention.        
      
      <strong>Dates de l'immersion :</strong> 
      - du ${dateStart}
      - au ${dateEnd}
      
      <strong>Entreprise d'accueil :</strong>
      - ${businessName}
      - ${immersionAddress}

      ${defaultSignature("immersion")}
      `,
        attachmentUrls: [
          "https://immersion.cellar-c2.services.clever-cloud.com/les_bons_conseils_prescripteur_pole_emploi.pdf",
        ],
        agencyLogoUrl,
      }),
    },
    POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION: {
      niceName:
        "Notification de nouvelle convention au conseiller pole-emploi lié",
      tags: [],
      createEmailVariables: ({
        advisorFirstName,
        advisorLastName,
        agencyLogoUrl,
        beneficiaryEmail,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        dateEnd,
        dateStart,
        immersionAddress,
        magicLink,
      }) => ({
        subject: `Une demande de convention d'immersion vous est directement adressée par: ${beneficiaryFirstName} ${beneficiaryLastName}`,
        greetings: greetingsWithConventionId(
          conventionId,
          `${advisorFirstName} ${advisorLastName}`,
        ),
        content: `
      <strong>Une nouvelle demande d'immersion a été enregistrée.</strong>

      Nous vous transmettons une demande de convention d'immersion (PMSMP) qui vient d'être faite par un demandeur d'emploi que vous suivez.

      <strong>Etape 1</strong> : Si le demandeur d’emploi n’est pas reconnu par CVM, procédez à son identification afin de pouvoir traiter le mail. Vous avez les informations à la fin de cet email. 
      Consultez la procédure à suivre pour clôturer cet email : <a href="https://drive.google.com/file/d/1tWL68ua1f-NgYnPkXs979_CkukPtlGRU/view?usp=sharing">Comment traiter un mail Immersion Facilitée dans CVM ?</a>

      <strong>Etape 2</strong> : <a href="${magicLink}" target="_blank">Vous pouvez y accéder en cliquant ici</a>      

      Tant que cette demande n'est pas encore confirmée par <strong>l'entreprise et par la/le bénéficiaire</strong>, vous pouvez demander des modifications ou la refuser, si nécessaire.

      <strong>La demande de modification et le refus sont à réaliser depuis l’écran Immersion Facilitée.</strong>

      Quand leur accord respectif sera enregistré, vous pourrez alors la valider. 

      Pensez à relancer celui qui n'a pas confirmé si son accord tarde à venir !  

      <strong>Ne répondez pas à ce mail, il ne sera ni adressé au bénéficiaire, ni à l’entreprise.</strong>

      Vous pouvez retrouver les coordonnées de chacun sur l’écran Immersion Facilitée.


      <strong>Résumé de la demande :</strong>      

      <strong>Dates de l'immersion :</strong>
      - du ${dateStart}
      - au ${dateEnd}     

      <strong>Demandeur d'emploi :</strong>
      - ${beneficiaryFirstName} ${beneficiaryLastName}
      - Courriel  : ${beneficiaryEmail}      

      <strong>Entreprise accueillant la PMSMP :</strong>
      - ${businessName}
      - ${immersionAddress}

      `,
        subContent: defaultSignature("immersion"),
        attachmentUrls: [
          "https://immersion.cellar-c2.services.clever-cloud.com/les_bons_conseils_prescripteur_pole_emploi.pdf",
        ],
        agencyLogoUrl,
      }),
    },
    REJECTED_CONVENTION_NOTIFICATION: {
      niceName: "Notification de convention rejetée",
      tags: ["refus demande d'immersion"],
      createEmailVariables: ({
        agencyLogoUrl,
        agencyName,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        immersionProfession,
        internshipKind,
        rejectionReason,
        signature,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? `Refus de la demande d'immersion pour observer l'activité de ${immersionProfession} au sein de ${businessName}`
            : `Mini Stage - Refus de la demande de mini stage pour l'activité de ${immersionProfession} au sein de ${businessName}`,
        greetings: greetingsWithConventionId(conventionId),
        content: `
      Nous vous informons que la demande ${
        internshipKind === "immersion"
          ? "d'immersion professionnelle"
          : "de mini stage"
      } de ${beneficiaryFirstName} ${beneficiaryLastName} dans l'entreprise ${businessName} a été refusée par ${agencyName}.
      
      <strong>Les raisons sont&nbsp;:</strong>
      ${rejectionReason}       
      
      Vous pouvez vous rapprocher de votre conseiller${
        internshipKind === "immersion"
          ? ""
          : " de la chambre de commerce et d'instrustrie - CCI"
      } pour en échanger.      
      
      Bien cordialement,       
      ${signature} 
      `,
        agencyLogoUrl,
      }),
    },
    CANCELLED_CONVENTION_NOTIFICATION: {
      niceName: "Notification d'annulation de convention",
      tags: ["annulation demande d'immersion"],
      createEmailVariables: ({
        agencyLogoUrl,
        agencyName,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        immersionProfession,
        internshipKind,
        signature,
        dateEnd,
        dateStart,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? `Annulation de la demande d'immersion pour observer l'activité de ${immersionProfession} au sein de ${businessName}`
            : `Mini Stage - Annulation de la demande de mini stage pour l'activité de ${immersionProfession} au sein de ${businessName}`,
        greetings: greetingsWithConventionId(conventionId),
        content: `
      Nous vous informons que la demande ${
        internshipKind === "immersion"
          ? "d'immersion professionnelle"
          : "de mini stage"
      } de ${beneficiaryFirstName} ${beneficiaryLastName} dans l'entreprise ${businessName}, qui devait se dérouler du ${
          isStringDate(dateStart)
            ? toDisplayedDate(new Date(dateStart), true)
            : "DATE INVALIDE"
        } au ${
          isStringDate(dateEnd)
            ? toDisplayedDate(new Date(dateEnd), true)
            : "DATE INVALIDE"
        } a été annulée par ${agencyName}.
      
      Cette demande de convention était devenue obsolète car une autre demande a déjà été traitée.
      
      Vous pouvez vous rapprocher de votre conseiller${
        internshipKind === "immersion"
          ? ""
          : " de la chambre de commerce et d'instrustrie - CCI"
      } pour en échanger ou établir une nouvelle demande si nécessaire.      
      
      Bien cordialement,       
      ${signature} 
      `,
        agencyLogoUrl,
      }),
    },
    CONVENTION_MODIFICATION_REQUEST_NOTIFICATION: {
      niceName: "Requête demande de modification de convention",
      tags: ["demande de modifications"],
      createEmailVariables: ({
        agencyLogoUrl,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        conventionStatusLink,
        internshipKind,
        justification,
        magicLink,
        signature,
        requesterName,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? "Pour action : veuillez modifier cette demande d'immersion professionnelle"
            : "Pour action : mini Stage - veuillez modifier cette demande de mini stage",
        greetings: greetingsWithConventionId(conventionId),
        content: `Une demande de modification vous a été adressé par ${requesterName} concernant la demande ${
          internshipKind === "immersion" ? "d'immersion" : "de mini stage"
        } de ${beneficiaryFirstName} ${beneficiaryLastName} dans l'entreprise ${businessName}.
         
         <strong>Les raisons sont&nbsp;:</strong>
        ${justification}`,
        buttons: [
          {
            url: magicLink,
            label: "Modifier votre demande",
          },
          createConventionStatusButton(conventionStatusLink),
        ],
        subContent: `
      Après avoir corrigé votre demande, il faudra de nouveau que tous les acteurs de la convention confirment leur accord. 
      
      Pensez à surveiller votre boite mail et à consulter vos spams si vous ne recevez pas le mail de demande de confirmation.      
      
      Bien cordialement,      
      ${signature}
      `,
        agencyLogoUrl,
      }),
    },
    NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION: {
      niceName: "Examen de la convention",
      tags: ["notification conseiller demande d’immersion signée à valider"],
      createEmailVariables: ({
        agencyLogoUrl,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        conventionStatusLink,
        internshipKind,
        magicLink,
        possibleRoleAction,
        validatorName,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? `Demande d'immersion à étudier: ${beneficiaryFirstName} ${beneficiaryLastName} - ${businessName}`
            : `Mini Stage - Demande de mini stage à étudier: ${beneficiaryFirstName} ${beneficiaryLastName} - ${businessName}`,
        greetings: greetingsWithConventionId(conventionId),
        content: `
      <strong>Une nouvelle demande ${
        internshipKind === "immersion" ? "d'immersion" : "de mini stage"
      } vous est envoyée${
          validatorName ? ` par ${validatorName} ` : " "
        }pour que vous l'examiniez.</strong>

      Elle concerne le bénéficiaire ${beneficiaryFirstName} ${beneficiaryLastName} dans l'entreprise ${businessName} 

      Nous vous remercions d'en prendre connaissance pour ${possibleRoleAction}.
      `,
        buttons: [
          {
            label: "Examiner la demande",
            url: magicLink,
            target: "_blank",
          },
          createConventionStatusButton(conventionStatusLink),
        ],
        subContent: defaultSignature(internshipKind),
        attachmentUrls:
          internshipKind === "immersion"
            ? [
                "https://immersion.cellar-c2.services.clever-cloud.com/les_bons_conseils_prescripteur.pdf",
              ]
            : undefined,
        agencyLogoUrl,
      }),
    },
    MAGIC_LINK_RENEWAL: {
      niceName: "Renouvellement de lien magique",
      tags: ["renouvellement de lien"],
      createEmailVariables: ({
        conventionId,
        conventionStatusLink,
        internshipKind,
        magicLink,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? "Voici votre nouveau lien magique pour accéder à la demande d'immersion"
            : `Mini Stage - Voici votre nouveau lien magique pour accéder à la demande de mini stage`,
        greetings: conventionId
          ? greetingsWithConventionId(conventionId)
          : "Bonjour ,",
        content: `
      Vous venez de demander le renouvellement d'un lien pour accéder à une demande ${
        internshipKind === "immersion" ? "d'immersion" : "de mini stage"
      }. Veuillez le trouver ci-dessous :
      `,
        buttons: [
          {
            url: magicLink,
            label: "Mon lien renouvelé",
          },
          createConventionStatusButton(conventionStatusLink),
        ],
        subContent: defaultSignature(internshipKind),
        highlight: {
          content:
            "Si vous n'êtes pas à l'origine de cette demande, veuillez contacter notre équipe.",
        },
      }),
    },
    BENEFICIARY_OR_ESTABLISHMENT_REPRESENTATIVE_ALREADY_SIGNED_NOTIFICATION: {
      niceName: "Notification de signature de l'autre signataire",
      tags: ["confirmation nécessaire après confirmation de l’autre partie"],
      createEmailVariables: ({
        agencyLogoUrl,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        conventionStatusLink,
        establishmentRepresentativeName,
        existingSignatureName,
        immersionProfession,
        internshipKind,
        magicLink,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? "Pour action : à vous de signer votre demande de convention"
            : "Pour action : à vous de confirmer votre demande de mini stage",
        greetings: greetingsWithConventionId(conventionId),
        content: `
      La demande de convention pour ${
        internshipKind === "immersion" ? "l'immersion" : "le mini stage"
      } de ${beneficiaryFirstName} ${beneficiaryLastName} pour le métier de ${immersionProfession} dans l'entreprise ${businessName} encadré par ${establishmentRepresentativeName} vient d'être signée par ${existingSignatureName}.

      <strong>Ouvrez la demande via le bouton ci-dessous puis vérifiez les informations :</strong>
      - Si les informations sont correctes, cliquez sur “Signer” puis “Je termine la signature” sur l’écran suivant.
      - Si les informations ne sont pas correctes, cliquez sur le bouton "Annuler les signatures et demander une modification".
      `,
        buttons: [
          { url: magicLink, label: "Ouvrir ma demande" },
          createConventionStatusButton(conventionStatusLink),
        ],
        subContent: `
      Ensuite, il vous suffira d'attendre le mail de validation de l'organisme d'accompagnement.

      <strong>Attention, ne démarrez pas ${
        internshipKind === "immersion" ? "l'immersion" : "le mini stage"
      } sans ce mail de validation. Sinon, le risque “accident du travail” ne sera pas couvert.</strong>
      
      ${defaultSignature(internshipKind)}
      `,
        agencyLogoUrl,
      }),
    },
    NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE: {
      niceName: "Demande de signature pour confirmation de convention",
      tags: ["demande signature demande de convention"],
      createEmailVariables: ({
        agencyLogoUrl,
        beneficiaryCurrentEmployerName,
        beneficiaryName,
        beneficiaryRepresentativeName,
        businessName,
        conventionId,
        conventionStatusLink,
        establishmentRepresentativeName,
        establishmentTutorName,
        internshipKind,
        conventionSignShortlink,
        signatoryName,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? "Pour action : signez votre demande de convention"
            : "Pour action : signez votre demande de mini stage",
        greetings: greetingsWithConventionId(conventionId, signatoryName),
        content: `Une demande de convention ${
          internshipKind === "immersion" ? "d'immersion" : "de mini stage"
        } vient d'être enregistrée. Vous devez maintenant la confirmer.
        
        Pour rappel, cette demande concerne : 
           - Le bénéficiaire ${beneficiaryName}${
          beneficiaryRepresentativeName
            ? `\n- ${beneficiaryRepresentativeName}`
            : ""
        }${
          beneficiaryCurrentEmployerName
            ? `\n- L'employeur actuel du bénéficiare ${beneficiaryCurrentEmployerName}`
            : ""
        }
           - L'entreprise ${businessName} représentée par ${establishmentRepresentativeName}
           - Le tuteur dans l'entreprise ${establishmentTutorName}
        
          <strong>Votre signature est obligatoire</strong> pour permettre à votre ${
            internshipKind === "immersion"
              ? "conseiller"
              : "conseiller de la Chambre de Commerce et d'Instrustrie - CCI"
          } de valider la convention. Merci !
        
        <strong>Ouvrez la demande via le bouton ci-dessous puis vérifiez les informations :</strong>
        - Si les informations sont correctes, cliquez sur “Signer” puis “Je termine la signature” sur l’écran suivant.
        - Si les informations ne sont pas correctes, cliquez sur le bouton "Annuler les signatures et demander une modification".`,
        buttons: [
          { url: conventionSignShortlink, label: "Ouvrir ma demande" },
          createConventionStatusButton(conventionStatusLink),
        ],
        highlight: {
          content: `Attention, ne démarrez pas votre ${
            internshipKind === "immersion" ? "immersion" : "mini stage"
          } tant que vous n'avez pas reçu cette validation ! Vous n'auriez pas de couverture en cas d'accident.`,
        },
        subContent: `La décision de votre ${
          internshipKind === "immersion"
            ? "conseiller"
            : "conseiller de la Chambre de Commerce et d'Instrustrie - CCI"
        } vous sera transmise par mail.

        ${defaultSignature(internshipKind)}
      `,
        attachmentUrls:
          internshipKind === "immersion"
            ? [
                "https://immersion.cellar-c2.services.clever-cloud.com/les_etapes_de_votre_demande.pdf",
              ]
            : undefined,
        agencyLogoUrl,
      }),
    },
    NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE_AFTER_MODIFICATION: {
      niceName:
        "Demande de signature pour confirmation de convention après modification",
      tags: ["demande signature demande de convention après modification"],
      createEmailVariables: ({
        agencyLogoUrl,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        conventionSignShortlink,
        internshipKind,
        justification: reason,
        signatoryFirstName,
        signatoryLastName,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? "Pour action : demande de convention modifiée, signez la nouvelle version"
            : "Pour action : demande de mini stage modifiée, signez la nouvelle version",
        greetings: `
        <strong>Identifiant de la convention : ${conventionId}</strong>
        
        Bonjour ${signatoryFirstName} ${signatoryLastName},`,
        content: `La demande de convention pour ${
          internshipKind === "immersion" ? "l'immersion" : "le mini stage"
        }
        de ${beneficiaryFirstName} ${beneficiaryLastName} au sein de ${businessName} vient d'être modifiée.
        
        <strong>Les raisons sont&nbsp;:</strong>
        ${reason}
        
        Votre signature sur la première demande de convention a donc été annulée.
        
        Action attendue : cliquez sur le bouton ci-dessous, puis vérifiez dans l’écran qui s’ouvre si ce qui a été modifié vous convient :
        - Si c'est la cas, confirmez votre accord en signant de nouveau cette demande (cliquez sur “Signer” puis “Je termine la signature” sur l’écran suivant).
        - Si la modification ne vous convient pas, vous pouvez relancer des modifications (cliquez sur le bouton "Annuler les signatures et demander une modification").`,
        buttons: [
          {
            url: conventionSignShortlink,
            label: "Relire et signer la demande de convention",
          },
        ],
        subContent: defaultSignature(internshipKind),
        agencyLogoUrl,
      }),
    },
    CONTACT_BY_EMAIL_REQUEST: {
      niceName: "Mise en relation par mail",
      tags: ["mise en relation mail"],
      createEmailVariables: ({
        appellationLabel,
        businessName,
        contactFirstName,
        contactLastName,
        immersionObjective: immersionObject,
        message,
        potentialBeneficiaryFirstName,
        potentialBeneficiaryLastName,
        businessAddress,
        potentialBeneficiaryPhone,
        potentialBeneficiaryResumeLink,
        replyToEmail,
      }) => ({
        subject: `${potentialBeneficiaryFirstName} ${potentialBeneficiaryLastName} vous contacte pour une demande d'immersion sur le métier de ${appellationLabel}`,
        greetings: `Bonjour ${contactFirstName} ${contactLastName},`,
        content: `
        Un candidat souhaite faire une immersion ${
          immersionObject ? `pour "${immersionObject?.toLowerCase()}"` : ""
        } sur le métier de <strong>${appellationLabel}</strong> dans votre entreprise ${businessName} (${businessAddress}).

        Voici son message:

      "${message}"

      ${potentialBeneficiaryFirstName} 
      ${potentialBeneficiaryLastName}

      ${
        potentialBeneficiaryResumeLink
          ? `Plus d'info sur ce candidat: <a href="${potentialBeneficiaryResumeLink}">${potentialBeneficiaryResumeLink}</a>`
          : ""
      }
      
      `,
        buttons: [
          {
            label: "Écrire au candidat",
            url: `mailto:${replyToEmail}`,
          },
        ],
        highlight: {
          content: `
          Ce candidat attend une réponse, vous pouvez :

          - répondre directement à cet email, il lui sera transmis (vous pouvez également utiliser le bouton "Écrire au candidat" ci-dessus)

          - en cas d'absence de réponse par email, vous pouvez essayer de le contacter par tel : ${potentialBeneficiaryPhone}`,
        },
        subContent: `Vous pouvez préparer votre échange grâce à notre <a href="https://aide.immersion-facile.beta.gouv.fr/fr/article/etudier-une-demande-dimmersion-professionnelle-1ehkehm/">page d'aide</a>.
        ${defaultSignature("immersion")}`,
      }),
    },
    CONTACT_BY_PHONE_INSTRUCTIONS: {
      niceName: "Instructions de mise en contact par téléphone",
      tags: ["mise en relation tel"],
      createEmailVariables: ({
        businessName,
        contactFirstName,
        contactLastName,
        contactPhone,
        potentialBeneficiaryFirstName,
        potentialBeneficiaryLastName,
      }) => ({
        subject: `Coordonnées téléphoniques pour faire votre demande d'immersion`,
        greetings: `Bonjour ${potentialBeneficiaryFirstName} ${potentialBeneficiaryLastName},`,
        content: `
      Vous avez manifesté de l’intérêt pour réaliser une immersion professionnelle au sein de l’entreprise ${businessName}.
      Cette entreprise a souhaité être contactée par téléphone.

      Voici ses coordonnées :
      - Personne à contacter : ${contactFirstName} ${contactLastName}
      - Numéro de téléphone  :  ${contactPhone}      
      
      Ces informations sont personnelles et confidentielles. Elles ne peuvent pas être communiquées à d’autres personnes. 
      Merci !

      ${advices}
      `,
      }),
    },
    CONTACT_IN_PERSON_INSTRUCTIONS: {
      niceName: "Instructions de mise en contact en personne",
      tags: ["mise en relation en personne"],
      createEmailVariables: ({
        businessAddress,
        businessName,
        contactFirstName,
        contactLastName,
        potentialBeneficiaryFirstName,
        potentialBeneficiaryLastName,
      }) => ({
        subject:
          "Coordonnées de l'entreprise pour faire votre demande d'immersion",
        greetings: `Bonjour ${potentialBeneficiaryFirstName} ${potentialBeneficiaryLastName},`,
        content: `Vous avez manifesté de l’intérêt pour réaliser une immersion professionnelle au sein de l’entreprise ${businessName}.

    Cette entreprise souhaite que vous vous rendiez sur place pour présenter votre demande. 

    Voici les coordonnées :
    - Personne à contacter : <strong>${contactFirstName} ${contactLastName}</strong>
    - Adresse de l'entreprise : <strong>${businessAddress}</strong>
    `,
        highlight: {
          content:
            "Ces informations sont personnelles et confidentielles. Elles ne peuvent pas être communiquées à d’autres personnes. ",
        },
        subContent: defaultSignature("immersion"),
      }),
    },
    SHARE_DRAFT_CONVENTION_BY_LINK: {
      niceName: "Partager le formulaire de convention par lien",
      tags: ["partage de convention"],
      createEmailVariables: ({
        additionalDetails,
        conventionFormUrl,
        internshipKind,
      }) => ({
        subject: `${
          internshipKind ? "Immersion Facilitée" : "Mini Stage"
        } - Pour action : une demande de convention préremplie vous est transmise pour que vous la complétiez`,
        greetings: "Bonjour,",
        content: `
        <strong>Une demande de convention ${
          internshipKind === "immersion" ? "d'immersion" : "de mini stage"
        } doit être complétée :</strong>
        ${additionalDetails}
      `,
        buttons: [{ label: "Compléter la demande", url: conventionFormUrl }],
        subContent: defaultSignature(internshipKind),
      }),
    },
    SUGGEST_EDIT_FORM_ESTABLISHMENT: {
      niceName: "Suggestion de mise à jour d'établissement",
      tags: ["mise à jour fiche entreprise"],
      createEmailVariables: ({
        editFrontUrl,
        businessName,
        businessAddress,
      }) => ({
        subject:
          "Mettez à jour votre fiche entreprise sur le site Immersion Facilitée",
        greetings: "Bonjour,",
        content: `Votre entreprise: ${businessName} (${businessAddress}) est inscrite dans l'annuaire des entreprises accueillantes d'Immersion Facilitée depuis au moins 6 mois. Merci !

      Vous pouvez mettre à jour, si vous le souhaitez, les informations saisies au moment du référencement.
      
      Vous pouvez :
      • ajouter ou supprimer des métiers
      • modifier l'enseigne ou l'adresse
      • modifier les coordonnées du référent "Immersion"
      • modifier le mode de contact souhaité
      • ajouter un lien vers le site ou des informations complémentaires sur l'activité de l'entreprise
      • en suspendre la visibilité
      `,
        subContent: `Nous vous invitons à cliquer sur le bouton ci-dessus pour mettre à jour vos informations.
      
      Si vous n'avez pas besoin de faire de modifications, vous n'avez rien à faire, les informations concernant votre entreprise seront affichées à l'identique.
      
      ${defaultSignature("immersion")}`,
        legals:
          "* Pour les entreprises de 20 salariés et plus, les personnes en situation de handicap accueillies en immersion sont comptabilisées au titre de l'obligation d'emploi.",
        buttons: [
          { label: "Mettre à jour ma fiche établissement", url: editFrontUrl },
        ],
        highlight: {
          content: `Nouveautés ! Il est maintenant possible de :
        • limiter le nombre de mises en relations reçues par semaine,
        • informer que votre entreprise peut accueillir en immersion des personnes en situation de handicap *.`,
        },
      }),
    },
    EDIT_FORM_ESTABLISHMENT_LINK: {
      niceName: "Lien d'édition du formulaire d'établissement",
      tags: ["modification établissement"],
      createEmailVariables: ({
        editFrontUrl,
        businessName,
        businessAddress,
      }) => ({
        subject:
          "Immersion Facilitée - Modification de la fiche de votre entreprise",
        greetings: "Bonjour,",
        content: `
      Vous avez demandé à modifier les informations concernant votre entreprise: ${businessName} (${businessAddress}). 

      Vous pouvez ajouter ou supprimer des métiers, modifier l'adresse de l'entreprise,  les coordonnées du référent “Immersion” dans votre entreprise ou le mode de contact souhaité, etc.  
      `,
        buttons: [{ label: "Modifier ma fiche entreprise", url: editFrontUrl }],
        highlight: {
          content: `Si vous n'êtes pas à l'origine de cette demande, nous vous recommandons de nous contacter rapidement par mail : ${immersionFacileContactEmail}.`,
        },
        subContent: defaultSignature("immersion"),
      }),
    },
    NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION: {
      niceName: "Contact enregistré de création d'un nouveau établissement",
      tags: ["confirmation enregistrement entreprise"],
      createEmailVariables: ({
        businessName,
        businessAddress,
        contactFirstName,
        contactLastName,
      }) => ({
        subject: `Confirmation de création de votre établissement ${businessName} pour accueillir des immersions`,
        greetings: "Bonjour,",
        content: `
      <strong>Félicitations !</strong>

      Vous venez d'enregistrer votre établissement ${businessName} (${businessAddress}) pour accueillir des immersions professionnelles.      

      ${contactFirstName} ${contactLastName} recevra bien les demandes d'immersion.      

      Pour ces demandes, il n'est pas utile de demander un CV. Il s'agit seulement de passer quelques jours ensemble pour une découverte réciproque. 

      Si vous avez des projets de recrutement et si, grâce à une immersion, vous retenez un profil qui vous convient, un conseiller emploi vous proposera, si nécessaire,  un plan de formation sur mesure. 

      Merci d'avoir rejoint la communauté des “entreprises s'engagent” et de contribuer ainsi à l'accès à l'emploi de tous les publics.
      `,
        subContent: defaultSignature("immersion"),
        buttons: [
          {
            label: "Nos bons conseils",
            url: "https://immersion.cellar-c2.services.clever-cloud.com/livret_accueil_entreprise.pdf",
          },
        ],
      }),
    },
    CREATE_IMMERSION_ASSESSMENT: {
      niceName: "Lien de creation du bilan",
      tags: ["notification entreprise fin de l’immersion"],
      createEmailVariables: ({
        agencyLogoUrl,
        agencyValidatorEmail,
        beneficiaryFirstName,
        beneficiaryLastName,
        conventionId,
        establishmentTutorName,
        immersionAssessmentCreationLink,
        internshipKind,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? "Comment s'est déroulée l'immersion ?"
            : "Mini Stage - Comment s'est déroulée le mini stage ?",
        greetings: greetingsWithConventionId(
          conventionId,
          establishmentTutorName,
        ),
        content: `
      ${
        internshipKind === "immersion"
          ? "L'immersion professionnelle"
          : "Le mini stage"
      } de ${beneficiaryFirstName} ${beneficiaryLastName} au sein de votre entreprise est en passe de s'achever. 

      Nous vous remercions de votre accueil. 

      Pouvez-vous indiquer si ${
        internshipKind ? "cette immersion" : "ce mini stage"
      } s'est bien déroulée jusqu'à sa date de fin prévue ?`,
        buttons: [
          {
            label: `Evaluer ${
              internshipKind === "immersion"
                ? "cette immersion"
                : "ce mini stage"
            }`,
            url: immersionAssessmentCreationLink,
          },
          {
            label: "Télécharger la fiche bilan",
            url: `${
              internshipKind === "immersion"
                ? "https://immersion.cellar-c2.services.clever-cloud.com/PMSMP_Bilan.pdf"
                : "https://immersion.cellar-c2.services.clever-cloud.com/CCI_MiniStage_Bilan.pdf"
            }`,
          },
        ],
        highlight: {
          kind: "info",
          content: `${
            internshipKind === "immersion"
              ? `À la fin de l'immersion, nous vous remercions de compléter la fiche bilan de l'immersion, et de l'envoyer au conseiller qui a signé la convention (Pôle Emploi, Mission Locale…). Cette évaluation doit être complétée avec ${beneficiaryFirstName} ${beneficiaryLastName}, `
              : `À la fin du mini stage, nous vous remercions de compléter la fiche bilan du mini stage, et de l'envoyer au conseiller de la Chambre de Commerce et d'Instrustrie - CCI qui a signé la convention. Cette évaluation doit être complétée avec ${beneficiaryFirstName} ${beneficiaryLastName}, `
          } puis envoyée à <a href= "mailto:${agencyValidatorEmail}" target="_blank">${agencyValidatorEmail}</a>.`,
        },
        subContent: `
      Ces informations sont importantes pour la suite de son parcours professionnel. 

      En cas de difficulté, prévenez au plus vite la structure d’accompagnement pour que vous soyez conseillé au mieux.
       
      Merci  !      
      ${defaultSignature(internshipKind)}
      `,
        agencyLogoUrl,
      }),
    },
    FULL_PREVIEW_EMAIL: {
      niceName: "Preview email complet (tous les blocs)",
      tags: ["aperçu pour tests"],
      createEmailVariables: ({
        agencyLogoUrl,
        beneficiaryName,
        conventionId,
        conventionStatusLink,
        internshipKind,
      }) => ({
        subject: "Test contenant toutes les blocs email",
        greetings: greetingsWithConventionId(conventionId, beneficiaryName),
        content: `Merci d'avoir confirmé votre demande ${
          internshipKind ? "d'immersion" : "de mini stage"
        }. Elle va être transmise à votre ${
          internshipKind === "immersion"
            ? "conseiller"
            : "conseiller de la Chambre de Commerce et d'Instrustrie - CCI"
        } référent.
      
      Il vous informera par mail de la validation ou non ${
        internshipKind === "immersion" ? "de l'immersion" : "du mini stage"
      }. Le tuteur qui vous encadrera pendant cette période recevra aussi la réponse.`,
        legals: defaultConventionFinalLegals(internshipKind),
        buttons: [
          { label: "Label de bouton", url: "http://www.example.com" },
          createConventionStatusButton(conventionStatusLink),
        ],
        subContent: `Il vous informera par mail de la validation ou non ${
          internshipKind === "immersion" ? "de l'immersion" : "du mini stage"
        }. Le tuteur qui vous encadrera pendant cette période recevra aussi la réponse.
      
      ${defaultSignature(internshipKind)}
      `,
        highlight: {
          content: `Attention, ne démarrez pas ${
            internshipKind === "immersion" ? "cette immersion" : "ce mini stage"
          } tant que vous n'avez pas reçu cette validation !`,
        },
        agencyLogoUrl,
      }),
    },
    SIGNEE_HAS_SIGNED_CONVENTION: {
      niceName: "Confirmation de signature de l'immersion",
      createEmailVariables: ({
        agencyLogoUrl,
        conventionId,
        conventionStatusLink,
        internshipKind,
        signedAt,
        agencyName,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? `Confirmation de signature de l'immersion - ${conventionId}`
            : `Mini Stage - Confirmation de signature du mini stage - ${conventionId}`,
        greetings: greetingsWithConventionId(conventionId),
        content: `
      Nous confirmons que vous avez signé ${
        internshipKind === "immersion"
          ? "la convention d'immersion professionnelle"
          : "la convention de mini stage "
      } le ${
          isStringDate(signedAt)
            ? toDisplayedDate(new Date(signedAt), true)
            : "DATE INVALIDE"
        }.
      `,
        highlight: {
          content: `
        Attention. Votre convention est en cours d'examen.
        Avant de débuter ${
          internshipKind === "immersion" ? "l'immersion" : "le mini stage"
        }, veuillez vous assurer que la convention a bien été validée par un conseiller de la structure d'accompagnement du bénéficiaire (${agencyName}).
        Vous recevrez une notification lorsque ce sera fait.
        `,
        },
        subContent: defaultSignature(internshipKind),
        buttons: [createConventionStatusButton(conventionStatusLink)],
        agencyLogoUrl,
      }),
      tags: ["confirmation de signature de convention"],
    },
    IC_USER_RIGHTS_HAS_CHANGED: {
      niceName: "Notification de changement de droit (Utilisateur IC)",
      tags: ["activation BO prescripteur"],
      createEmailVariables: ({ agencyName }) => ({
        subject: `Immersion Facilitée - Activation de l’accès au back office de votre structure`,
        greetings: "Bonjour,",
        content: `<strong>Vous pouvez désormais accéder au back office de votre structure.</strong>

        Nous avons bien activé votre accès au back office de votre structure : ${agencyName}.

        Vous avez ainsi la possibilité de consulter l’ensemble des conventions d’immersion établies et à traiter et de les exporter sous format excel ou csv.

        Nous allons progressivement enrichir ce back office et vous proposer de nouvelles fonctionnalités.
      `,
        subContent: defaultSignature("immersion"),
      }),
    },
    DEPRECATED_CONVENTION_NOTIFICATION: {
      niceName: "Notification de convention obsolète",
      tags: ["dépreciation demande d'immersion"],
      createEmailVariables: ({
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        dateEnd,
        dateStart,
        deprecationReason,
        immersionProfession,
        internshipKind,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? `Demande d'immersion pour observer l'activité de ${immersionProfession} au sein de ${businessName} obsolète`
            : `Mini Stage - Demande de mini stage pour l'activité de ${immersionProfession} au sein de ${businessName} obsolète`,
        greetings: greetingsWithConventionId(conventionId),
        content: `
      Nous vous informons que la demande ${
        internshipKind === "immersion"
          ? "d'immersion professionnelle"
          : "de mini stage"
      } de ${beneficiaryFirstName} ${beneficiaryLastName} pour réaliser ${
          internshipKind === "immersion"
            ? "une immersion professionnelle"
            : "un mini stage"
        } du ${
          isStringDate(dateStart)
            ? toDisplayedDate(new Date(dateStart), true)
            : "DATE INVALIDE"
        } au ${
          isStringDate(dateEnd)
            ? toDisplayedDate(new Date(dateEnd), true)
            : "DATE INVALIDE"
        } dans l'entreprise ${businessName} est supprimée.
      
      Les raisons en sont: ${deprecationReason}.         
      
      Bien cordialement,       
      `,
        subContent: defaultSignature(internshipKind),
      }),
    },
  });

const greetingsWithConventionId = (
  conventionId: ConventionId,
  actor?: string,
): string =>
  `<strong>Identifiant de la convention : ${conventionId}</strong>
        
Bonjour ${actor ?? ""},`;
