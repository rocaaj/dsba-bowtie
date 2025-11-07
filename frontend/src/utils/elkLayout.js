import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

const DEFAULT_NODE_SIZE = {
  width: 320,
  height: 140
};

const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.layered.layering.strategy': 'LONGEST_PATH',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.spacing.edgeNodeBetweenLayers': '160',
  'elk.layered.spacing.nodeNodeBetweenLayers': '220',
  'elk.layered.spacing.nodeNode': '120',
  'elk.spacing.nodeNode': '120',
  'elk.spacing.edgeEdge': '100',
  'elk.padding': '[top=120,left=160,bottom=120,right=160]'
};

export async function applyElkLayout(nodes, edges) {
  if (!nodes.length) {
    return { nodes, edges };
  }

  const elkGraph = {
    id: 'bowtie-root',
    layoutOptions: elkOptions,
    children: nodes.map((node) => ({
      id: node.id,
      width: node.width ?? node.measured?.width ?? DEFAULT_NODE_SIZE.width,
      height: node.height ?? node.measured?.height ?? DEFAULT_NODE_SIZE.height,
      layoutOptions: node.layoutOptions ?? {}
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target]
    }))
  };

  const layout = await elk.layout(elkGraph);
  const layoutChildren = layout.children ?? [];

  const layoutedNodes = nodes.map((node) => {
    const layoutNode = layoutChildren.find((child) => child.id === node.id);

    return {
      ...node,
      position: {
        x: layoutNode?.x ?? 0,
        y: layoutNode?.y ?? 0
      },
      width: layoutNode?.width ?? DEFAULT_NODE_SIZE.width,
      height: layoutNode?.height ?? DEFAULT_NODE_SIZE.height
    };
  });

  return { nodes: layoutedNodes, edges };
}

