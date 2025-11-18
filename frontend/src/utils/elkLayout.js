import React from 'react'
import { NODE_DIMENSIONS } from '../components/NodeTypes'

let elkInstance = null

// Lazy load ELK to prevent app crash if import fails
const getELK = async () => {
  if (elkInstance) return elkInstance
  
  try {
    // Try the bundled version first (no web workers needed)
    // The bundled version is UMD and may set window.ELK
    const ELKModule = await import('elkjs/lib/elk.bundled.js')
    
    // UMD modules can export in different ways
    // Check for default export, named export, or global
    let ELK = null
    
    if (ELKModule.default && typeof ELKModule.default === 'function') {
      ELK = ELKModule.default
    } else if (ELKModule.ELK && typeof ELKModule.ELK === 'function') {
      ELK = ELKModule.ELK
    } else if (typeof ELKModule === 'function') {
      ELK = ELKModule
    } else if (typeof window !== 'undefined' && window.ELK) {
      // UMD might have set it on window
      ELK = window.ELK
    } else if (typeof globalThis !== 'undefined' && globalThis.ELK) {
      // Or on globalThis
      ELK = globalThis.ELK
    }
    
    if (!ELK || typeof ELK !== 'function') {
      console.error('ELK import structure:', {
        keys: Object.keys(ELKModule),
        hasDefault: !!ELKModule.default,
        defaultType: typeof ELKModule.default,
        hasELK: !!ELKModule.ELK,
        moduleType: typeof ELKModule,
        windowELK: typeof window !== 'undefined' ? typeof window.ELK : 'N/A',
      })
      throw new Error('Could not find ELK constructor in bundled module')
    }
    
    // The bundled version doesn't need worker configuration
    elkInstance = new ELK()
    return elkInstance
  } catch (e1) {
    console.warn('Bundled ELK import failed, trying elk-api.js:', e1.message)
    
    try {
      // Fallback to elk-api.js (requires worker, but works with ES modules)
      const ELKModule = await import('elkjs/lib/elk-api.js')
      
      let ELK = ELKModule.default || ELKModule.ELK || ELKModule
      
      if (typeof ELK !== 'function') {
        throw new Error('ELK is not a constructor in elk-api.js')
      }
      
      // elk-api.js requires a worker factory or workerUrl
      // For now, we'll use a simple worker factory that creates a no-op worker
      // In a real scenario, you'd want to provide the actual worker URL
      elkInstance = new ELK({
        workerFactory: (url) => {
          // Create a worker from the bundled version instead
          // This is a workaround - ideally we'd use the bundled version
          return new Worker(new URL('elkjs/lib/elk-worker.min.js', import.meta.url))
        }
      })
      return elkInstance
    } catch (e2) {
      console.error('All ELK import attempts failed:', {
        bundled: e1.message,
        api: e2.message,
      })
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
          // Use layered algorithm - best for hierarchical bowtie structure
          'elk.algorithm': 'layered',
          'elk.direction': 'RIGHT', // Horizontal flow: threats → barriers → top event → barriers → consequences
          
          // Spacing configuration for better vertical spacing
          'elk.spacing.nodeNode': '100', // Increased from 80 for better node separation
          'elk.spacing.edgeNode': '30', // Increased from 20 for edge-to-node spacing
          'elk.layered.spacing.nodeNodeBetweenLayers': '150', // Increased from 100 for layer separation
          'elk.layered.spacing.edgeNodeBetweenLayers': '50', // Spacing between edges and nodes across layers
          
          // Node placement strategy - BRANDES_KOEPF is good for minimizing crossings
          'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
          
          // Crossing minimization - LAYER_SWEEP is efficient
          'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
          
          // Consider model order to preserve sequential barrier chains
          'elk.considerModelOrder': 'true',
          'elk.considerModelOrder.groupModelOrder': 'true',
          
          // Port constraints for better connection points
          'elk.portAlignment.basic': 'JUSTIFIED',
          
          // Node size constraints - account for degradation node heights
          'elk.nodeSize.constraints': 'NODE_LABELS',
          'elk.nodeSize.options': 'DEFAULT_MINIMUM_SIZE',
          
          // Overlap removal - use SPORE algorithm for degradation branches
          // SPORE (SPOrE) is applied as a post-processing step to remove node overlaps
          'elk.overlapRemoval': 'org.eclipse.elk.sporeOverlap',
          'elk.overlapRemoval.maxIterations': '64',
          'elk.overlapRemoval.runScanline': 'true',
        },
        children: nodes.map((node) => {
          // Use actual node dimensions for better spacing calculations
          let nodeWidth = node.width || 150
          let nodeHeight = node.height || 60
          
          // Account for node type-specific dimensions
          if (node.type === 'topEvent') {
            nodeWidth = node.width || NODE_DIMENSIONS.topEvent.width
            nodeHeight = node.height || NODE_DIMENSIONS.topEvent.height
          } else if (['degradationFactor', 'degradationControl'].includes(node.type)) {
            // Degradation nodes need more vertical space for staircase layout
            nodeWidth = node.width || NODE_DIMENSIONS.collapsed.width
            nodeHeight = node.height || NODE_DIMENSIONS.collapsed.height + 40 // Extra space for staircase
          } else {
            nodeWidth = node.width || NODE_DIMENSIONS.collapsed.width
            nodeHeight = node.height || NODE_DIMENSIONS.collapsed.height
          }
          
          // Create child node with layout options
          const childNode = {
            id: node.id,
            width: nodeWidth,
            height: nodeHeight,
          }
          
          // Apply SPORE overlap removal specifically to degradation nodes
          // This ensures degradation branches (factors and controls) don't overlap
          if (['degradationFactor', 'degradationControl'].includes(node.type)) {
            childNode.layoutOptions = {
              'elk.overlapRemoval': 'org.eclipse.elk.sporeOverlap',
              'elk.overlapRemoval.maxIterations': '64',
              'elk.overlapRemoval.runScanline': 'true',
              'elk.spacing.nodeNode': '30', // Tighter spacing for degradation branches
              'elk.padding': '[top=10,left=10,bottom=10,right=10]', // Padding around degradation nodes
            }
          }
          
          return childNode
        }),
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
