import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow
} from 'reactflow';
import jsPDF from 'jspdf';
import { toPng, toSvg } from 'html-to-image';
import { svg2pdf } from 'svg2pdf.js';

import { nodeTypes } from './NodeTypes.jsx';
import { applyElkLayout } from '../utils/elkLayout.js';

const EDGE_STYLE = {
  stroke: '#1f2937',
  strokeWidth: 1.8
};

const EDGE_STYLE_FAILED = {
  stroke: '#ef4444',
  strokeWidth: 2.2
};

const EDGE_STYLE_ALERT = {
  stroke: '#f97316',
  strokeWidth: 2.2
};

const DEFAULT_HANDLE_POSITIONS = {
  targetPosition: 'left',
  sourcePosition: 'right'
};

const BowtieDiagramInner = ({
  data,
  expandedGroups,
  failedBarriers,
  onSelectNode,
  selectedNodeId,
  registerExporter
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef(null);
  const reactFlowInstanceRef = useRef(null);
  const { fitView } = useReactFlow();

  const failedSet = useMemo(() => new Set(failedBarriers), [failedBarriers]);

  const graph = useMemo(() => buildGraph(data, expandedGroups, failedSet), [data, expandedGroups, failedSet]);

  useEffect(() => {
    let canceled = false;

    async function layoutGraph() {
      try {
        const { nodes: layoutedNodes } = await applyElkLayout(graph.nodes, graph.edges);
        if (canceled) return;

        const nodesWithHandles = layoutedNodes.map((node) => ({
          ...DEFAULT_HANDLE_POSITIONS,
          ...node,
          selectable: true,
          draggable: false
        }));

        setNodes(nodesWithHandles);
        setEdges(graph.edges);
      } catch (error) {
        console.error('Failed to compute ELK layout, falling back to original positions.', error);
        setNodes(
          graph.nodes.map((node) => ({
            ...DEFAULT_HANDLE_POSITIONS,
            ...node,
            selectable: true,
            draggable: false
          }))
        );
        setEdges(graph.edges);
      }

      requestAnimationFrame(() => {
        if (!canceled) {
          fitView({
            padding: 0.18,
            duration: 400,
            includeHiddenNodes: true,
            nodes: nodesWithHandles
          });
        }
      });
    }

    layoutGraph();

    return () => {
      canceled = true;
    };
  }, [graph, setNodes, setEdges, fitView]);

  const handleInit = useCallback((instance) => {
    reactFlowInstanceRef.current = instance;
  }, []);

  const exportAsPNG = useCallback(async () => {
    if (!reactFlowWrapper.current) return;

    const dataUrl = await toPng(reactFlowWrapper.current, {
      filter: (node) => !node?.classList?.contains('react-flow__minimap')
    });

    downloadDataUrl(dataUrl, 'bowtie-diagram.png');
  }, []);

  const exportAsSVG = useCallback(async () => {
    if (!reactFlowWrapper.current) return;

    const svgText = await toSvg(reactFlowWrapper.current, {
      filter: (node) => !node?.classList?.contains('react-flow__minimap')
    });

    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    downloadUrl(url, 'bowtie-diagram.svg');
  }, []);

  const exportAsPDF = useCallback(async () => {
    if (!reactFlowWrapper.current) return;

    const svgText = await toSvg(reactFlowWrapper.current, {
      filter: (node) => !node?.classList?.contains('react-flow__minimap'),
      backgroundColor: '#ffffff'
    });

    const parser = new DOMParser();
    const svgElement = parser.parseFromString(svgText, 'image/svg+xml').documentElement;

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    await svg2pdf(svgElement, pdf, {
      x: 24,
      y: 24,
      width: pageWidth - 48,
      height: pageHeight - 48
    });

    pdf.save('bowtie-diagram.pdf');
  }, []);

  useEffect(() => {
    if (!registerExporter) return;
    registerExporter({
      png: exportAsPNG,
      svg: exportAsSVG,
      pdf: exportAsPDF
    });
  }, [registerExporter, exportAsPNG, exportAsSVG, exportAsPDF]);

  const onNodeClick = useCallback(
    (_, node) => {
      onSelectNode(node);
    },
    [onSelectNode]
  );

  const onPaneClick = useCallback(() => {
    onSelectNode(null);
  }, [onSelectNode]);

  return (
    <div className="diagram-wrapper">
      <div className="reactflow-wrapper" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onInit={handleInit}
          nodesDraggable={false}
          nodesConnectable={false}
          fitView
          fitViewOptions={{ padding: 0.35 }}
          minZoom={0.6}
          maxZoom={1.6}
          style={{ width: '100%', height: '100%' }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false
          }}
          proOptions={{ hideAttribution: true }}
          selectionKeyCode={null}
        >
          <MiniMap
            nodeStrokeColor={(n) => nodeStrokeColor(n)}
            nodeColor={(n) => nodeFillColor(n)}
            pannable
            zoomable
          />
          <Controls showInteractive={false} />
          <Background gap={20} size={1} color="#e2e8f0" />
        </ReactFlow>
      </div>
    </div>
  );
};

const BowtieDiagram = (props) => (
  <ReactFlowProvider>
    <BowtieDiagramInner {...props} />
  </ReactFlowProvider>
);

export default BowtieDiagram;

function nodeStrokeColor(node) {
  if (node?.data?.status === 'failed') {
    return '#ef4444';
  }
  if (node?.data?.status === 'warning') {
    return '#f97316';
  }
  return '#1f2937';
}

function nodeFillColor(node) {
  switch (node?.type) {
    case 'hazard':
      return '#fcd34d';
    case 'topEvent':
      return '#f97316';
    case 'threat':
      return '#2563eb';
    case 'consequence':
      return '#ef4444';
    case 'barrier':
      return node?.data?.status === 'failed' ? '#f87171' : '#10b981';
    case 'barrierGroup':
      return '#0f172a';
    default:
      return '#e2e8f0';
  }
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function downloadUrl(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildGraph(data, expandedGroups, failedSet) {
  if (!data) {
    return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];

  const hazardNode = {
    id: 'hazard',
    type: 'hazard',
    data: {
      label: data.hazard,
      description: data.hazard_description,
      icon: '⚠️',
      status: failedSet.size ? 'warning' : 'normal'
    },
    layoutOptions: {
      'elk.layered.layer': '2'
    }
  };

  const topEventNode = {
    id: 'topEvent',
    type: 'topEvent',
    data: {
      label: data.top_event,
      description: data.top_event_description,
      icon: '🎯',
      status: failedSet.size ? 'warning' : 'normal'
    },
    layoutOptions: {
      'elk.layered.layer': '3'
    }
  };

  nodes.push(hazardNode, topEventNode);
  edges.push(createEdge('hazard', 'topEvent', EDGE_STYLE));

  (data.threats ?? []).forEach((threat, index) => {
    const threatId = threat.id ?? `threat-${index}`;
    nodes.push({
      id: threatId,
      type: 'threat',
      data: {
        label: threat.name,
        description: threat.description,
        icon: '⚡️'
      },
      layoutOptions: {
        'elk.layered.layer': '0'
      }
    });

    // Connect threat to hazard
    edges.push(createEdge(threatId, 'hazard', EDGE_STYLE_ALERT, true));
  });

  const preventionBarriers = data.prevention_barriers ?? [];
  const mitigationBarriers = data.mitigation_barriers ?? [];

  const anyPreventionFailed = preventionBarriers.some((barrier) => failedSet.has(barrier.id));
  const anyMitigationFailed = mitigationBarriers.some((barrier) => failedSet.has(barrier.id));

  if (expandedGroups.prevention) {
    preventionBarriers.forEach((barrier, index) => {
      const barrierId = barrier.id ?? `prevention-${index}`;
      const status = failedSet.has(barrier.id) ? 'failed' : 'normal';

      nodes.push({
        id: barrierId,
        type: 'barrier',
        data: {
          label: barrier.name,
          description: barrier.description,
          icon: status === 'failed' ? '❌' : '🛡️',
          status
        },
        layoutOptions: {
          'elk.layered.layer': '1'
        }
      });

      (data.threats ?? []).forEach((threat, threatIndex) => {
        const threatId = threat.id ?? `threat-${threatIndex}`;
        edges.push(createEdge(threatId, barrierId, failedSet.has(barrierId) ? EDGE_STYLE_FAILED : EDGE_STYLE));
      });

      edges.push(createEdge(barrierId, 'topEvent', failedSet.has(barrierId) ? EDGE_STYLE_FAILED : EDGE_STYLE));
    });
  } else if (preventionBarriers.length) {
    nodes.push({
      id: 'prevention-group',
      type: 'barrierGroup',
      data: {
        label: `Prevention barriers (${preventionBarriers.length})`,
        description: 'Enable the prevention barriers to see individual controls.',
        icon: anyPreventionFailed ? '❗️' : '🛡️',
        status: anyPreventionFailed ? 'warning' : 'normal'
      },
      layoutOptions: {
        'elk.layered.layer': '1'
      }
    });

    (data.threats ?? []).forEach((threat, threatIndex) => {
      const threatId = threat.id ?? `threat-${threatIndex}`;
      edges.push(createEdge(threatId, 'prevention-group', anyPreventionFailed ? EDGE_STYLE_ALERT : EDGE_STYLE));
    });

    edges.push(createEdge('prevention-group', 'topEvent', anyPreventionFailed ? EDGE_STYLE_ALERT : EDGE_STYLE));
  }

  const consequences = data.consequences ?? [];

  if (expandedGroups.mitigation) {
    mitigationBarriers.forEach((barrier, index) => {
      const barrierId = barrier.id ?? `mitigation-${index}`;
      const status = failedSet.has(barrier.id) ? 'failed' : 'normal';

      nodes.push({
        id: barrierId,
        type: 'barrier',
        data: {
          label: barrier.name,
          description: barrier.description,
          icon: status === 'failed' ? '❌' : '🛡️',
          status
        },
        layoutOptions: {
          'elk.layered.layer': '4'
        }
      });

      edges.push(createEdge('topEvent', barrierId, failedSet.has(barrierId) ? EDGE_STYLE_FAILED : EDGE_STYLE));

      consequences.forEach((consequence, consequenceIndex) => {
        const consequenceId = consequence.id ?? `consequence-${consequenceIndex}`;
        edges.push(createEdge(barrierId, consequenceId, failedSet.has(barrierId) ? EDGE_STYLE_FAILED : EDGE_STYLE));
      });
    });
  } else if (mitigationBarriers.length) {
    nodes.push({
      id: 'mitigation-group',
      type: 'barrierGroup',
      data: {
        label: `Mitigation barriers (${mitigationBarriers.length})`,
        description: 'Enable the mitigation barriers to see individual controls.',
        icon: anyMitigationFailed ? '❗️' : '🛡️',
        status: anyMitigationFailed ? 'warning' : 'normal'
      },
      layoutOptions: {
        'elk.layered.layer': '4'
      }
    });

    edges.push(createEdge('topEvent', 'mitigation-group', anyMitigationFailed ? EDGE_STYLE_ALERT : EDGE_STYLE));
    consequences.forEach((consequence, consequenceIndex) => {
      const consequenceId = consequence.id ?? `consequence-${consequenceIndex}`;
      edges.push(createEdge('mitigation-group', consequenceId, anyMitigationFailed ? EDGE_STYLE_ALERT : EDGE_STYLE));
    });
  }

  consequences.forEach((consequence, index) => {
    const consequenceId = consequence.id ?? `consequence-${index}`;
    nodes.push({
      id: consequenceId,
      type: 'consequence',
      data: {
        label: consequence.name,
        description: consequence.description,
        icon: '📉',
        status: failedSet.size ? 'warning' : 'normal'
      },
      layoutOptions: {
        'elk.layered.layer': '5'
      }
    });
  });

  // Deduplicate edges by id
  const uniqueEdgesMap = new Map();
  edges.forEach((edge) => uniqueEdgesMap.set(edge.id, edge));

  return {
    nodes,
    edges: Array.from(uniqueEdgesMap.values()).map((edge) => ({
      ...edge,
      markerEnd: {
        type: 'arrowclosed',
        color: edge.style?.stroke ?? EDGE_STYLE.stroke
      }
    }))
  };
}

function createEdge(source, target, style = EDGE_STYLE, dashed = false) {
  const id = `${source}-${target}`;
  return {
    id,
    source,
    target,
    style,
    animated: false,
    type: 'smoothstep',
    data: {},
    markerEnd: {
      type: 'arrowclosed',
      color: style.stroke
    },
    ...(dashed
      ? {
          style: {
            ...style,
            strokeDasharray: '6 3'
          }
        }
      : {})
  };
}

