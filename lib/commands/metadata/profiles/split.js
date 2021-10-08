"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable */
const command_1 = require("@salesforce/command");
const fs = require("fs-extra");
const convert = require("xml-js");
const path = require("path");
const config = require("../../../shared/config.json");
const chalk_1 = require("chalk");
function createModel(key, value) {
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
    data.Profile[key] = value;
    return data;
}
class Split extends command_1.SfdxCommand {
    async split(inputDir, outputDir, deleteProfile) {
        try {
            const root = path.resolve(inputDir);
            const location = path.resolve(outputDir);
            await fs.ensureDir(location);
            const fileNames = await fs.readdir(root);
            for (const fileName of fileNames) {
                if (fileName.includes('.profile')) {
                    this.ux.log(chalk_1.default.bold(chalk_1.default.black(('Splitting profile: ' + fileName))));
                    const dirRoot = location + '/' + fileName.replace('.profile-meta.xml', '');
                    await fs.ensureDir(dirRoot);
                    const xml = await fs.readFile(root + '/' + fileName);
                    const stream = convert.xml2js(xml.toString(), config.jsonExport);
                    for (const metatag of Object.values(config.profiles.metaTags)) {
                        if (stream['Profile'][metatag] === undefined) {
                            continue;
                        }
                        const model = createModel(metatag, stream['Profile'][metatag]);
                        const itemRoot = dirRoot + '/' + metatag;
                        await fs.ensureDir(itemRoot);
                        await fs.writeFile(itemRoot + '/' + metatag + '-meta.xml', convert.json2xml(JSON.stringify(model), config.xmlExport));
                    }
                    for (const metadata of Object.keys(config.profiles.tags)) {
                        const itemRoot = dirRoot + '/' + metadata;
                        await fs.ensureDir(itemRoot);
                        const targetName = config.profiles.tags[metadata].nameTag;
                        if (stream['Profile'][metadata] === undefined) {
                            continue;
                        }
                        if (Array.isArray(stream['Profile'][metadata])) {
                            if (targetName === '_self') {
                                const model = createModel(metadata, stream['Profile'][metadata]);
                                await fs.writeFile(itemRoot + '/' + metadata + '-meta.xml', convert.json2xml(JSON.stringify(model), config.xmlExport));
                            }
                            else {
                                for (const item of stream['Profile'][metadata]) {
                                    let model = createModel(metadata, [item]);
                                    await fs.writeFile(itemRoot + '/' + item[targetName]._text + '-meta.xml', convert.json2xml(JSON.stringify(model), config.xmlExport));
                                }
                            }
                        }
                        else {
                            const item = stream['Profile'][metadata];
                            const model = createModel(metadata, item);
                            let newFileName = '';
                            if (targetName === '_self') {
                                newFileName = metadata + '-meta.xml';
                            }
                            else {
                                newFileName = stream['Profile'][metadata][targetName]._text + '-meta.xml';
                            }
                            await fs.writeFile(itemRoot + '/' + newFileName, convert.json2xml(JSON.stringify(model), config.xmlExport));
                        }
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
        const inputDir = this.flags.input;
        const outputDir = this.flags.output;
        const deleteProfile = this.flags.delete;
        await this.split(inputDir, outputDir, deleteProfile);
        // Return an object to be displayed with --json
        return {};
    }
}
Split.description = 'Split profiles into smaller parts.';
Split.examples = [`
        sfdx metadata:profiles:split -i force-app/main/default/profiles -o force-app/main/default/test
        //Splits profiles located in specified input dir and copies them into the output dir.
    `];
Split.flagsConfig = {
    input: command_1.flags.string({ char: 'i', default: 'force-app/main/default/profiles', required: true, description: 'the input directory where the full profiles exist.' }),
    output: command_1.flags.string({ char: 'o', default: 'force-app/main/default/profiles', required: true, description: 'the output directory to store the chunked profiles.' }),
    delete: command_1.flags.boolean({ char: 'd', default: false, description: 'Delete the existing profiles once converted?' })
};
// Set this to true if your command requires a project workspace; 'requiresProject' is false by default
Split.requiresProject = false;
exports.default = Split;
//# sourceMappingURL=split.js.map