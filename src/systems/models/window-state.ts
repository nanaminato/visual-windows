import {ProgramIcon} from './program-info';
export enum WindowStartupLocation{
    Manual,
    CenterWindow,
    CenterScreen
}
export interface Position{
    location?: WindowStartupLocation;
    left: number;
    top: number
}
export interface SetPosition{
    location?: WindowStartupLocation;
    left?: number;
    top?: number
}
export interface WindowState {
    id: string;                // 唯一窗口ID
    title: string;             // 窗口标题
    programId: string;             // 所属应用ID
    position: Position;
    size: { width: number; height: number };
    minimized: boolean;
    maximized: boolean;
    active: boolean;
    component?: any;            // 关联的Angular组件（独立组件）
    params?: any;              // 启动参数
    customHeader?: boolean;
    // 新增字段，保存最大化前的状态
    prevPosition?: Position;
    prevSize?: { width: number; height: number };

    parentId?: string;
    modal?: boolean;
    disabled?: boolean;
    closeWithParent?: boolean;
}
export interface GroupWindowState {
    programId: string;
    windowStates: WindowState[];
}
export interface ProgramConfig {
    programId: string;
    programName: string;
    isSingleton: boolean;
    stateful: boolean;
    preferredSize: { width: number; height: number };
    icon: ProgramIcon,
    programType:number;
}
/**
 public enum AppType
 {
 SystemApp = 1,// 系统程序
 NormalApp = 2,// 集成到本项目的程序
 WebApp = 3,// 其他项目的程序，通过frame访问
 }
 * */
