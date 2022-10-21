export const renderHighlight = (
  content: string | undefined,
): string | undefined =>
  content &&
  `<table style="margin-top: 5px; margin-bottom: 25px;">
    <tr>
      <td align="center" width="4" style="background-color: #6A6AF4;">
      </td>
      <td width="25">
      </td>
      <td>
       <p style="color: #000093; font-weight: bold; margin-top: 1rem;">
        ${content}
       </p>
      </td>
    </tr>
  </table>`;
