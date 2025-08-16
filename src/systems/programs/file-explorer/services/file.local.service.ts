import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class FileLocalService {
    private getExtension(filename: string): string {
        const idx = filename.lastIndexOf('.');
        return idx >= 0 ? filename.substring(idx).toLowerCase() : '';
    }
}
