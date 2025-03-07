// based on this memory can be handed to prompt in different ways
// prompt directly inserted into prompt
// conversation created messages
// instruction saved as instruction
// disconnected is related to assistant but disconnected from prompts
export type MemoryArea =
  | 'prompt'
  | 'conversation'
  | ' instruction'
  | 'disconnected';

export enum BrainRegion {
  INSTRUCTION = 'instruction', // Goes into system message
  PROMPT = 'prompt', // Prepended to user prompt
  CONVERSATION = 'conversation', // Added as message history
  REFERENCE = 'reference', // Owned but not directly included
  DISCONNECTED = 'disconnected', // Not connected to this assistant
}
