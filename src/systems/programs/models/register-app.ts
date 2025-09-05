export const terminalProgram = 'terminal';
export const fileExplorerProgram = 'file-explorer';
export const codeSpaceProgram = 'code-space';
export const imageViewerProgram = 'image-viewer';
export const filePickerProgram = 'file-picker';

export const componentMap: Map<string, () => Promise<any>> = new Map([
    [terminalProgram, () => import("../terminal/terminal.component")
        .then(m => m.TerminalComponent)
    ],
    [
        fileExplorerProgram,
        ()=> import("../file-explorer/multi-explorer/multi-explorer")
            .then(f=>f.MultiExplorer),
    ],
    [
        codeSpaceProgram,
        ()=> import("../code-space/code-space")
        .then(m => m.CodeSpace),
    ],
    [
        imageViewerProgram,
        ()=> import("../image-viewer/image-viewer")
        .then(m => m.ImageViewer),
    ],
    [
        filePickerProgram,
        ()=> import('../file-explorer/file-picker/file-picker')
        .then(m => m.FilePicker),
    ]
]);
export const programWithCustomHeaders = [
    fileExplorerProgram,
    codeSpaceProgram
]
