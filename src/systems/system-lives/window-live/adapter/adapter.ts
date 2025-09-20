import {Directive, EventEmitter, inject, Input, Output} from '@angular/core';
import {Store} from '@ngrx/store';
import {WindowActions} from '../../../system-services/state/window/window.actions';
import {ProgramEvent} from '../../../models';

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
    // @Output()
    // appEventEmitter: EventEmitter<ProgramEvent> = new EventEmitter<ProgramEvent>();
    //
    // hoverIn() {
    //     this.appEventEmitter.emit({
    //         type: 9,
    //         id: this.id!,
    //         event: 'hoverIn'
    //     });
    // }
    // hoverOut() {
    //     this.appEventEmitter.emit({
    //         type: 10,
    //         id: this.id!,
    //         event: 'hoverOut'
    //     });
    // }
}
@Directive()
export class ModalWindow{
    modalInit(){

    }
}
