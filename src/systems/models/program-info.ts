export interface ProgramInfo {
  id: string;                // 应用唯一ID
  name: string;              // 应用名称
  icon?: ProgramIcon;             // 图标URL或class

}
export interface ProgramIcon {
  iconType: number;
  name: string;
}
export interface ProgramEvent {
  type: number;
  id: string;
  event: any;
  parentId?: string;
}
/*
* 1 focus window
* 2 mini window
* 3 maxi window
* 4 close window
* 5 drag
*
* **/
/*
public enum IconType
{
    MaterialIcon = 1,// angular material 框架icon
    LinkIcon = 2,//外部链接icon
    AssetsIcon = 3,//项目资源icon
    ServerIcon = 4,//第三方app，指定之后，后端将图片放置到指定位置
}
 */
