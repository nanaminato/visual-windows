export interface ClipboardState {
    operation: 'copy' | 'cut' | null;
    files: string[]; // 这里用string代表文件路径，可以根据实际情况调整
}
export const COPY = 'copy' as const;
export const CUT = 'cut' as const;
