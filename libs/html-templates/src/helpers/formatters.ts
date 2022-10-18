export const ignoreTabs = (str: string): string => str.replace(/\n  +/g, "\n");

export const wrapElements = (children: string) =>
  `
  <table width="600">
    <tr>
      <td>
        ${children}
      </td>
    </tr>
  </table>
  `;
