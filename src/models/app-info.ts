export interface AppInfo {
  id: string;                // 应用唯一ID
  name: string;              // 应用名称
  icon?: AppIcon;             // 图标URL或class
  component?: any;            // 关联的Angular组件（独立组件）
  params?: any;              // 启动参数
}
export interface AppIcon{
  iconType: number;
  name: string;
}
/*
public enum IconType
{
    MaterialIcon = 1,// angular material 框架icon
    LinkIcon = 2,//外部链接icon
    AssetsIcon = 3,//项目资源icon
    ServerIcon = 4,//第三方app，指定之后，后端将图片放置到指定位置
}
 */
