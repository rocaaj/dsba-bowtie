import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
} from "reactflow";
import "reactflow/dist/style.css";

import { nodeTypes } from "./components/NodeTypes";
import AnimatedEdge from "./components/AnimatedEdge";
import { useELKLayout } from "./utils/elkLayout";
import NodeEditor from "./components/NodeEditor";
import Toolbar from "./components/Toolbar";
import { saveToJSON, validateBowtieSchema } from "./utils/dataModel";
import {
  getAllConnectedNodes,
  getNodePath,
  getDownstreamPathFromBarrier,
  calculateNodeRiskScore,
  getRiskLevel,
} from "./utils/pathUtils";
// Removed applyBowtieLayout import - now using ELK layout exclusively
// import { applyBowtieLayout } from "./utils/bowtieLayout";
import { NODE_DIMENSIONS } from "./components/NodeTypes";
import { useExpandCollapse } from "./utils/useExpandCollapse";

const initialNodes = [];
const initialEdges = [];

// Edge types for animated edges
const edgeTypes = {
  animated: AnimatedEdge,
};

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [error, setError] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatedNodeId, setAnimatedNodeId] = useState(null);
  // Use expand/collapse hook following React Flow pattern
  const {
    visibleNodes,
    visibleEdges,
    isNodeVisible,
    getExpandedState,
    toggleExpand,
  } = useExpandCollapse(nodes, edges);

  // Get expanded threats and consequences from node data
  const expandedThreats = useMemo(() => {
    return new Set(
      nodes
        .filter((n) => n.type === "threat" && n.data?.expanded)
        .map((n) => n.id)
    );
  }, [nodes]);

  const expandedConsequences = useMemo(() => {
    return new Set(
      nodes
        .filter((n) => n.type === "consequence" && n.data?.expanded)
        .map((n) => n.id)
    );
  }, [nodes]);

  // ELK layout hook
  const { applyLayout, isLayouting } = useELKLayout();

  // Error boundary effect
  useEffect(() => {
    const handleError = (event) => {
      console.error("Global error:", event.error);
      setError(event.error?.message || "An error occurred");
    };
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  // Handle edge connections
  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        labelStyle: { fill: "#6366f1", fontWeight: 500 },
        labelBgStyle: { fill: "#fff", fillOpacity: 0.8 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Calculate risk scores for all nodes
  const nodesWithRisk = useMemo(() => {
    return nodes.map((node) => {
      const riskScore = calculateNodeRiskScore(node, edges, nodes);
      const riskLevel = getRiskLevel(riskScore);
      return {
        ...node,
        data: {
          ...node.data,
          riskScore,
          riskLevel,
        },
      };
    });
  }, [nodes, edges]);

  // DISABLED: Automatic bowtie layout conflicts with ELK layered layout
  // ELK layered layout with SPORE overlap removal handles positioning automatically
  // This was causing barriers to shift incorrectly when expansion state changed
  //
  // If manual layout adjustment is needed, use handleAutoLayout instead
  //
  // Track previous expansion state to detect when it changes
  // const prevExpansionStateRef = useRef("");

  // Re-apply bowtie layout when expansion state changes (not on every render or drag)
  // DISABLED - conflicts with ELK layout
  // useEffect(() => {
  //   // Only apply layout if we have nodes and a top event (bowtie structure)
  //   // Use nodesWithRisk directly (it's memoized and will have latest values)
  //   if (nodesWithRisk.length === 0) return;

  //   const hasTopEvent = nodesWithRisk.some((n) => n.type === "topEvent");
  //   if (!hasTopEvent) return;

  //   // Create a stable string representation of expansion state using memoized Sets
  //   const currentExpansionState = [
  //     Array.from(expandedThreats).sort().join(","),
  //     Array.from(expandedConsequences).sort().join(","),
  //   ].join("|");

  //   // Only apply layout if expansion state actually changed
  //   // This prevents layout from running on every node drag or position change
  //   if (currentExpansionState === prevExpansionStateRef.current) {
  //     return;
  //   }

  //   // Update ref
  //   prevExpansionStateRef.current = currentExpansionState;

  //   // Apply layout with current expansion state
  //   // nodesWithRisk is used directly here (not in deps) to avoid re-running on drag
  //   const layoutedNodes = applyBowtieLayout(
  //     nodesWithRisk,
  //     edges,
  //     expandedThreats,
  //     expandedConsequences
  //   );
  //   if (layoutedNodes && layoutedNodes.length > 0) {
  //     setNodes(layoutedNodes);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [
  //   // Only depend on expansion state (memoized Sets) and edges (structure changes)
  //   // Don't include nodesWithRisk - it changes on drag, but we only want layout on expansion change
  //   // The ref check ensures layout only runs when expansion state actually changes
  //   expandedThreats,
  //   expandedConsequences,
  //   edges.length,
  // ]);

  // Note: Layout is now handled by ELK when handleAutoLayout is called
  // ELK layered algorithm with SPORE overlap removal handles all positioning

  // Get highlighted nodes (only the specific path for hovered or selected node)
  // Also includes downstream paths from failed barriers (scenario toggle)
  const highlightedNodeIds = useMemo(() => {
    // Guard against undefined nodes/edges
    if (!nodes || !edges || nodes.length === 0) {
      return new Set();
    }

    const ids = new Set();

    // Get path from hovered node
    if (hoveredNode && !isAnimating) {
      const path = getNodePath(hoveredNode.id, edges, nodes);
      path.forEach((id) => ids.add(id));
    }

    // Get path from selected node
    if (selectedNode && (focusMode || isAnimating)) {
      const path = getNodePath(selectedNode.id, edges, nodes);
      path.forEach((id) => ids.add(id));
    }

    // Scenario toggle: highlight downstream paths from failed barriers
    // Only if not hovering/selecting a node (to avoid conflicts)
    if (!hoveredNode && !selectedNode) {
      const failedBarriers = nodes.filter(
        (n) => n.type === "barrier" && n.data?.status === "failed"
      );
      failedBarriers.forEach((barrier) => {
        const downstreamPath = getDownstreamPathFromBarrier(
          barrier.id,
          edges,
          nodes
        );
        downstreamPath.forEach((id) => ids.add(id));
      });
    }

    // Add animated node highlight
    if (animatedNodeId) {
      ids.add(animatedNodeId);
    }

    // Filter out degradation nodes whose barriers are not in the highlighted set
    // This ensures degradation nodes are only highlighted when their barrier is highlighted
    const highlightedBarrierIds = new Set(
      Array.from(ids).filter((id) => {
        const node = nodes.find((n) => n.id === id);
        return node?.type === "barrier";
      })
    );

    // Remove degradation nodes whose barriers are not highlighted
    // This ensures degradation nodes are only highlighted when their barrier is in the highlighted path
    const filteredIds = new Set();
    const degradationNodesInIds = [];

    ids.forEach((id) => {
      const node = nodes.find((n) => n.id === id);
      if (
        node?.type === "degradationFactor" ||
        node?.type === "degradationControl"
      ) {
        degradationNodesInIds.push({
          id,
          type: node.type,
          label: node.data?.label,
        });
        let barrierId = null;

        if (node.type === "degradationControl") {
          // Degradation control connects directly to barrier
          // Degradation control is typically the SOURCE, barrier is the TARGET
          const barrierEdge = edges.find((e) => {
            if (e.source === id) {
              const targetNode = nodes.find((n) => n.id === e.target);
              return targetNode?.type === "barrier";
            } else if (e.target === id) {
              const sourceNode = nodes.find((n) => n.id === e.source);
              return sourceNode?.type === "barrier";
            }
            return false;
          });
          if (barrierEdge) {
            barrierId =
              barrierEdge.source === id
                ? barrierEdge.target
                : barrierEdge.source;
          }
        } else if (node.type === "degradationFactor") {
          // Degradation factor connects to control, which connects to barrier
          // Degradation factor is typically SOURCE, control is TARGET
          const controlEdge = edges.find((e) => {
            if (e.source === id) {
              const targetNode = nodes.find((n) => n.id === e.target);
              return targetNode?.type === "degradationControl";
            } else if (e.target === id) {
              const sourceNode = nodes.find((n) => n.id === e.source);
              return sourceNode?.type === "degradationControl";
            }
            return false;
          });
          if (controlEdge) {
            const controlId =
              controlEdge.source === id
                ? controlEdge.target
                : controlEdge.source;
            // Control is typically SOURCE, barrier is TARGET
            const barrierEdge = edges.find((e) => {
              if (e.source === controlId) {
                const targetNode = nodes.find((n) => n.id === e.target);
                return targetNode?.type === "barrier";
              } else if (e.target === controlId) {
                const sourceNode = nodes.find((n) => n.id === e.source);
                return sourceNode?.type === "barrier";
              }
              return false;
            });
            if (barrierEdge) {
              barrierId =
                barrierEdge.source === controlId
                  ? barrierEdge.target
                  : barrierEdge.source;
            }
          }
        }

        // Only include degradation node if its barrier is in the highlighted set
        // Also ensure that when focus mode is on but nothing is hovered, degradation nodes are NOT highlighted
        // (They should only be highlighted when a node on their path is hovered/selected)
        if (barrierId && highlightedBarrierIds.has(barrierId)) {
          // Additional check: if focus mode is on but nothing is hovered/selected, don't highlight degradation nodes
          // (They should be dimmed until a node on their path is highlighted)
          if (focusMode && !hoveredNode && !selectedNode && !animatedNodeId) {
            // In this case, don't add degradation nodes - they should be dimmed
            // Only allow if there are failed barriers causing highlighting
            const hasFailedBarriers = nodes.some(
              (n) => n.type === "barrier" && n.data?.status === "failed"
            );
            if (!hasFailedBarriers) {
              // No failed barriers, so degradation nodes should be dimmed
              return; // Skip adding this degradation node
            }
          }
          filteredIds.add(id);
        }
      } else {
        // Not a degradation node, keep it
        filteredIds.add(id);
      }
    });

    // Debug logging when focus mode is on but nothing is hovered
    if (focusMode && !hoveredNode && !selectedNode) {
      console.log("Focus mode on, nothing hovered");
      console.log("ids size:", ids.size);
      console.log("ids contents:", Array.from(ids));
      console.log("highlightedBarrierIds:", Array.from(highlightedBarrierIds));
      if (degradationNodesInIds.length > 0) {
        console.log("Degradation nodes in ids:", degradationNodesInIds);
      }
      console.log("filteredIds size:", filteredIds.size);
      console.log("filteredIds contents:", Array.from(filteredIds));

      // Check if any degradation nodes are in the final filteredIds
      const degNodesInFiltered = Array.from(filteredIds).filter((id) => {
        const node = nodes.find((n) => n.id === id);
        return (
          node?.type === "degradationFactor" ||
          node?.type === "degradationControl"
        );
      });
      if (degNodesInFiltered.length > 0) {
        console.log(
          "⚠️ WARNING: Degradation nodes in filteredIds (should be empty):",
          degNodesInFiltered
        );
      }
    }

    return filteredIds;
  }, [
    hoveredNode,
    selectedNode,
    focusMode,
    edges,
    nodes,
    isAnimating,
    animatedNodeId,
  ]);

  // Handle node selection
  const onNodeClick = useCallback(
    (event, node) => {
      setSelectedNode(node);
      setIsEditorOpen(true);
      setFocusMode(true); // Enable focus mode on click

      // Toggle expand/collapse for threats and consequences
      // Following React Flow's expand-collapse pattern
      if (node.type === "threat" || node.type === "consequence") {
        setNodes(toggleExpand(node.id));
      }
    },
    [setNodes, toggleExpand]
  );

  // Handle node hover
  const onNodeMouseEnter = useCallback((event, node) => {
    setHoveredNode(node);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  // Handle pane click to deselect
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setIsEditorOpen(false);
    setFocusMode(false);
  }, []);

  // Apply layout (only when manually triggered)
  // Now uses ELK layered layout with SPORE overlap removal for all diagrams
  // This ensures consistent positioning and proper handling of degradation branches
  const handleAutoLayout = useCallback(async () => {
    // Always use ELK layered layout with SPORE overlap removal
    // ELK handles bowtie structure, sequential barriers, and degradation branches
    await applyLayout(nodesWithRisk, edges, setNodes, setEdges);

    // Fit view after layout
    setTimeout(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({ padding: 0.2, maxZoom: 1.5 });
      }
    }, 100);
  }, [nodesWithRisk, edges, applyLayout, setNodes, setEdges]);

  // Prepare nodes with highlighting and risk data
  // Use visibleNodes from useExpandCollapse hook
  const preparedNodes = useMemo(() => {
    // Guard against undefined nodesWithRisk
    if (!nodesWithRisk || nodesWithRisk.length === 0) {
      return [];
    }

    const nodesToLog = focusMode && !hoveredNode && !selectedNode;
    const degNodesState = [];

    const prepared = nodesWithRisk
      .filter((node) => isNodeVisible(node))
      .map((node) => {
        const isHighlighted = highlightedNodeIds.has(node.id);
        const isAnimated = animatedNodeId === node.id;
        const isDimmed =
          (focusMode || isAnimating) &&
          !isHighlighted &&
          !isAnimated &&
          !highlightedNodeIds.has(node.id);

        // Debug degradation nodes when focus mode is on
        if (
          nodesToLog &&
          (node.type === "degradationFactor" ||
            node.type === "degradationControl")
        ) {
          degNodesState.push({
            id: node.id,
            label: node.data?.label,
            isHighlighted,
            isDimmed,
            inHighlightedNodeIds: highlightedNodeIds.has(node.id),
          });
        }

        // Set node dimensions for ReactFlow (use collapsed dimensions for layout)
        const nodeDims =
          node.type === "topEvent"
            ? NODE_DIMENSIONS.topEvent
            : NODE_DIMENSIONS.collapsed;

        return {
          ...node,
          width: nodeDims.width,
          height: nodeDims.height,
          data: {
            ...node.data,
            isHighlighted: isHighlighted || isAnimated,
            isDimmed,
            isAnimated,
          },
        };
      });

    // Log degradation nodes state after mapping
    if (nodesToLog && degNodesState.length > 0) {
      console.log("Degradation nodes state in preparedNodes:", degNodesState);
      const highlightedDeg = degNodesState.filter((n) => n.isHighlighted);
      if (highlightedDeg.length > 0) {
        console.log(
          "⚠️ WARNING: These degradation nodes are HIGHLIGHTED when they shouldn't be:",
          highlightedDeg
        );
      } else {
        console.log(
          "✓ All degradation nodes are correctly dimmed (not highlighted)"
        );
      }
    }

    return prepared;
  }, [
    nodesWithRisk,
    highlightedNodeIds,
    focusMode,
    isAnimating,
    animatedNodeId,
    isNodeVisible,
    hoveredNode,
    selectedNode,
  ]);

  // Prepare edges with animation for highlighted paths
  // Use visibleEdges from useExpandCollapse hook
  const preparedEdges = useMemo(() => {
    const visibleNodeIds = new Set(preparedNodes.map((n) => n.id));
    return visibleEdges
      .filter((edge) => {
        // Only show edges where both source and target are visible
        return (
          visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
        );
      })
      .map((edge) => {
        const sourceHighlighted = highlightedNodeIds.has(edge.source);
        const targetHighlighted = highlightedNodeIds.has(edge.target);
        const isHighlighted = sourceHighlighted && targetHighlighted;
        const isAnimated =
          animatedNodeId === edge.source || animatedNodeId === edge.target;

        return {
          ...edge,
          type: isHighlighted || isAnimated ? "animated" : "default",
          animated: isHighlighted || isAnimated,
          style: {
            ...edge.style,
            strokeWidth: isHighlighted || isAnimated ? 3 : 2,
            stroke: isHighlighted || isAnimated ? "#6366f1" : "#94a3b8",
            opacity:
              (focusMode || isAnimating) && !isHighlighted && !isAnimated
                ? 0.2
                : 1,
          },
        };
      });
  }, [
    visibleEdges,
    highlightedNodeIds,
    focusMode,
    isAnimating,
    animatedNodeId,
    nodes,
    preparedNodes,
  ]);

  // Save diagram
  const handleSave = useCallback(() => {
    const data = { nodes, edges };
    if (validateBowtieSchema(data)) {
      saveToJSON(data);
    } else {
      alert("Invalid bowtie diagram structure");
    }
  }, [nodes, edges]);

  // ReactFlow instance ref for fitView
  const reactFlowInstance = useRef(null);

  // Load diagram
  const handleLoad = useCallback(
    (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result);
          if (validateBowtieSchema(data)) {
            // Load nodes and edges, ensuring horizontal flow positions
            const loadedNodes = (data.nodes || []).map((node) => {
              // Set default horizontal flow positions if not present
              if (!node.sourcePosition || !node.targetPosition) {
                let sourcePosition = "right";
                let targetPosition = "left";

                if (node.type === "hazard") {
                  sourcePosition = "bottom";
                  targetPosition = "top";
                } else if (node.type === "topEvent") {
                  sourcePosition = "right";
                  targetPosition = "left";
                } else if (
                  ["degradationFactor", "degradationControl"].includes(
                    node.type
                  )
                ) {
                  sourcePosition = "top";
                  targetPosition = "bottom";
                }

                return {
                  ...node,
                  sourcePosition,
                  targetPosition,
                };
              }
              return node;
            });

            setNodes(loadedNodes);
            setEdges(data.edges || []);

            // Auto-fit view after nodes are positioned
            setTimeout(() => {
              if (reactFlowInstance.current) {
                reactFlowInstance.current.fitView({
                  padding: 0.2,
                  maxZoom: 1.5,
                });
              }
            }, 300);
          } else {
            alert("Invalid bowtie diagram file");
          }
        } catch (error) {
          alert("Error loading file: " + error);
        }
      };
      reader.readAsText(file);
    },
    [setNodes, setEdges]
  );

  // Update node data
  const handleNodeUpdate = useCallback(
    (updatedNode) => {
      setNodes((nds) =>
        nds.map((node) => (node.id === updatedNode.id ? updatedNode : node))
      );
      setSelectedNode(updatedNode);
    },
    [setNodes]
  );

  // Add new node
  const handleAddNode = useCallback(
    (type) => {
      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position: { x: Math.random() * 400, y: Math.random() * 400 },
        data: {
          label: type === "topEvent" ? "Loss of Control" : `New ${type}`,
          description: "",
          ...(type === "barrier" && { barrierType: "prevention" }),
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  // Delete selected node
  const handleDeleteNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            edge.source !== selectedNode.id && edge.target !== selectedNode.id
        )
      );
      setSelectedNode(null);
      setIsEditorOpen(false);
    }
  }, [selectedNode, setNodes, setEdges]);

  if (error) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: "20px",
        }}
      >
        <h2 style={{ color: "#ef4444", marginBottom: "10px" }}>
          Error Loading Application
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "20px" }}>{error}</p>
        <button
          onClick={() => {
            setError(null);
            window.location.reload();
          }}
          style={{
            padding: "10px 20px",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Reload Page
        </button>
        <details style={{ marginTop: "20px", maxWidth: "600px" }}>
          <summary style={{ cursor: "pointer", color: "#6b7280" }}>
            Check Console for Details
          </summary>
          <pre
            style={{
              background: "#f3f4f6",
              padding: "10px",
              borderRadius: "4px",
              marginTop: "10px",
              fontSize: "12px",
              overflow: "auto",
            }}
          >
            {error}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={preparedNodes}
        edges={preparedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
          instance.fitView({ padding: 0.2, maxZoom: 1.5 });
        }}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
        snapToGrid={true}
        snapGrid={[20, 20]}
        connectionLineStyle={{ stroke: "#6366f1", strokeWidth: 2 }}
        defaultEdgeOptions={{
          type: "smoothstep", // Use smoothstep for horizontal flow
          style: { strokeWidth: 2, stroke: "#6366f1" },
          animated: false,
        }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const type = node.type || "default";
            const colors = {
              hazard: "#f59e0b",
              topEvent: "#f97316",
              threat: "#3b82f6",
              barrier: "#10b981",
              consequence: "#ef4444",
            };
            return colors[type] || "#94a3b8";
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <Panel position="top-left">
          <Toolbar
            onAutoLayout={handleAutoLayout}
            onSave={handleSave}
            onLoad={handleLoad}
            onAddNode={handleAddNode}
            isLayouting={isLayouting}
            focusMode={focusMode}
            onToggleFocus={() => setFocusMode(!focusMode)}
          />
        </Panel>
      </ReactFlow>

      {isEditorOpen && selectedNode && (
        <NodeEditor
          node={selectedNode}
          onUpdate={handleNodeUpdate}
          onDelete={handleDeleteNode}
          onClose={() => {
            setIsEditorOpen(false);
            setSelectedNode(null);
            setFocusMode(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
