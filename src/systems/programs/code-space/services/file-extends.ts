export function getIconPath(name: string) {
    const index = name.lastIndexOf('.');
    if (index > -1) {
        const ext = name.substring(index + 1).toLowerCase();

        // Map<图标文件名, 后缀数组>
        const map: Map<string, string[]> = new Map([
            ['java.svg', ['java']],
            ['ts.svg', ['ts']],
            ['js.svg', ['js']],
            ['py.svg', ['py']],
            ['text.svg', ['txt']],
            ['md.svg', ['md']],
            ['html.svg', ['html', 'htm']],
            ['css.svg', ['css',"sass","less"]],
            ['json.svg', ['json']],
            ['xml.svg', ['xml']],
            ['image.svg', ['jpg', 'jpeg', 'svg', 'gif','png']],
            ['pdf.svg', ['pdf']],
            // 继续补充
        ]);

        for (const [icon, exts] of map.entries()) {
            if (exts.includes(ext)) {
                return `assets/icons/code-space/languages/${icon}`;
            }
        }
    }
    return `assets/icons/code-space/languages/text.svg`;
}
export function getFileLanguage(name: string) {
    const index = name.lastIndexOf('.');
    if (index > -1) {
        const ext = name.substring(index + 1).toLowerCase();

        // Map<图标文件名, 后缀数组>
        const map: Map<string, string[]> = new Map([
            ['java', ['java']],
            ['typescript', ['ts']],
            ['javascript', ['js']],
            ['python', ['py']],
            ['text', ['txt']],
            ['markdown', ['md']],
            ['html', ['html', 'htm']],
            ['css', ['css',"sass","less"]],
            ['json', ['json']],
            ['xml', ['xml']],
            ['image', ['jpg', 'jpeg', 'svg', 'gif','png']],
            // 继续补充
        ]);

        for (const [language, exts] of map.entries()) {
            if (exts.includes(ext)) {
                return `${language}`;
            }
        }
    }
    return `text`;
}
