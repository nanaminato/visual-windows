export const componentMap: Map<string, () => Promise<any>> = new Map([
    ['terminal', () => import("./terminal/terminal.component")
        .then(m => m.TerminalComponent)
    ]
]);
