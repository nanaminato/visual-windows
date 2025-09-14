// screenshot.state.ts

export interface ScreenshotState {
    [windowId: string]: string; // key是窗口ID，value是截图字符串
}

export const initialScreenshotState: ScreenshotState = {};
