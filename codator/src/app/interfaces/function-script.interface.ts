export interface FunctionScript {
  id: string; // Unique identifier
  name: string; // Human-readable name
  description?: string; // Optional description
  code: string; // JavaScript/TypeScript code as a string
  createdAt: Date;
  updatedAt: Date;
}
