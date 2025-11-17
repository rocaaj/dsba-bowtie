import React from 'react'

let elkInstance = null

// Lazy load ELK to prevent app crash if import fails
const getELK = async () => {
  if (elkInstance) return elkInstance
  
  try {
    // Try bundled version first (no web workers needed)
    const ELKModule = await import('elkjs/lib/elk.bundled.js')
    // The bundled version exports ELK as default
    const ELK = ELKModule.default || ELKModule
    elkInstance = new ELK()
    return elkInstance
  } catch (e1) {
    console.warn('Bundled ELK import failed, trying default:', e1)
    try {
      // Fallback to default
      const ELKModule = await import('elkjs')
      const ELK = ELKModule.default || ELKModule
      elkInstance = new ELK()
      return elkInstance
    } catch (e2) {
      console.error('ELK.js failed to load completely:', e2)
      return null
    }
  }
}

export const useELKLayout = () => {
  const [isLayouting, setIsLayouting] = React.useState(false)

  const applyLayout = async (nodes, edges, setNodes, setEdges) => {
    const elk = await getELK()
    if (!elk) {
      alert('ELK layout engine is not available. Auto-layout feature disabled.')
      return
    }

    setIsLayouting(true)
    try {
      const graph = {
        id: 'root',
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': 'RIGHT',
          'elk.spacing.nodeNode': '80',
          'elk.spacing.edgeNode': '20',
          'elk.layered.spacing.nodeNodeBetweenLayers': '100',
          'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
          'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
        },
        children: nodes.map((node) => ({
          id: node.id,
          width: node.width || 150,
          height: node.height || 60,
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          sources: [edge.source],
          targets: [edge.target],
        })),
      }

      const layoutedGraph = await elk.layout(graph)

      const layoutedNodes = nodes.map((node) => {
        const layoutedNode = layoutedGraph.children.find((n) => n.id === node.id)
        return {
          ...node,
          position: {
            x: layoutedNode?.x || node.position.x,
            y: layoutedNode?.y || node.position.y,
          },
        }
      })

      setNodes(layoutedNodes)
    } catch (error) {
      console.error('ELK layout error:', error)
      alert('Layout failed: ' + error.message)
    } finally {
      setIsLayouting(false)
    }
  }

  return { applyLayout, isLayouting }
}
