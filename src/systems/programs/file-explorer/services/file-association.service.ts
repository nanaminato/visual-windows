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
        this.initialize();
    }
    private initialize() {
        if(this.associations.length === 0) {
            this.associations = [
                {
                    programId: 'code-space',
                    programName: 'code space',
                    extensions: [
                        'css','js','ts','','txt','json','html','ini','md',
                        'cs','c','cpp','py','java','php','vue','tsx',
                        'log','mjs','gitignore',''
                    ],
                },
                {
                    programId: 'image-viewer',
                    programName: '图片查看器',
                    extensions: [
                        'png','svg','jpg','jpeg','png','gif','webp','webp',
                    ],
                }
            ];
        }
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
        return this.associations.find(a => a.extensions.findIndex(e=>ext===e)>-1);
    }

    addOrUpdateAssociation(assoc: FileAssociation) {
        const index = this.associations.findIndex(a => a.programId === assoc.programId);
        if (index >= 0) {
            let existingExtensions = this.associations[index].extensions;
            this.associations[index].extensions = [...existingExtensions, ...assoc.extensions];
        } else {
            this.associations.push(assoc);
        }
        this.save();
    }
}
