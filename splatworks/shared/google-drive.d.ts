export interface DriveOptions { appName: string; clientId?: string }
export interface DriveSaveOptions extends DriveOptions { fileName: string; buildFile: () => Blob | Promise<Blob> }
export interface DriveFile { id: string; name: string; webViewLink: string }
export function saveToGoogleDrive(options: DriveSaveOptions): Promise<DriveFile | null>;
export function openFromGoogleDrive(options: DriveOptions & { fileId: string }): Promise<Blob | null>;
export function connectGoogleDrive(options: DriveOptions): Promise<boolean | null>;
