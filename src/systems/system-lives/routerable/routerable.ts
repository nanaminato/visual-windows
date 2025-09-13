import {
    AfterViewInit,
    ComponentRef, Directive,
    EventEmitter, inject, Injector, Input,
    Output,
    Type,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import { Route, Routes } from '@angular/router';
import {Subscription} from 'rxjs';
import { AnimationBuilder, AnimationPlayer } from '@angular/animations';
import { animate, style } from '@angular/animations';
import {Reachable} from './reachable';

@Directive()
export class Routable extends Reachable implements AfterViewInit {
    private currentComponentRef?: ComponentRef<any>;
    private previousComponentRef?: ComponentRef<any>;

    navigates: Routes = [];
    loaded: boolean = false;

    private animationBuilder: AnimationBuilder = inject(AnimationBuilder);
    private injector: Injector = inject(Injector);

    component: Type<any> | undefined;
    private componentRef: ComponentRef<any> | undefined;

    // 父组件监听子组件的导航事件

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
                console.log('navigateTo ', path);
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

        if (this.currentComponentRef) {
            this.previousComponentRef = this.currentComponentRef;
        }

        this.currentComponentRef = this.dynamic.createComponent(componentType, { injector: this.injector });
        const newEl = this.currentComponentRef.location.nativeElement as HTMLElement;
        newEl.style.position = 'absolute';
        newEl.style.top = '0';
        newEl.style.left = '0';
        newEl.style.width = '100%';
        newEl.style.height = '100%';
        newEl.style.opacity = '0';

        const oldEl = this.previousComponentRef?.location.nativeElement as HTMLElement | undefined;
        if (oldEl) {
            oldEl.style.position = 'absolute';
            oldEl.style.top = '0';
            oldEl.style.left = '0';
            oldEl.style.width = '100%';
            oldEl.style.height = '100%';
            oldEl.style.opacity = '1';
        }

        // **关键改动**：不要等待动画，动画异步执行
        this.crossFadeAnimation(newEl, oldEl).then(() => {
            if (this.previousComponentRef) {
                this.previousComponentRef.destroy();
                this.previousComponentRef = undefined;
            }
            // 恢复样式
            newEl.style.position = '';
            newEl.style.top = '';
            newEl.style.left = '';
            newEl.style.width = '';
            newEl.style.height = '';
            newEl.style.opacity = '';
        });

        // 传递参数，订阅事件，立即执行，不等待动画
        const instance = this.currentComponentRef.instance as any;
        if (instance) {
            if ('routeDepth' in instance) {
                instance.routeDepth = this.routeDepth + 1;
            }
            if ('parentFullPath' in instance) {
                instance.parentFullPath = this.path;
            }
            if (instance.parentEmitter && instance.parentEmitter.subscribe) {
                this.subscription = instance.parentEmitter.subscribe((nextPath: string) => {
                    this.navigateTo(nextPath).catch(console.error);
                });
            }
        }
    }

    private crossFadeAnimation(newEl: HTMLElement, oldEl?: HTMLElement): Promise<void> {
        return new Promise((resolve) => {
            const animation = this.animationBuilder.build([
                style({ opacity: 0 }),
                animate('400ms ease', style({ opacity: 1 }))
            ]);
            const playerNew = animation.create(newEl);

            let playerOld: AnimationPlayer | undefined;
            if (oldEl) {
                const animationOld = this.animationBuilder.build([
                    style({ opacity: 1 }),
                    animate('400ms ease', style({ opacity: 0 }))
                ]);
                playerOld = animationOld.create(oldEl);
            }

            let doneCount = 0;
            const done = () => {
                doneCount++;
                if (doneCount === (playerOld ? 2 : 1)) {
                    resolve();
                }
            };

            playerNew.onDone(done);
            playerNew.play();

            if (playerOld) {
                playerOld.onDone(done);
                playerOld.play();
            }
        });
    }
}
