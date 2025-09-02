import {
    AfterViewInit,
    ComponentRef, Directive,
    EventEmitter,
    Output,
    Type,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import { Route, Routes } from '@angular/router';
import {Subscription} from 'rxjs';

@Directive()
export class Routable implements AfterViewInit {
    path: string = '';
    navigates: Routes = [];
    loaded: boolean = false;

    component: Type<any> | undefined;
    private componentRef: ComponentRef<any> | undefined;

    @Output()
    parentEmitter: EventEmitter<string> = new EventEmitter();

    // ingore
    @ViewChild('dynamic', { read: ViewContainerRef, static: false })
    private dynamic!: ViewContainerRef;

    ngAfterViewInit() {
        const navResult = this.navigateTo(this.path);
        if (navResult) {
            navResult.then((path) => {
                this.path = path;
                this.loaded = true;
            });
        }
    }

    /**
     * 导航到指定路径，返回 Promise<string> 表示导航完成的路径
     */
    navigateTo(path: string): Promise<string> | undefined {
        if (path === this.path && this.loaded) {
            return undefined;
        }

        const route = this.navigates.find((s) => s.path === path);
        if (!route) {
            console.warn(`Route not found for path: ${path}`);
            return undefined;
        }
        if (this.component === route.component && this.component !== undefined) {
            return undefined;
        }
        return new Promise<string>((resolve, reject) => {
            this.loadComponent(route)
                .then(() => resolve(path))
                .catch((err) => reject(err));
        });
    }
    subscription?: Subscription;
    /**
     * 加载路由对应的组件
     */
    async loadComponent(route: Route): Promise<void> {
        if (!this.dynamic) {
            console.error('ViewContainerRef not initialized');
            return;
        }
        this.subscription?.unsubscribe();
        this.dynamic.clear();

        let componentType: Type<any>;

        if (route.component) {
            componentType = route.component;
        } else if (route.loadComponent) {
            // @ts-ignore
            componentType = await route.loadComponent();
        } else {
            console.error('No component or loadComponent found in route:', route);
            return;
        }

        this.component = componentType;
        this.componentRef = this.dynamic.createComponent(componentType);

        // 订阅子组件的 parentEmitter 事件
        const instance = this.componentRef.instance as any;
        if (instance.parentEmitter && instance.parentEmitter.subscribe) {
            this.subscription = this.parentEmitter.subscribe((deliver: string) => {
                this.navigateTo(deliver);
            });
        }
    }

    /**
     * 向父组件发送通知
     */
    noticePath(path: string) {
        this.parentEmitter.emit(path);
    }
}
