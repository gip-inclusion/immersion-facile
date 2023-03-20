import sass from "sass";
import { extract } from "string-extract-class-names";
import fs from "fs";
import path from "path";
import camelCase from "camelcase";

export const getScssData = (componentName, filename) => {
  const { css } = sass.compile(filename);
  const { res: classes } = extract(css);
  const filteredClasses = classes
    .filter((result) => result.includes(componentName))
    .map((className) => className.replace(".", ""));
  const keys = [
    ...new Set(
      filteredClasses.map((className) => {
        const element = className.replace(componentName, "");
        return camelCase(element);
      }),
    ),
  ];
  return {
    filename,
    classes,
    filteredClasses,
    keys,
  };
};

export const makeTsFileContent = (componentName, filePath) => {
  const { filename, filteredClasses, keys } = getScssData(
    componentName,
    filePath,
  );
  const fileBaseName = path.basename(filename);
  return `import './${fileBaseName}';
  
    export default {
      root: '${componentName}',
      ${keys
        .map((className, index) => `${className}: '${filteredClasses[index]}'`)
        .join(",\n")}
    }
  `;
};

const makeTsFileName = (filePath) => {
  const tsFileName = filePath.replace(".scss", ".styles.ts");
  return tsFileName;
};

export const writeTsFile = (componentName, filePath) => {
  const content = makeTsFileContent(componentName, filePath);
  fs.writeFile(makeTsFileName(filePath), content, (error) => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return;
    }
    // eslint-disable-next-line no-console
    console.info(`${makeTsFileName(filePath)} created`);
  });
};

export const processScssFiles = (componentName, folder = "./") => {
  fs.readdirSync(folder).forEach((filePath) => {
    if (!filePath.includes(".scss")) return;
    writeTsFile(componentName, folder + filePath);
  });
};
