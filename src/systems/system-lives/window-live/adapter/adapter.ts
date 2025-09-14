import {Directive, EventEmitter, inject, Input, Output} from '@angular/core';
import {Store} from '@ngrx/store';
import {WindowActions} from '../../../system-services/state/window/window.actions';

export interface processClose {
    parentClosed(): void;
}
export interface processSizeChange {
    parentSizeChange(): void;
}
@Directive()
export class Program{
    @Input()
    id!: string;
    store = inject(Store);
    loaded(){
        this.store.dispatch(WindowActions.windowLoaded({id: this.id}))
    }
}
@Directive()
export class ModalWindow{
    modalInit(){

    }
}
