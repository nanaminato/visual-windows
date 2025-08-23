// file-path.utils.ts

export function normalizePath(path: string, isLinux: boolean): string {
    return isLinux ? path : path.replace(/\//g, '\\');
}

export function getParentPath(path: string, isLinux: boolean): string {
    if (!path) return '';
    let normalizedPath = path.replace(/\\/g, '/');
    if (normalizedPath === '/' || normalizedPath === '') return normalizedPath;

    if (normalizedPath.endsWith('/')) {
        normalizedPath = normalizedPath.slice(0, -1);
    }

    const lastSepIndex = normalizedPath.lastIndexOf('/');
    if (lastSepIndex === -1) {
        normalizedPath = isLinux ? '/' : '';
    } else if (lastSepIndex === 0) {
        normalizedPath = '/';
    } else {
        normalizedPath = normalizedPath.substring(0, lastSepIndex);
    }

    if (!isLinux && normalizedPath.length === 2 && normalizedPath[1] === ':') {
        normalizedPath += '\\';
    }

    return normalizedPath;
}

export function isAbsolutePath(path: string, isLinux: boolean): boolean {
    if (isLinux) {
        return path.startsWith('/');
    } else {
        if (/^[a-zA-Z]:[\\/]/.test(path)) return true;
        if (path.startsWith('\\\\')) return true;
        return path.startsWith('\\');
    }
}

export function resolveRelativePath(base: string, relative: string, isLinux: boolean): string {
    base = base.replace(/\\/g, '/');
    relative = relative.replace(/\\/g, '/');

    if (!isLinux) {
        const driveRegex = /^([a-zA-Z]):/;
        const baseDriveMatch = base.match(driveRegex);
        let drive = '';
        let basePathWithoutDrive = base;

        if (baseDriveMatch) {
            drive = baseDriveMatch[1] + ':';
            basePathWithoutDrive = base.substring(drive.length);
        }

        let baseParts = basePathWithoutDrive.split('/').filter(p => p.length > 0);
        let relativeParts = relative.split('/').filter(p => p.length > 0);

        for (const part of relativeParts) {
            if (part === '.') continue;
            else if (part === '..') {
                if (baseParts.length > 0) baseParts.pop();
            } else {
                baseParts.push(part);
            }
        }

        let resolvedPath = drive;
        if (baseParts.length > 0) {
            resolvedPath += '\\' + baseParts.join('\\');
        } else {
            resolvedPath += '\\';
        }
        return resolvedPath;
    } else {
        let baseParts = base.split('/').filter(p => p.length > 0);
        let relativeParts = relative.split('/').filter(p => p.length > 0);

        for (const part of relativeParts) {
            if (part === '.') continue;
            else if (part === '..') {
                if (baseParts.length > 0) baseParts.pop();
            } else {
                baseParts.push(part);
            }
        }

        return '/' + baseParts.join('/');
    }
}

export function isRootPath(path: string, isLinux: boolean): boolean {
    if (isLinux) {
        return path === '/' || path === '';
    } else {
        const regex = /^[a-zA-Z]:\\$/;
        return regex.test(path);
    }
}

export function generateTitle(path: string, isLinux: boolean): string {
    if (path.length === 1) {
        return "此电脑";
    } else if (!isLinux && path.length <= 3) {
        return `本地磁盘(${path.substring(0, 2)})`;
    } else {
        const left = path.lastIndexOf('/');
        if (left === -1) {
            const right = path.lastIndexOf('\\');
            return path.substring(right + 1);
        } else {
            return path.substring(left + 1);
        }
    }
}
