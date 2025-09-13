import {Directive, EventEmitter, Output} from '@angular/core';

export interface processClose {
    parentClosed(): void;
}
export interface processSizeChange {
    parentSizeChange(): void;
}
@Directive()
export class ModalWindow{
    modalInit(){

    }
}
