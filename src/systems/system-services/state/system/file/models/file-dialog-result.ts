export interface FileDialogResult {
    requestId: string;
    status: 'confirmed' | 'cancelled';
    selectedFiles?: string[];
}

export interface FileDialogResultsState {
    [requestId: string]: FileDialogResult | undefined;
}
