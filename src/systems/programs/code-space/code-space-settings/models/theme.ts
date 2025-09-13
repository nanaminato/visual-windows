export interface CodeSpaceSettingsModel {
    theme: 'vs-light' | 'vs-dark' | string;
    // 未来可以加入更多字段
    [key: string]: any;
}

export const DEFAULT_SETTINGS: CodeSpaceSettingsModel = {
    theme: 'vs-light'
};
