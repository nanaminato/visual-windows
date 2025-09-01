import {Component, inject, Input} from '@angular/core';
import {LightFile} from '../file-explorer/explorer/models';
import {ExplorerService} from '../file-explorer/explorer/services/explorer.service';
import {HttpClient} from '@angular/common/http';
import {ServerService} from '../../system-services/server.service';

@Component({
  selector: 'app-image-viewer',
  imports: [
  ],
  templateUrl: './image-viewer.html',
  styleUrl: './image-viewer.css'
})
export class ImageViewer {
    @Input() file!: LightFile;

    translateX = 0;
    translateY = 0;

    private dragging = false;
    private dragStartX = 0;
    private dragStartY = 0;
    private lastTranslateX = 0;
    private lastTranslateY = 0;

    private explorerService = inject(ExplorerService);
    private http = inject(HttpClient);
    images: LightFile[] = [];
    currentIndex = 0;
    zoom = 1;
    readonly zoomStep = 0.1;
    readonly zoomMin = 0.1;
    readonly zoomMax = 10;

    imageSrc: string = '';

    ngOnInit(): void {
        if (!this.file) {
            console.error('ImageViewerComponent: file input is required');
            return;
        }
        const parentPath = this.getParentPath(this.file.path);
        this.explorerService.getFiles(parentPath)
            .then(files => {
                // 过滤图片文件
                this.images = files.filter(f => !f.isDirectory && this.isImageFile(f.name));
                this.currentIndex = this.images.findIndex(f => f.path === this.file.path);
                if (this.currentIndex === -1 && this.images.length > 0) {
                    this.currentIndex = 0;
                }
                this.updateImageSrc();
            })
            .catch(err => {
                console.error('加载图片文件失败', err);
            });
    }

    private getParentPath(path: string): string {
        const lastSlashIndex = path.lastIndexOf('/');
        if (lastSlashIndex > -1) return path.substring(0, lastSlashIndex);
        let index = path.lastIndexOf('\\');
        return path.substring(0, index);
    }

    private isImageFile(name: string): boolean {
        const ext = name.toLowerCase().split('.').pop() || '';
        return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
    }

    zoomIn(): void {
        this.zoom = Math.min(this.zoom + this.zoomStep, this.zoomMax);
        this.resetTranslate();
    }

    zoomOut(): void {
        this.zoom = Math.max(this.zoom - this.zoomStep, this.zoomMin);
        this.resetTranslate();
    }

    resetZoom(): void {
        this.zoom = 1;
        this.resetTranslate();
    }

    resetTranslate(): void {
        this.translateX = 0;
        this.translateY = 0;
        this.lastTranslateX = 0;
        this.lastTranslateY = 0;
    }

    onDragStart(event: MouseEvent): void {
        event.preventDefault();
        this.dragging = true;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
        // 改变光标样式
        (event.target as HTMLElement).style.cursor = 'grabbing';
    }

    onDragMove(event: MouseEvent): void {
        if (!this.dragging) return;
        event.preventDefault();
        const deltaX = event.clientX - this.dragStartX;
        const deltaY = event.clientY - this.dragStartY;
        this.translateX = this.lastTranslateX + deltaX;
        this.translateY = this.lastTranslateY + deltaY;
    }

    onDragEnd(event: MouseEvent): void {
        if (!this.dragging) return;
        event.preventDefault();
        this.dragging = false;
        this.lastTranslateX = this.translateX;
        this.lastTranslateY = this.translateY;
        // 恢复光标样式
        (event.target as HTMLElement).style.cursor = 'grab';
    }

    // 在切换图片时重置平移和缩放
    prev(): void {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.resetZoom();
            this.updateImageSrc();
        }
    }

    next(): void {
        if (this.currentIndex < this.images.length - 1) {
            this.currentIndex++;
            this.resetZoom();
            this.updateImageSrc();
        }
    }


    onImageError(): void {
        console.warn('图片加载失败:', this.images[this.currentIndex].path);
    }
    private serverService = inject(ServerService);
    private updateImageSrc(): Promise<string> {
        const pathParam = this.images[this.currentIndex].path;
        const baseUrl = this.serverService.getServerBase()+'/api/v1/fileSystem/download-file';
        return new Promise<string>((resolve, reject) => {
            this.http.post(baseUrl, { path: pathParam }, { responseType: 'blob' }).subscribe({
                next: (blob: Blob) => {
                    // 释放之前的 URL 对象
                    if (this.imageSrc && this.imageSrc.startsWith('blob:')) {
                        URL.revokeObjectURL(this.imageSrc);
                    }
                    this.imageSrc = URL.createObjectURL(blob);
                    resolve(this.imageSrc);
                },
                error: (err) => {
                    reject(err);
                }
            });
        });

    }
}
