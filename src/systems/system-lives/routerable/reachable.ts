import {
    Directive,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';

@Directive()
export class Reachable{
    @Input()
    path: string = '';

    @Input()
    routeDepth: number = 0;

    @Output()
    parentEmitter: EventEmitter<string> = new EventEmitter();

    noticePath(path: string) {
        this.parentEmitter.emit(path);
    }
}
