export const renderFooter = (
  contactEmail: string,
  customFooter: ((contactEmail: string) => string) | undefined,
) =>
  customFooter
    ? customFooter(contactEmail)
    : defaultImmersionFooter(contactEmail);
const defaultImmersionFooter = (contactEmail: string) => `<table>
  <tr>
    <td height="30"></td>
  </tr>
  <tr>
    <td width="600" style="background-color: #F5F5FE; text-align: center; padding: 20px 50px; ">
      <p style="margin-bottom: .5rem; font-weight: bold; font-size: 18px;">L'immersion facilitée - Une startup d’Etat du Groupement d’Intérêt Public - La plateforme de l’inclusion</p>
      <p style="font-size: 18px; margin-top: 0;">20 avenue de Ségur, 75007, Paris</p>
      <p style="font-size: 14px;">Vous avez reçu cet email car vous l'avez renseigné lors de votre demande de convention d'immersion. Si vous n'êtes pas le destinataire de cette notification, merci de nous prévenir à <a href="mailto:${contactEmail}">${contactEmail}</a></p>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding: 20px;">
      <img src="https://immersion.cellar-c2.services.clever-cloud.com/d0cfdb84-881a-40d5-b228-7e14c185fb68.png" alt="" width="290" />
    </td>
  </tr>
</table>`;

export const cciCustomHtmlFooter = (contactEmail: string) => `<table>
  <tr>
    <td height="30"></td>
  </tr>
  <tr>
    <td width="600" style="background-color: #F5F5FE; text-align: center; padding: 20px 50px; ">
      <p style="margin-bottom: .5rem; font-weight: bold; font-size: 18px;">L'immersion facilitée - Une startup d’Etat du Groupement d’Intérêt Public - La plateforme de l’inclusion</p>
      <p style="font-size: 18px; margin-top: 0;">20 avenue de Ségur, 75007, Paris</p>
      <p style="font-size: 14px;">Vous avez reçu cet email car vous l'avez renseigné lors de votre demande de convention d'immersion. Si vous n'êtes pas le destinataire de cette notification, merci de nous prévenir à <a href="mailto:${contactEmail}">${contactEmail}</a></p>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding: 20px;">
      <img src="https://immersion.cellar-c2.services.clever-cloud.com/logo-cci-blanc.png" width="899" height="173" alt="Chambre de Commerce et d'Industrie" style="max-width: 350px; max-height: 120px; height: auto;"/>
    </td>
  </tr>
</table>`;
