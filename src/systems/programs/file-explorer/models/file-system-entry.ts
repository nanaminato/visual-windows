export interface FileSystemEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    lastModified: string; // ISO字符串
}
