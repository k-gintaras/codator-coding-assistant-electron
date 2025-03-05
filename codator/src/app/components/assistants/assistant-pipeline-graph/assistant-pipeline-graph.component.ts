/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NgIf } from '@angular/common';
import * as d3 from 'd3';
import { PipelineConnection } from '../../../interfaces/assistant-pipeline.model';
import { AssistantPipelineService } from '../../../services/orchestrators/assistant-pipeline.service';

interface Assistant {
  id: string;
  name: string;
  description: string;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'assistant';
  x?: number;
  y?: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  id: string;
  source: string | Node;
  target: string | Node;
  relationshipType: string;
}

@Component({
  standalone: true,
  imports: [NgIf],
  selector: 'app-assistant-pipeline-graph',
  templateUrl: './assistant-pipeline-graph.component.html',
  styleUrls: ['./assistant-pipeline-graph.component.html'],
})
export class AssistantPipelineGraphComponent implements OnInit, OnChanges {
  @Input() assistants: Assistant[] = [];
  @Input() connections: PipelineConnection[] = [];
  @ViewChild('svg', { static: true }) svgElement!: ElementRef;

  private svg: any;
  private simulation: any;
  private zoom: any;
  private g: any;

  nodes: Node[] = [];
  links: Link[] = [];

  selectedNode: Node | null = null;
  sourceNode: Node | null = null;
  targetNode: Node | null = null;

  constructor(private pipelineService: AssistantPipelineService) {}

  ngOnInit() {
    this.initializeD3();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['assistants'] || changes['connections']) && this.svg) {
      this.updateGraph();
    }
  }

  private initializeD3() {
    // Set up SVG
    const element = this.svgElement.nativeElement;
    this.svg = d3.select(element);

    // Set up zoom behavior
    this.zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });

    this.svg.call(this.zoom);

    // Create a group for all graph elements
    this.g = this.svg.append('g');

    // Add arrow marker definition
    this.svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25) // Position of the arrow relative to the end of the line
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#6b7280')
      .style('stroke', 'none');

    // Initialize with existing data
    this.updateGraph();
  }

  updateGraph() {
    // Transform assistants to nodes
    this.nodes = this.assistants.map((assistant) => ({
      id: assistant.id,
      name: assistant.name,
      type: 'assistant' as const,
    }));

    // Transform connections to links
    this.links = this.connections.map((connection) => ({
      id: connection.id,
      source: connection.sourceAssistantId,
      target: connection.targetAssistantId,
      relationshipType: connection.relationshipType,
    }));

    // Update simulation
    this.simulation = d3
      .forceSimulation(this.nodes)
      .force(
        'link',
        d3
          .forceLink(this.links)
          .id((d: any) => d.id)
          .distance(150)
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force(
        'center',
        d3.forceCenter(
          this.svgElement.nativeElement.clientWidth / 2,
          this.svgElement.nativeElement.clientHeight / 2
        )
      )
      .force('collision', d3.forceCollide().radius(60))
      .on('tick', () => this.ticked());

    this.renderGraph();
  }

  renderGraph() {
    // Clear previous elements
    this.g.selectAll('.link').remove();
    this.g.selectAll('.node').remove();

    // Add links
    const link = this.g
      .selectAll('.link')
      .data(this.links, (d: any) => d.id)
      .enter()
      .append('g')
      .attr('class', 'link');

    // Add the actual link line
    link
      .append('line')
      .attr('stroke', '#6b7280')
      .attr('marker-end', 'url(#arrowhead)')
      .on('contextmenu', (event: MouseEvent, d: any) => {
        event.preventDefault();
        this.deleteConnection(d.id);
      });

    // Add relationship type labels
    link
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -5)
      .attr('fill', '#6b7280')
      .attr('font-size', '10px')
      .text((d: any) => d.relationshipType);

    // Add nodes
    const node = this.g
      .selectAll('.node')
      .data(this.nodes, (d: any) => d.id)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(
        d3
          .drag()
          .on('start', (event, d) => this.dragstarted(event, d))
          .on('drag', (event, d) => this.dragged(event, d))
          .on('end', (event, d) => this.dragended(event, d))
      );

    // Add node circles
    node
      .append('circle')
      .attr('r', 30)
      .attr('fill', '#3b82f6') // blue-500
      .attr('stroke', '#1e40af') // blue-800
      .attr('stroke-width', 2)
      .on('click', (event: MouseEvent, d: any) => {
        this.selectNode(d);
      });

    // Add node labels
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('fill', 'white')
      .text((d: any) => d.name.substring(0, 10));
  }

  ticked() {
    // Update link positions
    this.g
      .selectAll('.link line')
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);

    // Update link label positions
    this.g
      .selectAll('.link text')
      .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
      .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

    // Update node positions
    this.g
      .selectAll('.node')
      .attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);
  }

  dragstarted(event: any, d: any) {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  dragged(event: any, d: any) {
    d.fx = event.x;
    d.fy = event.y;
  }

  dragended(event: any, d: any) {
    if (!event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  resetZoom() {
    this.svg
      .transition()
      .duration(750)
      .call(this.zoom.transform, d3.zoomIdentity);
  }

  selectNode(node: Node) {
    if (this.selectedNode && this.selectedNode.id === node.id) {
      this.selectedNode = null;
    } else {
      this.selectedNode = node;
    }
  }

  selectAsSource(node: Node) {
    this.sourceNode = node;
    this.selectedNode = null;
  }

  selectAsTarget(node: Node) {
    this.targetNode = node;
    this.selectedNode = null;
  }

  clearSelection() {
    this.sourceNode = null;
    this.targetNode = null;
  }

  async createConnection() {
    if (!this.sourceNode || !this.targetNode) return;

    try {
      await this.pipelineService.createConnection(
        this.sourceNode.id,
        this.targetNode.id,
        'depends_on'
      );

      // Add the new connection to the connections array
      const newConnection: PipelineConnection = {
        id: 'temp-' + Date.now(), // Temporary ID until we refresh
        sourceAssistantId: this.sourceNode.id,
        targetAssistantId: this.targetNode.id,
        relationshipType: 'depends_on',
      };

      this.connections = [...this.connections, newConnection];
      this.updateGraph();
      this.clearSelection();
    } catch (error) {
      console.error('Failed to create connection:', error);
    }
  }

  async deleteConnection(connectionId: string) {
    try {
      // Remove the connection from the local array first for immediate UI update
      this.connections = this.connections.filter((c) => c.id !== connectionId);
      this.updateGraph();

      // Then call the service to delete it from the backend
      // await this.pipelineService.deleteConnection(connectionId);
      console.log('Deleting connection:', connectionId);
    } catch (error) {
      console.error('Failed to delete connection:', error);
    }
  }
}
