import { core, flags, SfdxCommand } from '@salesforce/command';
export default class Convert extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        format: flags.IOptionFlag<string>;
        input: flags.IOptionFlag<string>;
        output: flags.IOptionFlag<string>;
        delete: import("../../../../../../../../Users/RJ857MQ/projects/sfdx-profile-splitter/node_modules/@salesforce/command/node_modules/@oclif/command/node_modules/@oclif/parser/lib/flags").IBooleanFlag<boolean>;
    };
    protected static requiresProject: boolean;
    convert(format: string, inputDir: string, outputDir: string, deleteProfile: boolean): Promise<any>;
    run(): Promise<core.AnyJson>;
}
