export interface FileEntry {
  name: string;
  path: string;              // 完整路径
  isDirectory: boolean;
  size?: number;
  modifiedAt?: Date;
}

export interface IFileSystemService {
  readDir(path: string): Promise<FileEntry[]>;
  readFile(path: string): Promise<string | ArrayBuffer>;
  writeFile(path: string, content: string | ArrayBuffer): Promise<void>;
  deleteEntry(path: string): Promise<void>;
  renameEntry(oldPath: string, newPath: string): Promise<void>;
  createDirectory(path: string): Promise<void>;
  uploadFile(path: string, file: File): Promise<void>;
  downloadFile(path: string): Promise<Blob>;
  watchPath(path: string, callback: (changes: FileEntry[]) => void): void; // 文件变化监听
  unwatchPath(path: string): void;
}
