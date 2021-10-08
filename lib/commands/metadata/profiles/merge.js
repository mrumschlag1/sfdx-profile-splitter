"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable */
const command_1 = require("@salesforce/command");
const _ = require("lodash");
const fs = require("fs-extra");
const convert = require("xml-js");
const path = require("path");
const config = require("../../../shared/config.json");
const chalk_1 = require("chalk");
function createModel() {
    const data = {
        _declaration: {
            _attributes: {
                version: '1.0',
                encoding: 'UTF-8'
            }
        },
        Profile: {
            _attributes: {
                xmlns: 'http://soap.sforce.com/2006/04/metadata'
            }
        }
    };
    return data;
}
async function getDirs(location) {
    let dirs = [];
    for (const file of await fs.readdir(location)) {
        if ((await fs.stat(path.join(location, file))).isDirectory()) {
            dirs = [...dirs, path.join(location, file)];
        }
    }
    return dirs;
}
class Merge extends command_1.SfdxCommand {
    async merge(inputDir, outputDir, deleteProfile) {
        try {
            const root = path.resolve(inputDir);
            const location = path.resolve(outputDir);
            await fs.ensureDir(location);
            const rootDirs = await getDirs(root);
            for (const rootDir of rootDirs) {
                this.ux.log(chalk_1.default.bold(chalk_1.default.black(('Merging profile: ' + path.basename(rootDir)))));
                const model = createModel();
                const metaDirs = await getDirs(rootDir);
                for (const metaDir of metaDirs) {
                    const metadataType = path.basename(metaDir);
                    model.Profile[metadataType] = [];
                    const fileNames = await fs.readdir(metaDir);
                    for (const fileName of fileNames) {
                        const filePath = metaDir + '/' + fileName;
                        const file = await fs.readFile(filePath);
                        const stream = convert.xml2js(file.toString(), config.jsonExport);
                        // Is this needed here??
                        if (stream['Profile'][metadataType] === undefined) {
                            continue;
                        }
                        model.Profile[metadataType] = [...model.Profile[metadataType], stream['Profile'][metadataType]];
                    }
                    model.Profile[metadataType] = _.flatten(model.Profile[metadataType]);
                }
                await fs.writeFile(location + '/' + path.basename(rootDir) + '.profile-meta.xml', convert.json2xml(JSON.stringify(model), config.xmlExport));
                if (deleteProfile === true) {
                    await fs.remove(rootDir);
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
        const inputDir = this.flags.input;
        const outputDir = this.flags.output;
        const deleteProfile = this.flags.delete;
        await this.merge(inputDir, outputDir, deleteProfile);
        // Return an object to be displayed with --json
        return {};
    }
}
Merge.description = 'Merge profiles that were split.';
Merge.examples = [`
        sfdx metadata:profiles:merge -i force-app/main/default/profiles -o force-app/main/default/test
        //Merges profiles located in specified input dir and copies them into the output dir.
    `];
Merge.flagsConfig = {
    input: command_1.flags.string({ char: 'i', default: 'force-app/main/default/profiles', required: true, description: 'the input directory where the splitted profiles exist.' }),
    output: command_1.flags.string({ char: 'o', default: 'force-app/main/default/profiles', required: true, description: 'the output directory to store the full profiles.' }),
    delete: command_1.flags.boolean({ char: 'd', default: false, description: 'Delete the splitted profiles once merged?' })
};
// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
Merge.requiresProject = false;
exports.default = Merge;
//# sourceMappingURL=merge.js.map