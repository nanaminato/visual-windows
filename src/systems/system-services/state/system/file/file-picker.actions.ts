import { createAction, props } from '@ngrx/store';

// 确认选择文件或文件夹，传递请求ID和选中的路径数组
export const filePickerConfirm = createAction(
    '[FilePicker] Confirm Selection',
    props<{ requestId: string; selectedPaths: string[] }>()
);

// 取消文件选择，传递请求ID
export const filePickerCancel = createAction(
    '[FilePicker] Cancel Selection',
    props<{ requestId: string }>()
);
