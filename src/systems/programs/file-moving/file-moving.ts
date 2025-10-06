import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {Routable} from '../../feature/routerable/routerable';
import {Store} from '@ngrx/store';
import {WindowActions} from '../../system-services/state/window/window.actions';
import {ProgramEvent} from '../../models';
import {FileOperation} from '../../system-services/state/file-opertation/file-operation';

@Component({
  selector: 'app-file-moving',
  imports: [],
  templateUrl: './file-moving.html',
  styleUrl: './file-moving.css'
})
export class FileMoving extends Routable{
    @Input()
    operation: FileOperation | undefined;





    /**program 的实现
     * */
    @Input()
    id!: string;
    store = inject(Store);
    programLoaded(){
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
