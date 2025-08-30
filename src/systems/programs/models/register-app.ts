export const componentMap: Map<string, () => Promise<any>> = new Map([
    ['terminal', () => import("../terminal/terminal.component")
        .then(m => m.TerminalComponent)
    ],
    [
        'file-explorer',
        ()=> import("../file-explorer/multi-explorer/multi-explorer")
            .then(f=>f.MultiExplorer),
    ],
    [
        'code-space',
        ()=> import("../code-space/code-space")
        .then(m => m.CodeSpace),
    ],
    [
        'univer',
        ()=>import("../univer/univer")
            .then(c=>c.UniverComponent)
    ]
]);
export const programWithCustomHeaders = [
    'file-explorer',
    'code-space'
]
