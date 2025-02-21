export type MemoryDepth =
  | 'session'
  | 'disconnected'
  | 'short'
  | 'long'
  | 'deep';

export interface Message {
  id: string; // Unique identifier for the message
  owner: string;
  type: 'request' | 'response' | 'request-code' | 'response-code'; // Type of message (request or response)
  content: string; // The content of the message
  timestamp: string; // Timestamp for tracking the time of the message
}
