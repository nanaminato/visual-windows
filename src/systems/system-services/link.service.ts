import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LinkService {
    private map = new Map<string, any>();

    /**
     * 添加映射
     * @param id 唯一标识符
     * @param instance 对应的实例
     */
    add(id: string, instance: any): void {
        this.map.set(id, instance);
    }

    /**
     * 查找映射
     * @param id 唯一标识符
     * @returns 对应的实例，找不到则返回 undefined
     */
    get(id: string): any | undefined {
        return this.map.get(id);
    }

    /**
     * 删除映射
     * @param id 唯一标识符
     * @returns 是否删除成功
     */
    remove(id: string): boolean {
        return this.map.delete(id);
    }

    /**
     * 清空所有映射
     */
    clear(): void {
        this.map.clear();
    }

    /**
     * 判断映射中是否存在指定 id
     * @param id 唯一标识符
     * @returns 是否存在
     */
    has(id: string): boolean {
        return this.map.has(id);
    }
}
