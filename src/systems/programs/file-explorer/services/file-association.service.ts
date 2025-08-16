import {FileAssociation} from '../models';
import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class FileAssociationService {
    private storageKey = 'fileAssociations';

    private associations: FileAssociation[] = [];

    constructor() {
        this.load();
    }

    private load() {
        const json = localStorage.getItem(this.storageKey);
        if (json) {
            try {
                this.associations = JSON.parse(json);
            } catch {
                this.associations = [];
            }
        }
    }

    private save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.associations));
    }

    getAssociations(): FileAssociation[] {
        return [...this.associations];
    }

    getAssociationByExtension(ext: string): FileAssociation | undefined {
        ext = ext.toLowerCase();
        return this.associations.find(a => a.extension.toLowerCase() === ext);
    }

    addOrUpdateAssociation(assoc: FileAssociation) {
        const index = this.associations.findIndex(a => a.extension.toLowerCase() === assoc.extension.toLowerCase());
        if (index >= 0) {
            this.associations[index] = assoc;
        } else {
            this.associations.push(assoc);
        }
        this.save();
    }

    removeAssociation(ext: string) {
        this.associations = this.associations.filter(a => a.extension.toLowerCase() !== ext.toLowerCase());
        this.save();
    }
}
