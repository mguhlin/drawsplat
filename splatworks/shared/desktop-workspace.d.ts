export interface DesktopReplacement { verify():void; finish():void; }
export interface DesktopWorkspace {
 readonly dirty:boolean; changed():void;acceptCurrent():void;
 beginReplace():Promise<DesktopReplacement|null>; save():Promise<boolean>;
}
export function desktopHost():any;
export const transientStorage:Storage;
export function createDesktopWorkspace<T>(id:string,options:{snapshot:()=>T;pending?:()=>unknown;file:(value:T)=>{blob:Blob;name:string}|Promise<{blob:Blob;name:string}>;status?:(message:string)=>void;open:()=>void;openFile:(file:File)=>unknown;help?:()=>void}):DesktopWorkspace|null;
