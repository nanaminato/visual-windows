export interface FileItem {
    name: string;
    isDirectory: boolean;
    size?: number;
    modifiedTime?: string;
    extension?: string;
}
