import {Component, ElementRef, Input, SimpleChanges, ViewChild} from '@angular/core';

@Component({
  selector: 'app-split-panel',
  imports: [],
  templateUrl: './split-panel.html',
  styleUrl: './split-panel.css'
})
export class SplitPanel {
    @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

    private _leftVisible = false;
    @Input()
    set leftVisible(value: boolean) {
        if (value !== this._leftVisible) {
            this._leftVisible = value;
            this.updateVisibility();
        }
    }
    get leftVisible(): boolean {
        return this._leftVisible;
    }

    @Input() minLeft: string = '5%';
    @Input() minRight: string = '5%';

    /**
     * 新增：初始化左边大小，支持 "40%" 或 "300px"
     */
    @Input() leftSize: string = '50%';

    leftPercent = 50;
    rightPercent = 50;

    private savedLeftPercent = 50;
    private savedRightPercent = 50;

    private dragging = false;

    private resizeObserver!: ResizeObserver;

    ngOnChanges(changes: SimpleChanges): void {
        if ('minLeft' in changes || 'minRight' in changes) {
            this.parseMins();
        }
        if ('leftSize' in changes) {
            this.parseLeftSize();
        }
    }

    ngOnDestroy(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    private updateContainerWidth() {
        if (this.containerRef && this.containerRef.nativeElement) {
            this.containerWidth = this.containerRef.nativeElement.clientWidth;
        }
    }

    private parseMinValue(value: string): number {
        if (!value) return 0;
        value = value.trim().toLowerCase();

        if (value.endsWith('px')) {
            const px = parseFloat(value);
            return isNaN(px) ? 0 : px;
        } else if (value.endsWith('%')) {
            const percent = parseFloat(value);
            if (isNaN(percent)) return 0;
            return (percent / 100) * this.containerWidth;
        } else {
            const px = parseFloat(value);
            return isNaN(px) ? 0 : px;
        }
    }

    private pxToPercent(px: number): number {
        if (this.containerWidth === 0) return 0;
        return (px / this.containerWidth) * 100;
    }

    /**
     * 解析 leftSize 输入，转换为百分比，赋值给 leftPercent
     */
    private parseLeftSize() {
        if (!this.leftSize) {
            this.leftPercent = 50;
            this.rightPercent = 50;
            return;
        }
        const val = this.leftSize.trim().toLowerCase();

        if (val.endsWith('px')) {
            const px = parseFloat(val);
            if (isNaN(px) || this.containerWidth === 0) {
                this.leftPercent = 50;
            } else {
                this.leftPercent = Math.min(100, (px / this.containerWidth) * 100);
            }
        } else if (val.endsWith('%')) {
            const percent = parseFloat(val);
            if (isNaN(percent)) {
                this.leftPercent = 50;
            } else {
                this.leftPercent = Math.min(100, percent);
            }
        } else {
            // 无单位默认像素
            const px = parseFloat(val);
            if (isNaN(px) || this.containerWidth === 0) {
                this.leftPercent = 50;
            } else {
                this.leftPercent = Math.min(100, (px / this.containerWidth) * 100);
            }
        }

        // 右边百分比
        this.rightPercent = 100 - this.leftPercent;

        // 保存当前值
        this.savedLeftPercent = this.leftPercent;
        this.savedRightPercent = this.rightPercent;
    }

    private updateVisibility() {
        if (this._leftVisible) {
            this.leftPercent = this.savedLeftPercent;
            this.rightPercent = this.savedRightPercent;
        } else {
            this.savedLeftPercent = this.leftPercent;
            this.savedRightPercent = this.rightPercent;

            this.leftPercent = 0;
            this.rightPercent = 100;
        }
    }

    onDragStart(event: MouseEvent) {
        if (!this._leftVisible) {
            return;
        }
        event.preventDefault();
        this.dragging = true;
        document.addEventListener('mousemove', this.onDragMove);
        document.addEventListener('mouseup', this.onDragEnd);
    }
    private containerWidth = 0;

    private minLeftPx = 0;
    private minRightPx = 0;

    private minLeftPercent = 0;
    private minRightPercent = 0;

    private parseMins() {
        this.minLeftPx = this.parseMinValue(this.minLeft);
        this.minRightPx = this.parseMinValue(this.minRight);

        // 再把 px 转为百分比用于限制输入和显示
        this.minLeftPercent = this.pxToPercent(this.minLeftPx);
        this.minRightPercent = this.pxToPercent(this.minRightPx);
    }

    private onResize() {
        this.updateContainerWidth();
        this.parseMins();

        // 修正当前leftPercent不小于最小限制
        if (this.leftPercent < this.minLeftPercent) {
            this.leftPercent = this.minLeftPercent;
        }
        if (this.rightPercent < this.minRightPercent) {
            this.rightPercent = this.minRightPercent;
        }
        this.rightPercent = 100 - this.leftPercent;

        // 保存当前有效的值
        this.savedLeftPercent = this.leftPercent;
        this.savedRightPercent = this.rightPercent;
    }

// ngAfterViewInit 里初始化 ResizeObserver：
    ngAfterViewInit() {
        this.updateContainerWidth();
        this.parseMins();
        this.parseLeftSize();
        this.onResize(); // 先调用一次

        this.resizeObserver = new ResizeObserver(() => {
            this.onResize();
        });
        this.resizeObserver.observe(this.containerRef.nativeElement);
        this.updateVisibility();
    }

    onDragMove = (event: MouseEvent) => {
        if (!this.dragging) return;

        const rect = this.containerRef.nativeElement.getBoundingClientRect();
        let offsetX = event.clientX - rect.left;

        if (offsetX < this.minLeftPx) {
            offsetX = this.minLeftPx;
        }
        if (offsetX > rect.width - this.minRightPx) {
            offsetX = rect.width - this.minRightPx;
        }

        const newLeftPercent = (offsetX / rect.width) * 100;

        this.leftPercent = newLeftPercent;
        this.rightPercent = 100 - newLeftPercent;

        this.savedLeftPercent = this.leftPercent;
        this.savedRightPercent = this.rightPercent;
    };

    onDragEnd = (event: MouseEvent) => {
        this.dragging = false;
        document.removeEventListener('mousemove', this.onDragMove);
        document.removeEventListener('mouseup', this.onDragEnd);
    };
}
