// Custom hook for expand/collapse functionality
// Following React Flow's expand-collapse pattern: https://reactflow.dev/examples/layout/expand-collapse
import { useCallback, useMemo } from 'react'

/**
 * Hook to manage expand/collapse state for bowtie diagrams
 * Maintains complete graph structure while only rendering visible portions
 */
export const useExpandCollapse = (nodes, edges) => {
  // Get all nodes that should always be visible
  const alwaysVisibleTypes = ['hazard', 'topEvent', 'threat', 'consequence']
  
  // Get expanded state from node data or default to collapsed
  const getExpandedState = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId)
    return node?.data?.expanded ?? false
  }, [nodes])
  
  // Check if a node is visible based on parent expansion state
  const isNodeVisible = useCallback((node) => {
    // Always show core nodes
    if (alwaysVisibleTypes.includes(node.type)) {
      return true
    }
    
    // Barriers and degradation nodes depend on parent expansion
    if (node.type === 'barrier') {
      const barrierType = node.data?.barrierType
      
      if (barrierType === 'prevention') {
        // Find the threat this barrier chain belongs to by traversing the chain
        // Start from this barrier and traverse BACKWARDS (where barrier is target) to find the threat
        const findThreatForBarrier = (barrierId, visited = new Set()) => {
          if (visited.has(barrierId)) return null
          visited.add(barrierId)
          
          // For prevention barriers, only traverse backwards (where barrier is the target)
          // This prevents traversing through top event or going in wrong direction
          // Filter out edges from degradation nodes and other non-chain nodes - only follow threat → barrier → barrier chain
          const incomingEdges = edges.filter(e => {
            if (e.target !== barrierId) return false
            const sourceNode = nodes.find(n => n.id === e.source)
            if (!sourceNode) return false
            const sourceType = sourceNode.type
            // Only allow threat or prevention barrier as sources - explicitly exclude everything else
            if (sourceType === 'threat') return true
            if (sourceType === 'barrier' && sourceNode.data?.barrierType === 'prevention') return true
            return false
          })
          
          // Try threats first (direct connection)
          for (const edge of incomingEdges) {
            const otherId = edge.source
            const otherNode = nodes.find(n => n.id === otherId)
            
            if (otherNode?.type === 'threat') {
              return otherNode.id
            }
          }
          
          // Then try prevention barriers (chain traversal)
          for (const edge of incomingEdges) {
            const otherId = edge.source
            const otherNode = nodes.find(n => n.id === otherId)
            
            if (otherNode?.type === 'barrier' && otherNode.data?.barrierType === 'prevention') {
              const threatId = findThreatForBarrier(otherId, visited)
              if (threatId) return threatId
            }
          }
          
          return null
        }
        
        const threatId = findThreatForBarrier(node.id)
        if (threatId) {
          return getExpandedState(threatId)
        }
      } else if (barrierType === 'mitigation') {
        // Find the consequence this barrier chain belongs to by traversing the chain
        // Start from this barrier and traverse FORWARDS (where barrier is source) to find the consequence
        const findConsequenceForBarrier = (barrierId, visited = new Set()) => {
          if (visited.has(barrierId)) return null
          visited.add(barrierId)
          
          // For mitigation barriers, only traverse forwards (where barrier is the source)
          // This prevents traversing through top event or going in wrong direction
          // Filter out edges to degradation nodes and other non-chain nodes - only follow barrier → barrier → consequence chain
          const outgoingEdges = edges.filter(e => {
            if (e.source !== barrierId) return false
            const targetNode = nodes.find(n => n.id === e.target)
            const targetType = targetNode?.type
            // Only allow consequence or mitigation barrier as targets
            return targetType === 'consequence' || 
                   (targetType === 'barrier' && targetNode?.data?.barrierType === 'mitigation')
          })
          
          for (const edge of outgoingEdges) {
            const otherId = edge.target
            const otherNode = nodes.find(n => n.id === otherId)
            
            if (!otherNode) continue
            
            // If connected to a consequence, we found it!
            if (otherNode.type === 'consequence') {
              return otherNode.id
            }
            
            // If connected to another mitigation barrier, traverse it (forwards)
            if (otherNode.type === 'barrier' && otherNode.data?.barrierType === 'mitigation') {
              const consequenceId = findConsequenceForBarrier(otherId, visited)
              if (consequenceId) return consequenceId
            }
          }
          
          return null
        }
        
        const consequenceId = findConsequenceForBarrier(node.id)
        if (consequenceId) {
          return getExpandedState(consequenceId)
        }
      }
      
      return false
    }
    
    // Degradation factors/controls depend on barrier visibility
    // Connection pattern: degradationFactor → degradationControl → barrier
    // Degradation factors only connect to controls, controls connect to barriers
    if (['degradationFactor', 'degradationControl'].includes(node.type)) {
      let connectedBarrier = null
      
      if (node.type === 'degradationFactor') {
        // Degradation factors connect to controls, controls connect to barriers
        // Find the connected control first - degradation factor is typically SOURCE
        const controlEdge = edges.find(e => {
          if (e.source === node.id) {
            const targetNode = nodes.find(n => n.id === e.target)
            return targetNode?.type === 'degradationControl'
          } else if (e.target === node.id) {
            const sourceNode = nodes.find(n => n.id === e.source)
            return sourceNode?.type === 'degradationControl'
          }
          return false
        })
        
        if (controlEdge) {
          const controlId = controlEdge.source === node.id ? controlEdge.target : controlEdge.source
          // Now find the barrier connected to this control - control is typically SOURCE, barrier is TARGET
          // Get ALL edges connected to the control to see what we're matching
          const allControlEdges = edges.filter(e => e.source === controlId || e.target === controlId)
          const barrierEdge = allControlEdges.find(e => {
            if (e.source === controlId) {
              const targetNode = nodes.find(n => n.id === e.target)
              return targetNode?.type === 'barrier'
            } else if (e.target === controlId) {
              const sourceNode = nodes.find(n => n.id === e.source)
              return sourceNode?.type === 'barrier'
            }
            return false
          })
          
          if (barrierEdge) {
            const barrierId = barrierEdge.source === controlId ? barrierEdge.target : barrierEdge.source
            connectedBarrier = nodes.find(n => n.id === barrierId)
          }
        }
      } else if (node.type === 'degradationControl') {
        // Degradation controls connect directly to barriers
        // Degradation control is typically the SOURCE, barrier is the TARGET
        // But check both directions to be safe
        const barrierEdge = edges.find(e => {
          if (e.source === node.id) {
            // Degradation control is source, barrier should be target
            const targetNode = nodes.find(n => n.id === e.target)
            return targetNode?.type === 'barrier'
          } else if (e.target === node.id) {
            // Degradation control is target, barrier should be source
            const sourceNode = nodes.find(n => n.id === e.source)
            return sourceNode?.type === 'barrier'
          }
          return false
        })
        
        if (barrierEdge) {
          const barrierId = barrierEdge.source === node.id ? barrierEdge.target : barrierEdge.source
          connectedBarrier = nodes.find(n => n.id === barrierId)
        }
      }
      
      // If no barrier found, degradation node is not visible
      if (!connectedBarrier) {
        return false
      }
      
      // Check if the connected barrier is visible by finding its parent threat/consequence
      const barrierType = connectedBarrier.data?.barrierType
      
      if (barrierType === 'prevention') {
        // Find the threat this barrier belongs to
        // Traverse BACKWARDS (where barrier is target) to find the threat
        const findThreatForBarrier = (barrierId, visited = new Set()) => {
          if (visited.has(barrierId)) return null
          visited.add(barrierId)
          
          // For prevention barriers, only traverse backwards (where barrier is the target)
          // Filter out edges from degradation nodes and other non-chain nodes - only follow threat → barrier → barrier chain
          const incomingEdges = edges.filter(e => {
            if (e.target !== barrierId) return false
            const sourceNode = nodes.find(n => n.id === e.source)
            if (!sourceNode) return false
            const sourceType = sourceNode.type
            // Only allow threat or prevention barrier as sources - explicitly exclude everything else
            if (sourceType === 'threat') return true
            if (sourceType === 'barrier' && sourceNode.data?.barrierType === 'prevention') return true
            return false
          })
          
          // Try threats first (direct connection)
          for (const edge of incomingEdges) {
            const otherId = edge.source
            const otherNode = nodes.find(n => n.id === otherId)
            
            if (otherNode?.type === 'threat') {
              return otherNode.id
            }
          }
          
          // Then try prevention barriers (chain traversal)
          for (const edge of incomingEdges) {
            const otherId = edge.source
            const otherNode = nodes.find(n => n.id === otherId)
            
            if (otherNode?.type === 'barrier' && otherNode.data?.barrierType === 'prevention') {
              const threatId = findThreatForBarrier(otherId, visited)
              if (threatId) return threatId
            }
          }
          
          return null
        }
        
        const threatId = findThreatForBarrier(connectedBarrier.id)
        if (threatId && getExpandedState(threatId)) {
          return true // Barrier is visible, so degradation node is visible
        }
      } else if (barrierType === 'mitigation') {
        // Find the consequence this barrier belongs to
        // Traverse FORWARDS (where barrier is source) to find the consequence
        const findConsequenceForBarrier = (barrierId, visited = new Set()) => {
          if (visited.has(barrierId)) return null
          visited.add(barrierId)
          
          // For mitigation barriers, only traverse forwards (where barrier is the source)
          // Filter out edges to degradation nodes and other non-chain nodes - only follow barrier → barrier → consequence chain
          const outgoingEdges = edges.filter(e => {
            if (e.source !== barrierId) return false
            const targetNode = nodes.find(n => n.id === e.target)
            const targetType = targetNode?.type
            // Only allow consequence or mitigation barrier as targets
            return targetType === 'consequence' || 
                   (targetType === 'barrier' && targetNode?.data?.barrierType === 'mitigation')
          })
          
          for (const edge of outgoingEdges) {
            const otherId = edge.target
            const otherNode = nodes.find(n => n.id === otherId)
            
            if (!otherNode) continue
            
            // If connected to a consequence, we found it!
            if (otherNode.type === 'consequence') {
              return otherNode.id
            }
            
            // If connected to another mitigation barrier, traverse it (forwards)
            if (otherNode.type === 'barrier' && otherNode.data?.barrierType === 'mitigation') {
              const consequenceId = findConsequenceForBarrier(otherId, visited)
              if (consequenceId) return consequenceId
            }
          }
          
          return null
        }
        
        const consequenceId = findConsequenceForBarrier(connectedBarrier.id)
        if (consequenceId && getExpandedState(consequenceId)) {
          return true // Barrier is visible, so degradation node is visible
        }
      }
      
      // If barrier is not visible, degradation node is not visible
      return false
    }
    
    return true
  }, [nodes, edges, getExpandedState, alwaysVisibleTypes])
  
  // Get visible nodes
  const visibleNodes = useMemo(() => {
    return nodes.filter(node => isNodeVisible(node))
  }, [nodes, isNodeVisible])
  
  // Get visible edges (only between visible nodes)
  const visibleEdges = useMemo(() => {
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id))
    return edges.filter(edge => 
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    )
  }, [edges, visibleNodes])
  
  // Toggle expand/collapse for a node
  const toggleExpand = useCallback((nodeId) => {
    return (currentNodes) => {
      return currentNodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              expanded: !node.data?.expanded
            }
          }
        }
        return node
      })
    }
  }, [])
  
  return {
    visibleNodes,
    visibleEdges,
    isNodeVisible,
    getExpandedState,
    toggleExpand
  }
}

