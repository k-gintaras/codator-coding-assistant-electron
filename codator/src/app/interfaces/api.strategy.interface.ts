export interface ApiStrategy {
  processText(input: string): Promise<string>;
  getFile?(path: string): Promise<File | null>;
  saveFile?(path: string, data: Blob): Promise<void>;
}
