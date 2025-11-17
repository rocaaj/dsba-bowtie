import React, { useState, useCallback, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { nodeTypes } from './components/NodeTypes'
import { useELKLayout } from './utils/elkLayout'
import NodeEditor from './components/NodeEditor'
import Toolbar from './components/Toolbar'
import { saveToJSON, validateBowtieSchema } from './utils/dataModel'

const initialNodes = []
const initialEdges = []

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [error, setError] = useState(null)

  // ELK layout hook
  const { applyLayout, isLayouting } = useELKLayout()

  // Error boundary effect
  useEffect(() => {
    const handleError = (event) => {
      console.error('Global error:', event.error)
      setError(event.error?.message || 'An error occurred')
    }
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  // Handle edge connections
  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        labelStyle: { fill: '#6366f1', fontWeight: 500 },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges]
  )

  // Handle node selection
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node)
    setIsEditorOpen(true)
  }, [])

  // Handle pane click to deselect
  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setIsEditorOpen(false)
  }, [])

  // Apply ELK layout
  const handleAutoLayout = useCallback(async () => {
    await applyLayout(nodes, edges, setNodes, setEdges)
  }, [nodes, edges, applyLayout, setNodes, setEdges])

  // Save diagram
  const handleSave = useCallback(() => {
    const data = { nodes, edges }
    if (validateBowtieSchema(data)) {
      saveToJSON(data)
    } else {
      alert('Invalid bowtie diagram structure')
    }
  }, [nodes, edges])

  // Load diagram
  const handleLoad = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result)
        if (validateBowtieSchema(data)) {
          setNodes(data.nodes || [])
          setEdges(data.edges || [])
        } else {
          alert('Invalid bowtie diagram file')
        }
      } catch (error) {
        alert('Error loading file: ' + error)
      }
    }
    reader.readAsText(file)
  }, [setNodes, setEdges])

  // Update node data
  const handleNodeUpdate = useCallback((updatedNode) => {
    setNodes((nds) =>
      nds.map((node) => (node.id === updatedNode.id ? updatedNode : node))
    )
    setSelectedNode(updatedNode)
  }, [setNodes])

  // Add new node
  const handleAddNode = useCallback((type) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: `New ${type}`,
        description: '',
      },
    }
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  // Delete selected node
  const handleDeleteNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            edge.source !== selectedNode.id && edge.target !== selectedNode.id
        )
      )
      setSelectedNode(null)
      setIsEditorOpen(false)
    }
  }, [selectedNode, setNodes, setEdges])

  if (error) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '20px'
      }}>
        <h2 style={{ color: '#ef4444', marginBottom: '10px' }}>Error Loading Application</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={() => {
            setError(null)
            window.location.reload()
          }}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
        <details style={{ marginTop: '20px', maxWidth: '600px' }}>
          <summary style={{ cursor: 'pointer', color: '#6b7280' }}>Check Console for Details</summary>
          <pre style={{ 
            background: '#f3f4f6', 
            padding: '10px', 
            borderRadius: '4px',
            marginTop: '10px',
            fontSize: '12px',
            overflow: 'auto'
          }}>
            {error}
          </pre>
        </details>
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid={true}
        snapGrid={[20, 20]}
        connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
        defaultEdgeOptions={{
          style: { strokeWidth: 2, stroke: '#6366f1' },
          animated: false,
        }}
        edgeTypes={{}}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const type = node.type || 'default'
            const colors = {
              hazard: '#f59e0b',
              threat: '#3b82f6',
              barrier: '#10b981',
              consequence: '#ef4444',
            }
            return colors[type] || '#94a3b8'
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
          />
        </Panel>
      </ReactFlow>

      {isEditorOpen && selectedNode && (
        <NodeEditor
          node={selectedNode}
          onUpdate={handleNodeUpdate}
          onDelete={handleDeleteNode}
          onClose={() => {
            setIsEditorOpen(false)
            setSelectedNode(null)
          }}
        />
      )}
    </div>
  )
}

export default App
