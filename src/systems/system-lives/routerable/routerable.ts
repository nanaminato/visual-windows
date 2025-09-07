import {
    AfterViewInit,
    ComponentRef, Directive,
    EventEmitter, Input,
    Output,
    Type,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import { Route, Routes } from '@angular/router';
import {Subscription} from 'rxjs';

@Directive()
export class Routable implements AfterViewInit {
    @Input()
    path: string = '';

    navigates: Routes = [];
    loaded: boolean = false;

    @Input()
    routeDepth: number = 0;

    component: Type<any> | undefined;
    private componentRef: ComponentRef<any> | undefined;

    // 父组件监听子组件的导航事件
    @Output()
    parentEmitter: EventEmitter<string> = new EventEmitter();

    @ViewChild('dynamic', {read: ViewContainerRef, static: false})
    private dynamic!: ViewContainerRef;

    private subscription?: Subscription;

    ngAfterViewInit() {
        // 父组件传入的全路径更新，初始化 fullPath
        this.navigateTo(this.path).catch(console.error);
    }

    /**
     * 导航到指定路径。这里path是全路径
     */
    async navigateTo(path: string): Promise<string> {
        if (path === this.path && this.loaded) {
            return path;
        }
        if(this.navigates.length === 0){
            return Promise.resolve(path);
        }
        const pathSegments = path.split('/');
        // console.log(pathSegments);
        const myPathSegment = pathSegments[this.routeDepth]??'';
        // console.log(`depth : ${this.routeDepth} `+"part "+ myPathSegment);


        const route = this.navigates.find((s) => s.path === myPathSegment);
        if (!route) {
            console.warn(`Route not found for path segment: ${myPathSegment}`);
            return Promise.resolve(path);
        }

        if (this.component === route.component && this.component !== undefined) {
            this.loaded = true; // 之前未设置loaded
            return Promise.resolve(path);
        }

        await this.loadComponent(route);

        this.path = path;
        this.loaded = true;

        // 如果有下级，继续通知子组件导航
        if (this.componentRef) {
            const instance = this.componentRef.instance as any;
            if (instance && typeof instance.navigateTo === 'function') {
                await instance.navigateTo(path);
            }
        }
        return path;
    }

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

        const instance = this.componentRef.instance as any;

        if (instance) {
            // 传递深度 +1
            if ('routeDepth' in instance) {
                instance.routeDepth = this.routeDepth + 1;
            }
            if ('parentFullPath' in instance) {
                instance.parentFullPath = this.path;
            }

            // 监听子组件发来的导航请求
            if (instance.parentEmitter && instance.parentEmitter.subscribe) {
                this.subscription = instance.parentEmitter.subscribe((nextPath: string) => {
                    this.navigateTo(nextPath).catch(console.error);
                });
            }
        }
    }

    /**
     * 向父组件发送导航请求
     */
    noticePath(path: string) {
        this.parentEmitter.emit(path);
    }
}
