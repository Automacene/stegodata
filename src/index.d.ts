export interface StegoInjectOptions {
  namespace: string;
  contentType?: string;
  schema?: string;
  headers?: Record<string, string>;
  payload: any;
}

export interface StegoBlock {
  namespace: string;
  contentType: string;
  schema?: string;
  headers: Record<string, string>;
  payload: any;
  rawPayload: Uint8Array;
}

export class StegoData {
  static inject(
    fileData: Uint8Array | ArrayBuffer | Blob | File,
    options: StegoInjectOptions
  ): Promise<Uint8Array>;

  static extract(
    fileData: Uint8Array | ArrayBuffer | Blob | File
  ): Promise<StegoBlock[]>;

  static registerAdapter(extensionOrMime: string, adapter: any): void;
}

export class BaseAdapter {
  inject(fileBuffer: Uint8Array, blockBytes: Uint8Array): Uint8Array;
  extract(fileBuffer: Uint8Array): Uint8Array[];
}