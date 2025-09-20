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

/**
 * 自定义程序的一个基类，可以继承该类来简化定义
 * **/
@Directive()
export class Program{
    @Input()
    id!: string;
    store = inject(Store);
    loaded(){
        this.store.dispatch(WindowActions.windowLoaded({id: this.id}))
    }
    @Output()
    appEventEmitter: EventEmitter<ProgramEvent> = new EventEmitter<ProgramEvent>();
    // taskbar 滑入磁贴时触发，用于“暂时激活程序”
    hoverIn() {
        console.log('super hoverIn');
        this.appEventEmitter.emit({
            type: 9,
            id: this.id!,
            event: 'hoverIn'
        });
    }
    // taskbar 滑出磁贴时触发，用于清除“暂时激活”
    hoverOut() {
        this.appEventEmitter.emit({
            type: 10,
            id: this.id!,
            event: 'hoverOut'
        });
    }
}
@Directive()
export class ModalWindow{
    modalInit(){

    }
}
