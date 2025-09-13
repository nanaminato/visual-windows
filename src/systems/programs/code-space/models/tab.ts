import {OpenFile} from './open-file';

export interface CodeSpaceTab{
    type: 'setting' | 'file';
    name: string;
    file?: OpenFile;
}
