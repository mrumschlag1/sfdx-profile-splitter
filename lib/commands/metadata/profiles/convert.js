"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable */
const command_1 = require("@salesforce/command");
const chalk_1 = require("chalk");
const config = require("../../../shared/config.json");
const fs = require("fs-extra");
const path = require("path");
const convert = require("xml-js");
class Convert extends command_1.SfdxCommand {
    async convert(format, inputDir, outputDir, deleteProfile) {
        try {
            const target = (format === 'xml' ? '.json' : '.profile');
            const output = (format === 'xml' ? '.profile' : '.json');
            const root = path.resolve(inputDir);
            const fileNames = (await fs.readdir(root)).filter(file => {
                return file.includes(target);
            });
            this.ux.log(chalk_1.default.bold(chalk_1.default.black(('Found ' + fileNames.length + ' matching profiles'))));
            if (fileNames.length > 0) {
                const location = path.resolve(outputDir);
                await fs.ensureDir(location);
                for (const fileName of fileNames) {
                    this.ux.log(chalk_1.default.bold(chalk_1.default.black(('Converting profile: ' + fileName))));
                    const file = await fs.readFile(root + '/' + fileName);
                    const newPath = location + '/' + fileName.replace(target, output);
                    if (format === 'xml') {
                        const stream = convert.js2xml(JSON.parse(file.toString()), config.xmlExport);
                        await fs.writeFile(newPath, stream);
                    }
                    else {
                        const stream = convert.xml2js(file.toString(), config.jsonExport);
                        await fs.writeFile(newPath, JSON.stringify(stream));
                    }
                    if (deleteProfile === true) {
                        await fs.remove(root + '/' + fileName);
                    }
                }
            }
        }
        catch (ex) {
            this.ux.error(chalk_1.default.bold(chalk_1.default.red(ex)));
            return 1;
        }
        return 0;
    }
    async run() {
        const format = this.flags.format;
        const inputDir = this.flags.input;
        const outputDir = this.flags.output;
        const deleteProfile = this.flags.delete;
        await this.convert(format, inputDir, outputDir, deleteProfile);
        // Return an object to be displayed with --json
        return {};
    }
}
Convert.description = 'Converts full profiles into json or xml format.';
Convert.examples = [`
        sfdx metadata:profiles:convert -f json -i force-app/main/default/profiles -o force-app/main/default/test
        //Converts full profiles into json or xml, !!!! does not split !!!!.
    `];
Convert.flagsConfig = {
    format: command_1.flags.string({ char: 'f', required: true, description: 'the output format i.e. json|xml.' }),
    input: command_1.flags.string({ char: 'i', default: 'force-app/main/default/profiles', required: true, description: 'the input directory.' }),
    output: command_1.flags.string({ char: 'o', default: 'force-app/main/default/profiles', required: true, description: 'the output directory.' }),
    delete: command_1.flags.boolean({ char: 'd', default: false, description: 'Delete the profiles once converted?' })
};
// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
Convert.requiresProject = false;
exports.default = Convert;
//# sourceMappingURL=convert.js.map