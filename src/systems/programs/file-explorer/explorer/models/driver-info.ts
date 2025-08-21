export interface DriverInfo {
    name: string;               // 驱动器名称，比如 "C:\"
    driveType: string;          // 驱动器类型，例如 "Fixed", "Removable"
    format: string | null;      // 文件系统格式，比如 "NTFS"
    totalSize: number;          // 总容量，字节
    availableFreeSpace: number; // 可用空间，字节
    volumeLabel: string;        // 卷标
}
