// Specialized layout function for bowtie diagrams
// Creates proper bowtie structure with good spacing

import { NODE_DIMENSIONS } from "../components/NodeTypes";

// Helper to get node dimensions based on type
const getNodeDimensions = (nodeType) => {
  if (nodeType === "topEvent") {
    return NODE_DIMENSIONS.topEvent;
  }
  return NODE_DIMENSIONS.collapsed;
};

// Removed isBarrierVisible - visibility is now handled by useExpandCollapse hook

// Build barrier chain for a threat (prevention barriers)
const buildPreventionChain = (threatId, barriers, edges, nodes) => {
  const chain = [];
  const visited = new Set();

  // Find first barrier connected to threat
  const firstBarrier = barriers.find((barrier) => {
    if (barrier.data?.barrierType !== "prevention") return false;
    const connectedEdges = edges.filter(
      (e) => e.source === barrier.id || e.target === barrier.id
    );
    return connectedEdges.some((edge) => {
      const otherId = edge.source === barrier.id ? edge.target : edge.source;
      return otherId === threatId;
    });
  });

  if (!firstBarrier) return chain;

  // Build chain sequentially
  let current = firstBarrier;
  while (current && !visited.has(current.id)) {
    chain.push(current);
    visited.add(current.id);

    // Find next barrier in chain
    const connectedEdges = edges.filter(
      (e) => e.source === current.id || e.target === current.id
    );

    const nextBarrier = barriers.find((barrier) => {
      if (visited.has(barrier.id) || barrier.data?.barrierType !== "prevention")
        return false;
      const barrierEdges = edges.filter(
        (e) => e.source === barrier.id || e.target === barrier.id
      );
      return barrierEdges.some((edge) => {
        const otherId = edge.source === barrier.id ? edge.target : edge.source;
        return otherId === current.id;
      });
    });

    if (!nextBarrier) break;
    current = nextBarrier;
  }

  return chain;
};

// Build barrier chain for a consequence (mitigation barriers)
const buildMitigationChain = (
  consequenceId,
  barriers,
  edges,
  nodes,
  topEvent
) => {
  const chain = [];
  const visited = new Set();

  // Find last barrier connected to consequence
  const lastBarrier = barriers.find((barrier) => {
    if (barrier.data?.barrierType !== "mitigation") return false;
    const connectedEdges = edges.filter(
      (e) => e.source === barrier.id || e.target === barrier.id
    );
    return connectedEdges.some((edge) => {
      const otherId = edge.source === barrier.id ? edge.target : edge.source;
      return otherId === consequenceId;
    });
  });

  if (!lastBarrier) return chain;

  // Build chain backwards from consequence to top event
  let current = lastBarrier;
  while (current && !visited.has(current.id)) {
    chain.unshift(current);
    visited.add(current.id);

    // Find previous barrier in chain
    const connectedEdges = edges.filter(
      (e) => e.source === current.id || e.target === current.id
    );

    const prevBarrier = barriers.find((barrier) => {
      if (visited.has(barrier.id) || barrier.data?.barrierType !== "mitigation")
        return false;
      const barrierEdges = edges.filter(
        (e) => e.source === barrier.id || e.target === barrier.id
      );
      return barrierEdges.some((edge) => {
        const otherId = edge.source === barrier.id ? edge.target : edge.source;
        return otherId === current.id;
      });
    });

    if (!prevBarrier) {
      // Check if connects to top event
      const connectsToTop = connectedEdges.some((edge) => {
        const otherId = edge.source === current.id ? edge.target : edge.source;
        return otherId === topEvent.id;
      });
      if (connectsToTop) break;
    }

    current = prevBarrier;
  }

  return chain;
};

export const applyBowtieLayout = (
  nodes,
  edges,
  expandedThreats = new Set(),
  expandedConsequences = new Set()
) => {
  // Find the top event (should be in center)
  const topEvent = nodes.find((n) => n.type === "topEvent");
  if (!topEvent) {
    return null;
  }

  // Find all node types
  const hazard = nodes.find((n) => n.type === "hazard");
  const threats = nodes.filter((n) => n.type === "threat");
  const consequences = nodes.filter((n) => n.type === "consequence");
  const preventionBarriers = nodes.filter(
    (n) => n.type === "barrier" && n.data?.barrierType === "prevention"
  );
  const mitigationBarriers = nodes.filter(
    (n) => n.type === "barrier" && n.data?.barrierType === "mitigation"
  );

  // Get dimensions
  const topEventDims = getNodeDimensions("topEvent");
  const standardDims = getNodeDimensions("hazard");
  const barrierDims = getNodeDimensions("barrier");

  // Simple layout constants - React Flow will handle spacing naturally
  const LAYER_SPACING = 400; // Horizontal spacing between layers
  const VERTICAL_SPACING = 150; // Vertical spacing between nodes
  const CENTER_X = 800;
  const CENTER_Y = 500;
  const HAZARD_OFFSET_Y = -200; // Hazard above top event

  // Helper functions
  const getConnectedNodes = (nodeId, targetType) => {
    return edges
      .filter((e) => e.source === nodeId || e.target === nodeId)
      .map((e) => {
        const otherId = e.source === nodeId ? e.target : e.source;
        return nodes.find((n) => n.id === otherId && n.type === targetType);
      })
      .filter(Boolean);
  };

  // Build barrier chains for each threat and consequence
  // Following sequential barrier logic: Threat → B1 → B2 → ... → Top Event
  const barriersByThreat = new Map();
  threats.forEach((threat) => {
    const chain = [];
    let currentBarrier = preventionBarriers.find((b) => {
      // Find barrier connected to this threat
      return edges.some(
        (e) =>
          (e.source === threat.id && e.target === b.id) ||
          (e.target === threat.id && e.source === b.id)
      );
    });

    // Build sequential chain by following connections
    while (currentBarrier) {
      chain.push(currentBarrier);
      // Find next barrier in chain (connected to current barrier, not top event yet)
      currentBarrier = preventionBarriers.find((b) => {
        if (chain.includes(b)) return false; // Avoid cycles
        return edges.some(
          (e) =>
            ((e.source === chain[chain.length - 1].id && e.target === b.id) ||
              (e.target === chain[chain.length - 1].id && e.source === b.id)) &&
            !edges.some(
              (e2) =>
                (e2.source === b.id && e2.target === topEvent.id) ||
                (e2.target === b.id && e2.source === topEvent.id)
            )
        );
      });
    }
    barriersByThreat.set(threat.id, chain);
  });

  // Build barrier chains for each consequence
  // Following sequential barrier logic: Top Event → B1 → B2 → ... → Consequence
  const barriersByConsequence = new Map();
  consequences.forEach((consequence) => {
    const chain = [];
    // Find the last barrier (connected to this consequence)
    let lastBarrier = mitigationBarriers.find((b) => {
      return edges.some(
        (e) =>
          (e.source === b.id && e.target === consequence.id) ||
          (e.target === b.id && e.source === consequence.id)
      );
    });

    if (!lastBarrier) {
      barriersByConsequence.set(consequence.id, []);
      return;
    }

    // Build chain backwards from consequence to top event
    const visited = new Set();
    let currentBarrier = lastBarrier;

    while (currentBarrier) {
      if (visited.has(currentBarrier.id)) break; // Avoid cycles
      visited.add(currentBarrier.id);
      chain.unshift(currentBarrier); // Add to beginning (reverse order)

      // Check if this barrier connects to top event
      const connectsToTopEvent = edges.some(
        (e) =>
          (e.source === topEvent.id && e.target === currentBarrier.id) ||
          (e.target === topEvent.id && e.source === currentBarrier.id)
      );

      if (connectsToTopEvent) {
        break; // Found the first barrier
      }

      // Find previous barrier in chain
      currentBarrier = mitigationBarriers.find((b) => {
        if (visited.has(b.id) || chain.includes(b)) return false;
        return edges.some(
          (e) =>
            ((e.source === b.id && e.target === currentBarrier.id) ||
              (e.target === b.id && e.source === currentBarrier.id)) &&
            !edges.some(
              (e2) =>
                (e2.source === b.id && e2.target === topEvent.id) ||
                (e2.target === b.id && e2.source === topEvent.id)
            )
        );
      });
    }

    barriersByConsequence.set(consequence.id, chain);
  });

  // Calculate maximum height needed for each threat path (barriers + degradation nodes)
  const threatPathHeights = new Map();
  threats.forEach((threat) => {
    const barrierChain = barriersByThreat.get(threat.id) || [];
    let maxDegHeight = 0;

    // Find maximum degradation path height for this threat's barriers
    barrierChain.forEach((barrier) => {
      const barrierDegNodes = nodes.filter((n) => {
        if (!["degradationFactor", "degradationControl"].includes(n.type))
          return false;
        const nodeEdges = edges.filter(
          (e) => e.source === n.id || e.target === n.id
        );
        return nodeEdges.some((e) => {
          const otherId = e.source === n.id ? e.target : e.source;
          return otherId === barrier.id;
        });
      });

      if (barrierDegNodes.length > 0) {
        const degDims = getNodeDimensions("degradationFactor");
        // Staircase pattern: each degradation node is offset downward
        // First node starts 60px below barrier, each subsequent node is 60px lower
        // Total extension = initial offset + (numNodes - 1) * offset + node height + spacing
        const degVerticalOffset = 60; // Vertical spacing between degradation nodes in staircase
        const degInitialOffset = 60; // Initial offset below barrier
        const degSpacing = 40; // Additional spacing at bottom for clarity
        const degHeight =
          degInitialOffset +
          (barrierDegNodes.length - 1) * degVerticalOffset +
          degDims.height +
          degSpacing;
        maxDegHeight = Math.max(maxDegHeight, degHeight);
      }
    });

    const barrierHeight = barrierDims.height;
    const threatDims = getNodeDimensions("threat");
    // Path height = threat height + barrier height + degradation extension + spacing
    // Following React Flow's pattern: account for all node dimensions
    const pathHeight =
      Math.max(threatDims.height, barrierHeight) + maxDegHeight + 50;
    threatPathHeights.set(threat.id, pathHeight);
  });

  // Calculate maximum height needed for each consequence path
  const consequencePathHeights = new Map();
  consequences.forEach((consequence) => {
    const barrierChain = barriersByConsequence.get(consequence.id) || [];
    let maxDegHeight = 0;

    barrierChain.forEach((barrier) => {
      const barrierDegNodes = nodes.filter((n) => {
        if (!["degradationFactor", "degradationControl"].includes(n.type))
          return false;
        const nodeEdges = edges.filter(
          (e) => e.source === n.id || e.target === n.id
        );
        return nodeEdges.some((e) => {
          const otherId = e.source === n.id ? e.target : e.source;
          return otherId === barrier.id;
        });
      });

      if (barrierDegNodes.length > 0) {
        const degDims = getNodeDimensions("degradationFactor");
        // Staircase pattern: each degradation node is offset downward
        // First node starts 60px below barrier, each subsequent node is 60px lower
        const degVerticalOffset = 60; // Vertical spacing between degradation nodes in staircase
        const degInitialOffset = 60; // Initial offset below barrier
        const degSpacing = 40; // Additional spacing at bottom for clarity
        const degHeight =
          degInitialOffset +
          (barrierDegNodes.length - 1) * degVerticalOffset +
          degDims.height +
          degSpacing;
        maxDegHeight = Math.max(maxDegHeight, degHeight);
      }
    });

    const barrierHeight = barrierDims.height;
    const consequenceDims = getNodeDimensions("consequence");
    // Path height = consequence height + barrier height + degradation extension + spacing
    // Following React Flow's pattern: account for all node dimensions
    const pathHeight =
      Math.max(consequenceDims.height, barrierHeight) + maxDegHeight + 50;
    consequencePathHeights.set(consequence.id, pathHeight);
  });

  // Calculate Y positions for threats following React Flow's spacing pattern
  // Similar to horizontal spacing: calculate exact positions based on node dimensions
  const threatYPositions = new Map();
  const threatDims = getNodeDimensions("threat");
  const MIN_PATH_GAP = 100; // Minimum gap between paths (React Flow recommends generous spacing)

  let currentY = 0;

  threats.forEach((threat) => {
    const pathHeight = threatPathHeights.get(threat.id) || VERTICAL_SPACING;

    // Calculate the actual bottom edge of this path
    // Path extends from threat center Y - pathHeight/2 to threat center Y + pathHeight/2
    // But we need to account for degradation staircase extending downward
    const barrierChain = barriersByThreat.get(threat.id) || [];
    let maxDegBottom = 0;

    // Find the lowest degradation node position for this threat
    barrierChain.forEach((barrier) => {
      const barrierDegNodes = nodes.filter((n) => {
        if (!["degradationFactor", "degradationControl"].includes(n.type))
          return false;
        const nodeEdges = edges.filter(
          (e) => e.source === n.id || e.target === n.id
        );
        return nodeEdges.some((e) => {
          const otherId = e.source === n.id ? e.target : e.source;
          return otherId === barrier.id;
        });
      });

      if (barrierDegNodes.length > 0) {
        const degDims = getNodeDimensions("degradationFactor");
        const degVerticalOffset = 60;
        const degInitialOffset = 60; // Initial offset below barrier
        // Bottom of last degradation node in staircase
        // Position = initial offset + (last index * vertical offset) + node height
        const lastDegBottom =
          degInitialOffset +
          (barrierDegNodes.length - 1) * degVerticalOffset +
          degDims.height;
        maxDegBottom = Math.max(maxDegBottom, lastDegBottom);
      }
    });

    // Threat center Y is at the middle of its allocated space
    const threatCenterY = currentY + pathHeight / 2;
    threatYPositions.set(threat.id, threatCenterY);

    // Calculate actual bottom of this path (threat center + half path height + degradation extension)
    const pathBottom = threatCenterY + pathHeight / 2 + maxDegBottom;

    // Next path starts after this path's bottom + minimum gap
    currentY = pathBottom + MIN_PATH_GAP;
  });

  // Center all threats around CENTER_Y
  const totalThreatHeight = currentY - MIN_PATH_GAP; // Remove last gap
  const threatStartY = CENTER_Y - totalThreatHeight / 2;
  threats.forEach((threat) => {
    const relativeY = threatYPositions.get(threat.id);
    threatYPositions.set(threat.id, threatStartY + relativeY);
  });

  // Calculate Y positions for consequences following React Flow's spacing pattern
  const consequenceYPositions = new Map();
  const consequenceDims = getNodeDimensions("consequence");

  let currentConsequenceY = 0;

  consequences.forEach((consequence) => {
    const pathHeight =
      consequencePathHeights.get(consequence.id) || VERTICAL_SPACING;

    // Calculate the actual bottom edge of this path
    const barrierChain = barriersByConsequence.get(consequence.id) || [];
    let maxDegBottom = 0;

    // Find the lowest degradation node position for this consequence
    barrierChain.forEach((barrier) => {
      const barrierDegNodes = nodes.filter((n) => {
        if (!["degradationFactor", "degradationControl"].includes(n.type))
          return false;
        const nodeEdges = edges.filter(
          (e) => e.source === n.id || e.target === n.id
        );
        return nodeEdges.some((e) => {
          const otherId = e.source === n.id ? e.target : e.source;
          return otherId === barrier.id;
        });
      });

      if (barrierDegNodes.length > 0) {
        const degDims = getNodeDimensions("degradationFactor");
        const degVerticalOffset = 60;
        const degInitialOffset = 60; // Initial offset below barrier
        // Bottom of last degradation node in staircase
        // Position = initial offset + (last index * vertical offset) + node height
        const lastDegBottom =
          degInitialOffset +
          (barrierDegNodes.length - 1) * degVerticalOffset +
          degDims.height;
        maxDegBottom = Math.max(maxDegBottom, lastDegBottom);
      }
    });

    // Consequence center Y is at the middle of its allocated space
    const consequenceCenterY = currentConsequenceY + pathHeight / 2;
    consequenceYPositions.set(consequence.id, consequenceCenterY);

    // Calculate actual bottom of this path
    const pathBottom = consequenceCenterY + pathHeight / 2 + maxDegBottom;

    // Next path starts after this path's bottom + minimum gap
    currentConsequenceY = pathBottom + MIN_PATH_GAP;
  });

  // Center all consequences around CENTER_Y
  const totalConsequenceHeight = currentConsequenceY - MIN_PATH_GAP; // Remove last gap
  const consequenceStartY = CENTER_Y - totalConsequenceHeight / 2;
  consequences.forEach((consequence) => {
    const relativeY = consequenceYPositions.get(consequence.id);
    consequenceYPositions.set(consequence.id, consequenceStartY + relativeY);
  });

  // Position all nodes
  const layoutedNodes = nodes.map((node) => {
    let x = CENTER_X;
    let y = CENTER_Y;

    // Top Event
    if (node.type === "topEvent") {
      x = CENTER_X - topEventDims.width / 2;
      y = CENTER_Y - topEventDims.height / 2;
    }
    // Hazard
    else if (node.type === "hazard") {
      const hazardDims = getNodeDimensions("hazard");
      x = CENTER_X - hazardDims.width / 2;
      y = CENTER_Y + HAZARD_OFFSET_Y - hazardDims.height / 2;
    }
    // Threats - ALL on same X coordinate
    else if (node.type === "threat") {
      const threatDims = getNodeDimensions("threat");
      const threatY = threatYPositions.get(node.id); // This is the CENTER Y
      // All threats at same X coordinate (left side of tree)
      x = CENTER_X - LAYER_SPACING * 2 - threatDims.width / 2;
      // Position threat so its CENTER is at threatY
      y = threatY - threatDims.height / 2;
    }
    // Prevention Barriers - MUST stay on same Y CENTER as their threat
    else if (
      node.type === "barrier" &&
      node.data?.barrierType === "prevention"
    ) {
      const connectedThreats = getConnectedNodes(node.id, "threat");
      if (connectedThreats.length > 0) {
        const primaryThreat = connectedThreats[0];
        const threatDims = getNodeDimensions("threat");
        const barrierChain = barriersByThreat.get(primaryThreat.id) || [];
        const barrierIndex = barrierChain.indexOf(node);

        // Only position if this barrier is in the chain (visible)
        if (barrierIndex >= 0) {
          // Use the EXACT same CENTER Y as the threat
          const threatCenterY = threatYPositions.get(primaryThreat.id);
          const threatX = CENTER_X - LAYER_SPACING * 2 - threatDims.width / 2;
          const threatRightEdge = threatX + threatDims.width;

          // Position barriers in a linear sequence, connected end-to-end
          // Each barrier starts where the previous one ends (with minimal gap)
          const barrierGap = 20; // Small gap between barriers for visual separation
          if (barrierIndex === 0) {
            // First barrier starts right after threat
            x = threatRightEdge + barrierGap;
          } else {
            // Subsequent barriers start where previous barrier ends
            const prevBarrier = barrierChain[barrierIndex - 1];
            // Calculate previous barrier's right edge
            const prevBarrierX =
              threatRightEdge +
              barrierGap +
              barrierIndex * (barrierDims.width + barrierGap) -
              (barrierDims.width + barrierGap);
            x = prevBarrierX + barrierDims.width + barrierGap;
          }
          y = threatCenterY - barrierDims.height / 2;
        } else {
          // Hidden barrier - position off-screen
          x = -1000;
          y = -1000;
        }
      } else {
        x = -1000;
        y = -1000;
      }
    }
    // Mitigation Barriers - MUST stay on same Y as their consequence
    else if (
      node.type === "barrier" &&
      node.data?.barrierType === "mitigation"
    ) {
      const connectedConsequences = getConnectedNodes(node.id, "consequence");
      if (connectedConsequences.length > 0) {
        const primaryConsequence = connectedConsequences[0];
        const consequenceDims = getNodeDimensions("consequence");
        const barrierChain =
          barriersByConsequence.get(primaryConsequence.id) || [];
        const barrierIndex = barrierChain.indexOf(node);

        if (barrierIndex >= 0) {
          // Use same CENTER Y as consequence
          const consequenceCenterY = consequenceYPositions.get(
            primaryConsequence.id
          );
          const topEventRightEdge =
            CENTER_X + LAYER_SPACING + topEventDims.width / 2;

          // Position barriers in a linear sequence, connected end-to-end
          // Each barrier starts where the previous one ends (with minimal gap)
          const barrierGap = 20; // Small gap between barriers for visual separation
          if (barrierIndex === 0) {
            // First barrier starts right after top event
            x = topEventRightEdge + barrierGap;
          } else {
            // Subsequent barriers start where previous barrier ends
            const prevBarrierX =
              topEventRightEdge +
              barrierGap +
              barrierIndex * (barrierDims.width + barrierGap) -
              (barrierDims.width + barrierGap);
            x = prevBarrierX + barrierDims.width + barrierGap;
          }
          y = consequenceCenterY - barrierDims.height / 2;
        } else {
          x = -1000;
          y = -1000;
        }
      } else {
        x = -1000;
        y = -1000;
      }
    }
    // Consequences - ALL on same X coordinate
    else if (node.type === "consequence") {
      const consequenceDims = getNodeDimensions("consequence");
      const consequenceCenterY = consequenceYPositions.get(node.id);
      // All consequences at same X coordinate
      x = CENTER_X + LAYER_SPACING * 2 - consequenceDims.width / 2;
      y = consequenceCenterY - consequenceDims.height / 2;
    }
    // Degradation Factors and Controls - positioned below their barrier
    else if (
      node.type === "degradationFactor" ||
      node.type === "degradationControl"
    ) {
      const degDims = getNodeDimensions("degradationFactor");

      // Find connected barrier
      const connectedEdges = edges.filter(
        (e) => e.source === node.id || e.target === node.id
      );

      let connectedBarrier = null;
      for (const edge of connectedEdges) {
        const otherId = edge.source === node.id ? edge.target : edge.source;
        const otherNode = nodes.find((n) => n.id === otherId);
        if (otherNode?.type === "barrier") {
          connectedBarrier = otherNode;
          break;
        }
      }

      if (connectedBarrier) {
        const barrierType = connectedBarrier.data?.barrierType;

        if (barrierType === "prevention") {
          const threat = getConnectedNodes(connectedBarrier.id, "threat")[0];
          if (threat) {
            const threatDims = getNodeDimensions("threat");
            const barrierChain = barriersByThreat.get(threat.id) || [];
            const barrierIndex = barrierChain.indexOf(connectedBarrier);

            if (barrierIndex >= 0) {
              const threatY = threatYPositions.get(threat.id);
              const threatX =
                CENTER_X - LAYER_SPACING * 2 - threatDims.width / 2;
              const threatRightEdge = threatX + threatDims.width;

              // Calculate barrier X position
              const barrierGap = 20;
              const barrierX =
                threatRightEdge +
                barrierGap +
                barrierIndex * (barrierDims.width + barrierGap);

              // Find all degradation nodes connected to this barrier
              // Use a Set to avoid duplicates
              const barrierDegNodeIds = new Set();
              const barrierDegNodes = [];

              for (const edge of edges) {
                const isSource = edge.source === connectedBarrier.id;
                const isTarget = edge.target === connectedBarrier.id;
                if (!isSource && !isTarget) continue;

                const otherId = isSource ? edge.target : edge.source;
                const otherNode = nodes.find((n) => n.id === otherId);

                if (
                  otherNode &&
                  ["degradationFactor", "degradationControl"].includes(
                    otherNode.type
                  ) &&
                  !barrierDegNodeIds.has(otherId)
                ) {
                  barrierDegNodeIds.add(otherId);
                  barrierDegNodes.push(otherNode);
                }
              }

              // Sort: factors first, then controls, then by label
              const sortedDegNodes = barrierDegNodes.sort((a, b) => {
                if (
                  a.type === "degradationFactor" &&
                  b.type === "degradationControl"
                )
                  return -1;
                if (
                  a.type === "degradationControl" &&
                  b.type === "degradationFactor"
                )
                  return 1;
                return (a.data?.label || "").localeCompare(b.data?.label || "");
              });

              const degIndex = sortedDegNodes.findIndex(
                (n) => n.id === node.id
              );

              if (degIndex < 0) {
                x = -1000;
                y = -1000;
              } else {
                // Position degradation nodes in a downward staircase pattern
                // Following React Flow's horizontal flow with vertical offset
                const nodeWidth = degDims.width; // Use consistent width
                const degHorizontalGap = 30; // Horizontal spacing
                const degVerticalOffset = 60; // Vertical offset for staircase effect

                // Calculate horizontal position - center on barrier
                const totalDegWidth =
                  sortedDegNodes.length * nodeWidth +
                  (sortedDegNodes.length > 0
                    ? (sortedDegNodes.length - 1) * degHorizontalGap
                    : 0);
                const barrierCenterX = barrierX + barrierDims.width / 2;
                const degSequenceStartX = barrierCenterX - totalDegWidth / 2;

                // Staircase pattern: each node is offset both horizontally and vertically
                x =
                  degSequenceStartX + degIndex * (nodeWidth + degHorizontalGap);
                // Vertical staircase: each node is positioned lower than the previous
                y =
                  threatY +
                  barrierDims.height / 2 +
                  60 +
                  degIndex * degVerticalOffset;
              }
            } else {
              x = -1000;
              y = -1000;
            }
          }
        } else if (barrierType === "mitigation") {
          const consequence = getConnectedNodes(
            connectedBarrier.id,
            "consequence"
          )[0];
          if (consequence) {
            const barrierChain =
              barriersByConsequence.get(consequence.id) || [];
            const barrierIndex = barrierChain.indexOf(connectedBarrier);

            if (barrierIndex >= 0) {
              const consequenceY = consequenceYPositions.get(consequence.id);
              const topEventRightEdge =
                CENTER_X + LAYER_SPACING + topEventDims.width / 2;

              // Calculate barrier X position
              const barrierGap = 20;
              const barrierX =
                topEventRightEdge +
                barrierGap +
                barrierIndex * (barrierDims.width + barrierGap);

              // Find all degradation nodes connected to this barrier
              // Use a Set to avoid duplicates
              const barrierDegNodeIds = new Set();
              const barrierDegNodes = [];

              for (const edge of edges) {
                const isSource = edge.source === connectedBarrier.id;
                const isTarget = edge.target === connectedBarrier.id;
                if (!isSource && !isTarget) continue;

                const otherId = isSource ? edge.target : edge.source;
                const otherNode = nodes.find((n) => n.id === otherId);

                if (
                  otherNode &&
                  ["degradationFactor", "degradationControl"].includes(
                    otherNode.type
                  ) &&
                  !barrierDegNodeIds.has(otherId)
                ) {
                  barrierDegNodeIds.add(otherId);
                  barrierDegNodes.push(otherNode);
                }
              }

              // Sort: factors first, then controls, then by label
              const sortedDegNodes = barrierDegNodes.sort((a, b) => {
                if (
                  a.type === "degradationFactor" &&
                  b.type === "degradationControl"
                )
                  return -1;
                if (
                  a.type === "degradationControl" &&
                  b.type === "degradationFactor"
                )
                  return 1;
                return (a.data?.label || "").localeCompare(b.data?.label || "");
              });

              const degIndex = sortedDegNodes.findIndex(
                (n) => n.id === node.id
              );

              if (degIndex < 0) {
                x = -1000;
                y = -1000;
              } else {
                // Position degradation nodes in a downward staircase pattern
                // Following React Flow's horizontal flow with vertical offset
                const nodeWidth = degDims.width; // Use consistent width
                const degHorizontalGap = 30; // Horizontal spacing
                const degVerticalOffset = 60; // Vertical offset for staircase effect

                // Calculate horizontal position - center on barrier
                const totalDegWidth =
                  sortedDegNodes.length * nodeWidth +
                  (sortedDegNodes.length > 0
                    ? (sortedDegNodes.length - 1) * degHorizontalGap
                    : 0);
                const barrierCenterX = barrierX + barrierDims.width / 2;
                const degSequenceStartX = barrierCenterX - totalDegWidth / 2;

                // Staircase pattern: each node is offset both horizontally and vertically
                x =
                  degSequenceStartX + degIndex * (nodeWidth + degHorizontalGap);
                // Vertical staircase: each node is positioned lower than the previous
                y =
                  consequenceY +
                  barrierDims.height / 2 +
                  60 +
                  degIndex * degVerticalOffset;
              }
            } else {
              x = -1000;
              y = -1000;
            }
          }
        }
      } else {
        x = -1000;
        y = -1000;
      }
    }
    // Default: keep original position
    else {
      x = node.position?.x || CENTER_X;
      y = node.position?.y || CENTER_Y;
    }

    // Set horizontal flow positions following React Flow pattern
    // https://reactflow.dev/examples/layout/horizontal
    let sourcePosition = "right";
    let targetPosition = "left";

    // Adjust for specific node types
    if (node.type === "hazard") {
      // Hazard connects to threats (below) and can connect to barriers
      sourcePosition = "bottom";
      targetPosition = "top";
    } else if (node.type === "topEvent") {
      // Top Event is in center, connects from left (prevention) and to right (mitigation)
      sourcePosition = "right";
      targetPosition = "left";
    } else if (node.type === "threat") {
      // Threats are on left, output to right (towards barriers)
      sourcePosition = "right";
      targetPosition = "left";
    } else if (node.type === "barrier") {
      // Barriers flow left to right
      sourcePosition = "right";
      targetPosition = "left";
    } else if (node.type === "consequence") {
      // Consequences are on right, receive from left (barriers)
      sourcePosition = "right";
      targetPosition = "left";
    } else if (
      ["degradationFactor", "degradationControl"].includes(node.type)
    ) {
      // Degradation nodes connect to barriers (above)
      sourcePosition = "top";
      targetPosition = "bottom";
    }

    return {
      ...node,
      position: { x, y },
      sourcePosition,
      targetPosition,
    };
  });

  return layoutedNodes;
};
