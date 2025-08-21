export interface LightFile{
    name: string,
    path: string,
    isDirectory: boolean,
    size?: number;
    lastModified: Date;
}
