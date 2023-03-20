#! /usr/bin/env node
import { processScssFiles } from "../index.js";
import { program } from "commander";

program
  .command("update")
  .description("Create a .styles.ts for scss files in the folder")
  .argument("<componentName>", "Component name (ex. im-search-page)")
  .argument("<filePath>", "path relative to the project root")
  .action((componentName, filePath) =>
    processScssFiles(componentName, `${process.cwd()}/${filePath}`),
  );
program.parse();
