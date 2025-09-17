import {LightFile} from '../explorer/models';

// 计算文件类型显示文本
export function getFileType(file: LightFile): string {
    if (file.isDirectory) {
        return '文件夹';
    }
    // 简单根据扩展名判断类型，也可以更复杂
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    switch (ext) {
        case 'txt': return '文本文档';
        case 'jpg':
        case 'jpeg':
        case 'png': return '图片';
        case 'exe': return '应用程序';
        case 'pdf': return 'PDF 文件';
        default: return ext ? ext.toUpperCase() + ' 文件' : '文件';
    }
}

// 格式化大小，单位自动转换
export function formatSize(size?: number): string {
    if (size === undefined) return '';
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB';
    return (size / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}
