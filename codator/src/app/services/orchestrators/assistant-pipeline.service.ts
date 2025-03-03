import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { AssistantService } from '../assistants-api/assistant.service';
import {
  RelationshipGraphService,
  Relationship,
} from '../assistants-api/relationship-graph.service';
import { TaskService } from '../assistants-api/task.service';

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

@Injectable({
  providedIn: 'root',
})
export class AssistantPipelineService {
  // Keep track of active pipeline executions
  private activePipelines = new Map<string, PipelineExecutionResult>();

  constructor(
    private relationshipService: RelationshipGraphService,
    private assistantService: AssistantService,
    private taskService: TaskService
  ) {}

  /**
   * Create a connection between two assistants using the relationship graph
   */
  async createConnection(
    sourceId: string,
    targetId: string,
    type:
      | 'related_to'
      | 'part_of'
      | 'example_of'
      | 'derived_from'
      | 'depends_on'
      | 'blocks'
      | 'subtask_of' = 'related_to'
  ): Promise<string> {
    // First check if assistants exist
    const sourceAssistant = await this.assistantService.getAssistantById(
      sourceId
    );
    const targetAssistant = await this.assistantService.getAssistantById(
      targetId
    );

    if (!sourceAssistant || !targetAssistant) {
      throw new Error('Source or target assistant does not exist');
    }

    // Create the relationship in the graph
    const relationshipId = await this.relationshipService.addRelationship(
      sourceId,
      'assistant', // Type is assistant
      targetId, // Target ID is the source assistant
      type // Relationship type (casting as any since 'sends_to' might not be in the original types)
    );

    if (!relationshipId) {
      throw new Error('Failed to create connection');
    }

    return relationshipId;
  }

  /**
   * Get all connections for an assistant (both incoming and outgoing)
   */
  async getAssistantConnections(assistantId: string): Promise<{
    incoming: PipelineConnection[];
    outgoing: PipelineConnection[];
  }> {
    // Get all relationships where this assistant is the source
    const outgoingRelationships =
      await this.relationshipService.getRelationshipsBySource(assistantId);

    // For incoming, we need to fetch all relationships and filter
    const allRelationships =
      await this.relationshipService.getAllRelationships();
    const incomingRelationships = allRelationships.filter(
      (rel) => rel.type === 'assistant' && rel.targetId !== assistantId
    );

    // Convert relationships to PipelineConnection format
    const outgoing = await this.relationshipsToConnections(
      outgoingRelationships,
      assistantId,
      'source'
    );
    const incoming = await this.relationshipsToConnections(
      incomingRelationships,
      assistantId,
      'target'
    );

    return { incoming, outgoing };
  }

  /**
   * Execute a pipeline starting from a specific assistant
   */
  async executePipeline(
    startAssistantId: string,
    initialInput: string
  ): Promise<PipelineExecutionResult> {
    // Create a new pipeline execution
    const pipelineId = uuidv4();
    const pipelineExecution: PipelineExecutionResult = {
      pipelineId,
      status: 'running',
      results: [],
    };

    // Store the execution
    this.activePipelines.set(pipelineId, pipelineExecution);

    try {
      // Start with the first assistant
      await this.executeAssistantStep(
        startAssistantId,
        initialInput,
        pipelineExecution
      );

      // Update status once complete
      pipelineExecution.status = 'completed';
    } catch (error) {
      console.error('Pipeline execution failed:', error);
      pipelineExecution.status = 'failed';
    }

    return pipelineExecution;
  }

  /**
   * Get downstream assistants in the pipeline
   */
  async getDownstreamAssistants(assistantId: string): Promise<string[]> {
    const { outgoing } = await this.getAssistantConnections(assistantId);
    return outgoing.map((conn) => conn.targetAssistantId);
  }

  /**
   * Get upstream assistants in the pipeline
   */
  async getUpstreamAssistants(assistantId: string): Promise<string[]> {
    const { incoming } = await this.getAssistantConnections(assistantId);
    return incoming.map((conn) => conn.sourceAssistantId);
  }

  /**
   * Helper method to convert relationship entities to PipelineConnection objects
   */
  private async relationshipsToConnections(
    relationships: Relationship[],
    assistantId: string,
    role: 'source' | 'target'
  ): Promise<PipelineConnection[]> {
    const connections: PipelineConnection[] = [];

    for (const rel of relationships) {
      // For each relationship, we need to determine the source and target assistants
      let sourceId: string;
      let targetId: string;

      if (role === 'source') {
        sourceId = assistantId;
        targetId = rel.targetId;
      } else {
        sourceId = rel.targetId;
        targetId = assistantId;
      }

      connections.push({
        id: rel.id,
        sourceAssistantId: sourceId,
        targetAssistantId: targetId,
        relationshipType: rel.relationshipType,
      });
    }

    return connections;
  }

  /**
   * Execute a single step in the pipeline using an assistant
   */
  private async executeAssistantStep(
    assistantId: string,
    input: string,
    pipelineExecution: PipelineExecutionResult
  ): Promise<void> {
    // const taskId = await this.taskService.addTask({
    //   description: `Pipeline ${pipelineExecution.pipelineId} Step`,
    //   assignedAssistant: assistantId,
    //   inputData: input,
    //   status: 'pending',
    // });

    // if (!taskId) {
    //   throw new Error(`Failed to create task for assistant ${assistantId}`);
    // }

    // Mark as in progress
    // await this.taskService.updateTask(taskId, { status: 'in_progress' });

    try {
      // Wait for the assistant to process the task
      // Note: This would be asynchronous in a real system with callbacks/polling
      // For demo purposes, we'll simulate waiting for completion
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // TODO: here we probably prompt... and wait fr reply
      // thing is... when we prompt... we also create task in server :DDD so that has to be also fixed on server or here...

      // Update the task as completed
      // const isTaskUpdated = await this.taskService.updateTask(taskId, {
      //   status: 'completed',
      // });

      // console.log('Task updated:', isTaskUpdated);

      // TODO: just console log for now a fake response, to see how things are passed along...

      // TODO: decide how execution should proceed based on task output
      // const task: Task = {
      //   id: '',
      //   description: '',
      //   assignedAssistant: '',
      //   status: 'pending',
      //   createdAt: new Date(),
      //   updatedAt: new Date(),
      // };
      // Add the result to our pipeline
      const promptResponse = 'No output provided';
      const result: PipelinePartResult = {
        assistantId,
        input,
        output: promptResponse || 'No output provided',
        status: 'completed',
      };

      pipelineExecution.results.push(result);

      // Find downstream assistants
      const downstreamAssistants = await this.getDownstreamAssistants(
        assistantId
      );

      // Execute each downstream assistant
      for (const nextAssistantId of downstreamAssistants) {
        await this.executeAssistantStep(
          nextAssistantId,
          result.output,
          pipelineExecution
        );
      }
    } catch (error) {
      // Update task as failed
      // await this.taskService.updateTask(taskId, { status: 'failed' });

      // Add failure to pipeline results
      pipelineExecution.results.push({
        assistantId,
        input,
        output: 'Task failed',
        status: 'failed',
      });

      throw error; // Re-throw to halt the pipeline
    }
  }
}
