import {ProgramIcon} from '../../../models/program-info';

export interface FileAssociation {
    extension: string; // 如 ".txt"
    programId: string; // 关联程序标识
    programName: string;
    iconUrl?: ProgramIcon;
}
