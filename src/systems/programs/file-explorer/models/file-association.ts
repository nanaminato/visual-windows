import {ProgramIcon} from '../../../models';

export interface FileAssociation {
    extensions: string[]; // 如 ".txt"
    programId: string; // 关联程序标识
    programName: string;
    iconUrl?: ProgramIcon;
}
