import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DriverInfo, FileNodeViewModel} from '../models';

@Component({
  selector: 'app-driver-list-view',
  imports: [],
  templateUrl: './driver-list-view.html',
  styleUrl: './driver-list-view.css'
})
export class DriverListView {
    @Input()
    drivers: DriverInfo[] = [];

    @Output()
    driverNavigate = new EventEmitter<any>();
    // 格式化字节为GB/MB等
    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
        return `${size} ${sizes[i]}`;
    }
    driverSelected($event: DriverInfo) {
        this.driverNavigate.emit($event);
    }
    // 根据驱动器类型返回图标类名或路径
    getDriveIcon(driveType: string): string {
        switch (driveType.toLowerCase()) {
            case 'fixed':
                return '🖴'; // 固定磁盘图标（你可以换成svg或图片）
            case 'removable':
                return '📀'; // 可移动磁盘图标
            case 'network':
                return '🌐'; // 网络驱动器
            case 'cdrom':
                return '💿'; // 光驱
            case 'ramdisk':
                return '⚡'; // RAM盘
            default:
                return '🗄️'; // 默认图标
        }
    }
}
