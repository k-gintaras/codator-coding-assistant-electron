export interface PipelineConnection {
  id: string;
  sourceAssistantId: string;
  targetAssistantId: string;
  relationshipType: string; // 'sends_to', 'depends_on', etc.
  dataMapping?: {
    sourceFields: string[];
    targetFields: string[];
  };
}

export interface PipelinePartResult {
  assistantId: string;
  input: string;
  output: string;
  status: string;
}

export interface PipelineExecutionResult {
  pipelineId: string;
  status: 'running' | 'completed' | 'failed';
  results: PipelinePartResult[];
}
