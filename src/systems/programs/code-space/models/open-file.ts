export interface OpenFile{
    name: string,
    path: string,
    content: string,
    encoding: string,
    lineEnding: string,
}
export interface FileEntry{
    name: string,
    isFolder: boolean,
    size?: number,
}
export function getFileExtension(openFile: FileEntry){
    if(openFile.isFolder){
        return '';
    }
    let index = openFile.name.lastIndexOf('.');
    if(index > -1){
        return openFile.name.substring(index+1);
    }
    return '';
}
