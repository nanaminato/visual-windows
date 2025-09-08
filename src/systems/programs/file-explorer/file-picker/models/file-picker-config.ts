export interface FilePickerConfig {
    selectFolders?: boolean; // 是否可选择文件夹，默认false
    multiSelect?: boolean;   // 是否多选，默认false
    maxSelectCount?: number; // 最大选择数量，默认无限制
    filterExts?: string[];   // 允许的文件扩展名列表，空或undefined则不过滤

    mode?: 'selector' | 'save';

    requestId: string;
    startPath?: string;


    filePath?: string;
    fileExtensions?: string[];
}
