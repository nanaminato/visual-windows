type Crumb = { name: string, path: string };

export function buildBreadcrumbsForPath(rawPath: string, isLinux: boolean): Crumb[] {
    const breadcrumbs: Crumb[] = [];
    const raw = rawPath || '';

    if (isLinux) {
        if (!raw || raw === '/') return [{ name: '/', path: '/' }];
        const segs = raw.split('/').filter(s => s.length > 0);
        breadcrumbs.push({ name: '/', path: '/' });
        let acc = '';
        for (const seg of segs) {
            acc = acc === '' ? `/${seg}` : `${acc}/${seg}`;
            breadcrumbs.push({ name: seg, path: acc });
        }
    } else {
        if (!raw || raw === '/') return [{ name: '此电脑', path: '/' }];
        const cleaned = raw.replace(/\//g, '\\');
        const segs = cleaned.split('\\').filter(s => s.length > 0);
        if (segs.length === 0) return [{ name: '此电脑', path: '/' }];

        if (segs[0].includes(':')) {
            let acc = segs[0] + '\\';
            breadcrumbs.push({ name: segs[0], path: acc });
            for (let i = 1; i < segs.length; i++) {
                acc = acc.endsWith('\\') ? acc + segs[i] : acc + '\\' + segs[i];
                breadcrumbs.push({ name: segs[i], path: acc });
            }
        } else {
            let acc = '';
            for (const seg of segs) {
                acc = acc === '' ? seg : acc + '\\' + seg;
                breadcrumbs.push({ name: seg, path: acc });
            }
        }
    }

    // insert separators (pure)
    if (breadcrumbs.length > 1) {
        const sep = { name: '>', path: '' };
        return breadcrumbs.flatMap((item, i) => i < breadcrumbs.length - 1 ? [item, sep] : [item]);
    }
    return breadcrumbs;
}
