export const renderButton = (params?: {
  url: string;
  label: string;
}): string | undefined =>
  params &&
  `<table>
    <tr>
      <td align="center" width="600" style="padding: 20px;">
        <a style="text-decoration: none; display: inline-block;padding: 10px 20px; background-color: #000091; color: #fff; text-align: center;" href="${params.url}">${params.label}</a>
      </td>
    </tr>
  </table>`;
