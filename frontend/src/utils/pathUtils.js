// Utility functions for path finding and node relationships

/**
 * Find all nodes connected to a given node (both incoming and outgoing)
 */
export const getConnectedNodeIds = (nodeId, edges) => {
  const connected = new Set()
  
  edges.forEach((edge) => {
    if (edge.source === nodeId) {
      connected.add(edge.target)
    }
    if (edge.target === nodeId) {
      connected.add(edge.source)
    }
  })
  
  return Array.from(connected)
}

/**
 * Find all edges connected to a given node
 */
export const getConnectedEdges = (nodeId, edges) => {
  return edges.filter(
    (edge) => edge.source === nodeId || edge.target === nodeId
  )
}

/**
 * Find all nodes in a path starting from a node
 * Returns all nodes reachable from the starting node
 */
export const getAllConnectedNodes = (startNodeId, edges, nodes) => {
  const visited = new Set([startNodeId])
  const queue = [startNodeId]
  const result = new Set([startNodeId])
  
  while (queue.length > 0) {
    const currentId = queue.shift()
    
    edges.forEach((edge) => {
      let nextId = null
      if (edge.source === currentId) {
        nextId = edge.target
      } else if (edge.target === currentId) {
        nextId = edge.source
      }
      
      if (nextId && !visited.has(nextId)) {
        visited.add(nextId)
        queue.push(nextId)
        result.add(nextId)
      }
    })
  }
  
  return Array.from(result)
}

/**
 * Find the specific path for a node in a bowtie diagram
 * Returns only nodes in the sequential path, not all connected nodes
 * For threats: threat → prevention barriers → top event (including degradation nodes)
 * For consequences: top event → mitigation barriers → consequence (including degradation nodes)
 * For barriers: the barrier and its path (prevention or mitigation chain)
 * For top event: all paths (threats and consequences)
 */
export const getNodePath = (nodeId, edges, nodes) => {
  const node = nodes.find(n => n.id === nodeId)
  if (!node) return [nodeId]
  
  const path = new Set([nodeId])
  
  // Helper function to add degradation nodes connected to a barrier
  // Only adds degradation nodes if the barrier is already in the path
  const addDegradationNodes = (barrierId) => {
    // Only add degradation nodes if the barrier is in the path
    if (!path.has(barrierId)) return
    
    // Find degradation controls connected to this barrier
    const controlEdges = edges.filter(e => {
      const otherId = e.source === barrierId ? e.target : e.source
      const otherNode = nodes.find(n => n.id === otherId)
      return otherNode?.type === 'degradationControl'
    })
    
    controlEdges.forEach(controlEdge => {
      const controlId = controlEdge.source === barrierId ? controlEdge.target : controlEdge.source
      path.add(controlId)
      
      // Find degradation factors connected to this control
      const factorEdges = edges.filter(e => {
        const otherId = e.source === controlId ? e.target : e.source
        const otherNode = nodes.find(n => n.id === otherId)
        return otherNode?.type === 'degradationFactor'
      })
      
      factorEdges.forEach(factorEdge => {
        const factorId = factorEdge.source === controlId ? factorEdge.target : factorEdge.source
        path.add(factorId)
      })
    })
  }
  
  if (node.type === 'threat') {
    // For threats: find the path threat → prevention barriers → top event
    // Find the first prevention barrier connected to this threat
    const firstBarrierEdge = edges.find(e => 
      (e.source === nodeId && nodes.find(n => n.id === e.target)?.type === 'barrier' && 
       nodes.find(n => n.id === e.target)?.data?.barrierType === 'prevention') ||
      (e.target === nodeId && nodes.find(n => n.id === e.source)?.type === 'barrier' && 
       nodes.find(n => n.id === e.source)?.data?.barrierType === 'prevention')
    )
    
    if (firstBarrierEdge) {
      const firstBarrierId = firstBarrierEdge.source === nodeId ? firstBarrierEdge.target : firstBarrierEdge.source
      path.add(firstBarrierId)
      
      // Follow the prevention barrier chain to the top event
      let currentBarrierId = firstBarrierId
      const visitedBarriers = new Set([currentBarrierId])
      
      while (currentBarrierId) {
        // Find the next node in the chain (could be another barrier or top event)
        const nextEdge = edges.find(e => {
          if (e.source === currentBarrierId) {
            const targetNode = nodes.find(n => n.id === e.target)
            return targetNode && (
              targetNode.type === 'topEvent' ||
              (targetNode.type === 'barrier' && targetNode.data?.barrierType === 'prevention' && !visitedBarriers.has(e.target))
            )
          }
          return false
        })
        
        if (nextEdge) {
          const nextId = nextEdge.target
          path.add(nextId)
          
          // Add degradation nodes for barriers in the path
          if (nodes.find(n => n.id === nextId)?.type === 'barrier') {
            addDegradationNodes(nextId)
          }
          
          if (nodes.find(n => n.id === nextId)?.type === 'topEvent') {
            break // Reached top event
          } else {
            currentBarrierId = nextId
            visitedBarriers.add(nextId)
          }
        } else {
          break
        }
      }
      
      // Add degradation nodes for the first barrier
      if (firstBarrierId) {
        addDegradationNodes(firstBarrierId)
      }
    }
  } else if (node.type === 'consequence') {
    // For consequences: find the path top event → mitigation barriers → consequence
    // Find the last mitigation barrier connected to this consequence
    const lastBarrierEdge = edges.find(e => 
      (e.target === nodeId && nodes.find(n => n.id === e.source)?.type === 'barrier' && 
       nodes.find(n => n.id === e.source)?.data?.barrierType === 'mitigation') ||
      (e.source === nodeId && nodes.find(n => n.id === e.target)?.type === 'barrier' && 
       nodes.find(n => n.id === e.target)?.data?.barrierType === 'mitigation')
    )
    
    if (lastBarrierEdge) {
      const lastBarrierId = lastBarrierEdge.target === nodeId ? lastBarrierEdge.source : lastBarrierEdge.target
      path.add(lastBarrierId)
      
      // Follow the mitigation barrier chain backwards to the top event
      let currentBarrierId = lastBarrierId
      const visitedBarriers = new Set([currentBarrierId])
      
      while (currentBarrierId) {
        // Find the previous node in the chain (could be another barrier or top event)
        const prevEdge = edges.find(e => {
          if (e.target === currentBarrierId) {
            const sourceNode = nodes.find(n => n.id === e.source)
            return sourceNode && (
              sourceNode.type === 'topEvent' ||
              (sourceNode.type === 'barrier' && sourceNode.data?.barrierType === 'mitigation' && !visitedBarriers.has(e.source))
            )
          }
          return false
        })
        
        if (prevEdge) {
          const prevId = prevEdge.source
          path.add(prevId)
          
          // Add degradation nodes for barriers in the path
          if (nodes.find(n => n.id === prevId)?.type === 'barrier') {
            addDegradationNodes(prevId)
          }
          
          if (nodes.find(n => n.id === prevId)?.type === 'topEvent') {
            break // Reached top event
          } else {
            currentBarrierId = prevId
            visitedBarriers.add(prevId)
          }
        } else {
          break
        }
      }
      
      // Add degradation nodes for the last barrier
      if (lastBarrierId) {
        addDegradationNodes(lastBarrierId)
      }
    }
  } else if (node.type === 'barrier') {
    // For barriers: find the FULL path from threat through top event to consequence
    // This ensures when hovering on a barrier, we see the complete path left and right
    const barrierType = node.data?.barrierType
    
    // Add degradation nodes for this barrier
    addDegradationNodes(nodeId)
    
    if (barrierType === 'prevention') {
      // Find the threat this barrier belongs to (left side)
      const threatEdge = edges.find(e => {
        const otherId = e.source === nodeId ? e.target : e.source
        const otherNode = nodes.find(n => n.id === otherId)
        return otherNode?.type === 'threat'
      })
      
      if (threatEdge) {
        const threatId = threatEdge.source === nodeId ? threatEdge.target : threatEdge.source
        path.add(threatId)
      }
      
      // Follow forward to top event (left side continuation)
      let currentBarrierId = nodeId
      const visitedBarriers = new Set([currentBarrierId])
      
      while (currentBarrierId) {
        const nextEdge = edges.find(e => {
          if (e.source === currentBarrierId) {
            const targetNode = nodes.find(n => n.id === e.target)
            return targetNode && (
              targetNode.type === 'topEvent' ||
              (targetNode.type === 'barrier' && targetNode.data?.barrierType === 'prevention' && !visitedBarriers.has(e.target))
            )
          }
          return false
        })
        
        if (nextEdge) {
          const nextId = nextEdge.target
          path.add(nextId)
          
          // Add degradation nodes for barriers in the path
          if (nodes.find(n => n.id === nextId)?.type === 'barrier') {
            addDegradationNodes(nextId)
          }
          
          if (nodes.find(n => n.id === nextId)?.type === 'topEvent') {
            // Found top event, now follow right side to consequences
            const topEventId = nextId
            
            // Find all mitigation barriers connected to top event (check both directions)
            const mitigationEdges = edges.filter(e => {
              const sourceNode = nodes.find(n => n.id === e.source)
              const targetNode = nodes.find(n => n.id === e.target)
              return (
                (sourceNode?.type === 'barrier' && 
                 sourceNode?.data?.barrierType === 'mitigation' &&
                 e.target === topEventId) ||
                (targetNode?.type === 'barrier' && 
                 targetNode?.data?.barrierType === 'mitigation' &&
                 e.source === topEventId)
              )
            })
            
            // For each mitigation barrier, follow to consequences
            mitigationEdges.forEach(edge => {
              // Get the barrier ID (could be source or target depending on edge direction)
              const mitigationBarrierId = 
                nodes.find(n => n.id === edge.source)?.type === 'barrier' && 
                nodes.find(n => n.id === edge.source)?.data?.barrierType === 'mitigation'
                  ? edge.source
                  : edge.target
              path.add(mitigationBarrierId)
              addDegradationNodes(mitigationBarrierId)
              
              // Follow mitigation chain to consequence
              let currentMitigationId = mitigationBarrierId
              const visitedMitigation = new Set([currentMitigationId])
              
              while (currentMitigationId) {
                const nextMitigationEdge = edges.find(e => {
                  if (e.source === currentMitigationId) {
                    const targetNode = nodes.find(n => n.id === e.target)
                    return targetNode && (
                      targetNode.type === 'consequence' ||
                      (targetNode.type === 'barrier' && targetNode.data?.barrierType === 'mitigation' && !visitedMitigation.has(e.target))
                    )
                  }
                  return false
                })
                
                if (nextMitigationEdge) {
                  const nextMitigationId = nextMitigationEdge.target
                  path.add(nextMitigationId)
                  
                  // Add degradation nodes for barriers in the path
                  if (nodes.find(n => n.id === nextMitigationId)?.type === 'barrier') {
                    addDegradationNodes(nextMitigationId)
                  }
                  
                  if (nodes.find(n => n.id === nextMitigationId)?.type === 'consequence') {
                    break
                  }
                  currentMitigationId = nextMitigationId
                  visitedMitigation.add(nextMitigationId)
                } else {
                  break
                }
              }
            })
            
            break
          }
          currentBarrierId = nextId
          visitedBarriers.add(nextId)
        } else {
          break
        }
      }
    } else if (barrierType === 'mitigation') {
      // Find the consequence this barrier belongs to (right side)
      const consequenceEdge = edges.find(e => {
        const otherId = e.source === nodeId ? e.target : e.source
        const otherNode = nodes.find(n => n.id === otherId)
        return otherNode?.type === 'consequence'
      })
      
      if (consequenceEdge) {
        const consequenceId = consequenceEdge.source === nodeId ? consequenceEdge.target : consequenceEdge.source
        path.add(consequenceId)
      }
      
      // Follow backward to top event (right side continuation)
      let currentBarrierId = nodeId
      const visitedBarriers = new Set([currentBarrierId])
      
      while (currentBarrierId) {
        const prevEdge = edges.find(e => {
          if (e.target === currentBarrierId) {
            const sourceNode = nodes.find(n => n.id === e.source)
            return sourceNode && (
              sourceNode.type === 'topEvent' ||
              (sourceNode.type === 'barrier' && sourceNode.data?.barrierType === 'mitigation' && !visitedBarriers.has(e.source))
            )
          }
          return false
        })
        
        if (prevEdge) {
          const prevId = prevEdge.source
          path.add(prevId)
          
          // Add degradation nodes for barriers in the path
          if (nodes.find(n => n.id === prevId)?.type === 'barrier') {
            addDegradationNodes(prevId)
          }
          
          if (nodes.find(n => n.id === prevId)?.type === 'topEvent') {
            // Found top event, now follow left side to threats
            const topEventId = prevId
            
            // Find all prevention barriers connected to top event (check both directions)
            const preventionEdges = edges.filter(e => {
              const sourceNode = nodes.find(n => n.id === e.source)
              const targetNode = nodes.find(n => n.id === e.target)
              return (
                (sourceNode?.type === 'barrier' && 
                 sourceNode?.data?.barrierType === 'prevention' &&
                 e.target === topEventId) ||
                (targetNode?.type === 'barrier' && 
                 targetNode?.data?.barrierType === 'prevention' &&
                 e.source === topEventId)
              )
            })
            
            // For each prevention barrier, follow to threats
            preventionEdges.forEach(edge => {
              // Get the barrier ID (could be source or target depending on edge direction)
              const preventionBarrierId = 
                nodes.find(n => n.id === edge.source)?.type === 'barrier' && 
                nodes.find(n => n.id === edge.source)?.data?.barrierType === 'prevention'
                  ? edge.source
                  : edge.target
              path.add(preventionBarrierId)
              addDegradationNodes(preventionBarrierId)
              
              // Follow prevention chain to threat
              let currentPreventionId = preventionBarrierId
              const visitedPrevention = new Set([currentPreventionId])
              
              while (currentPreventionId) {
                const nextPreventionEdge = edges.find(e => {
                  if (e.source === currentPreventionId) {
                    const targetNode = nodes.find(n => n.id === e.target)
                    return targetNode && (
                      targetNode.type === 'threat' ||
                      (targetNode.type === 'barrier' && targetNode.data?.barrierType === 'prevention' && !visitedPrevention.has(e.target))
                    )
                  }
                  return false
                })
                
                if (nextPreventionEdge) {
                  const nextPreventionId = nextPreventionEdge.target
                  path.add(nextPreventionId)
                  
                  // Add degradation nodes for barriers in the path
                  if (nodes.find(n => n.id === nextPreventionId)?.type === 'barrier') {
                    addDegradationNodes(nextPreventionId)
                  }
                  
                  if (nodes.find(n => n.id === nextPreventionId)?.type === 'threat') {
                    break
                  }
                  currentPreventionId = nextPreventionId
                  visitedPrevention.add(nextPreventionId)
                } else {
                  // Check if barrier connects directly to threat (backwards)
                  const threatEdge = edges.find(e => {
                    if (e.target === currentPreventionId) {
                      const sourceNode = nodes.find(n => n.id === e.source)
                      return sourceNode?.type === 'threat'
                    }
                    return false
                  })
                  
                  if (threatEdge) {
                    const threatId = threatEdge.source
                    path.add(threatId)
                    break
                  }
                  
                  break
                }
              }
            })
            
            break
          }
          currentBarrierId = prevId
          visitedBarriers.add(prevId)
        } else {
          break
        }
      }
    }
  } else if (node.type === 'topEvent') {
    // For top event: include all connected threats and consequences
    // But we'll only show paths when hovering on threats/consequences/barriers
    // So for top event, just return itself
    return [nodeId]
  } else if (node.type === 'hazard') {
    // For hazard: return itself and connected threats
    const threatEdges = edges.filter(e => {
      const otherId = e.source === nodeId ? e.target : e.source
      return nodes.find(n => n.id === otherId)?.type === 'threat'
    })
    threatEdges.forEach(e => {
      const threatId = e.source === nodeId ? e.target : e.source
      path.add(threatId)
    })
  }
  
  return Array.from(path)
}

/**
 * Get downstream path from a failed barrier
 * For prevention barriers: barrier → top event → mitigation barriers → consequences
 * For mitigation barriers: barrier → consequences
 */
export const getDownstreamPathFromBarrier = (barrierId, edges, nodes) => {
  const barrier = nodes.find(n => n.id === barrierId)
  if (!barrier || barrier.type !== 'barrier') return []
  
  const path = new Set([barrierId])
  const barrierType = barrier.data?.barrierType
  
  if (barrierType === 'prevention') {
    // Find top event connected to this barrier chain
    let currentBarrierId = barrierId
    const visitedBarriers = new Set([currentBarrierId])
    
    // Follow forward to find top event
    while (currentBarrierId) {
      const nextEdge = edges.find(e => {
        if (e.source === currentBarrierId) {
          const targetNode = nodes.find(n => n.id === e.target)
          return targetNode && (
            targetNode.type === 'topEvent' ||
            (targetNode.type === 'barrier' && targetNode.data?.barrierType === 'prevention' && !visitedBarriers.has(e.target))
          )
        }
        return false
      })
      
      if (nextEdge) {
        const nextId = nextEdge.target
        path.add(nextId)
        if (nodes.find(n => n.id === nextId)?.type === 'topEvent') {
          // Found top event, now find all consequences
          const topEventId = nextId
          const consequenceEdges = edges.filter(e => {
            const sourceNode = nodes.find(n => n.id === e.source)
            return sourceNode?.type === 'barrier' && 
                   sourceNode?.data?.barrierType === 'mitigation' &&
                   e.target === topEventId
          })
          
          // For each mitigation barrier connected to top event, find its chain to consequence
          consequenceEdges.forEach(edge => {
            const mitigationBarrierId = edge.source
            path.add(mitigationBarrierId)
            
            // Follow mitigation chain to consequence
            let currentMitigationId = mitigationBarrierId
            const visitedMitigation = new Set([currentMitigationId])
            
            while (currentMitigationId) {
              const nextMitigationEdge = edges.find(e => {
                if (e.source === currentMitigationId) {
                  const targetNode = nodes.find(n => n.id === e.target)
                  return targetNode && (
                    targetNode.type === 'consequence' ||
                    (targetNode.type === 'barrier' && targetNode.data?.barrierType === 'mitigation' && !visitedMitigation.has(e.target))
                  )
                }
                return false
              })
              
              if (nextMitigationEdge) {
                const nextMitigationId = nextMitigationEdge.target
                path.add(nextMitigationId)
                if (nodes.find(n => n.id === nextMitigationId)?.type === 'consequence') {
                  break
                }
                currentMitigationId = nextMitigationId
                visitedMitigation.add(nextMitigationId)
              } else {
                break
              }
            }
          })
          break
        }
        currentBarrierId = nextId
        visitedBarriers.add(nextId)
      } else {
        break
      }
    }
  } else if (barrierType === 'mitigation') {
    // For mitigation barriers: find consequences
    let currentBarrierId = barrierId
    const visitedBarriers = new Set([currentBarrierId])
    
    while (currentBarrierId) {
      const nextEdge = edges.find(e => {
        if (e.source === currentBarrierId) {
          const targetNode = nodes.find(n => n.id === e.target)
          return targetNode && (
            targetNode.type === 'consequence' ||
            (targetNode.type === 'barrier' && targetNode.data?.barrierType === 'mitigation' && !visitedBarriers.has(e.target))
          )
        }
        return false
      })
      
      if (nextEdge) {
        const nextId = nextEdge.target
        path.add(nextId)
        if (nodes.find(n => n.id === nextId)?.type === 'consequence') {
          break
        }
        currentBarrierId = nextId
        visitedBarriers.add(nextId)
      } else {
        break
      }
    }
  }
  
  return Array.from(path)
}

/**
 * Calculate risk score for a node based on its type and connections
 */
export const calculateNodeRiskScore = (node, edges, allNodes) => {
  let riskScore = 0
  
  // Base risk by node type
  const baseRisk = {
    hazard: 80,
    topEvent: 90,
    threat: 60,
    barrier: 40,
    consequence: 100,
  }
  
  riskScore = baseRisk[node.type] || 50
  
  // Adjust based on connections
  const connectedCount = getConnectedNodeIds(node.id, edges).length
  riskScore += connectedCount * 5 // More connections = higher risk
  
  // Adjust for barrier status
  if (node.type === 'barrier' && node.data?.status === 'failed') {
    riskScore = 90 // Failed barriers are high risk
  }
  
  // Adjust for consequences (they're always high risk)
  if (node.type === 'consequence') {
    // Check if connected to failed barriers
    const connectedEdges = getConnectedEdges(node.id, edges)
    const hasFailedBarrier = connectedEdges.some((edge) => {
      const sourceNode = allNodes.find((n) => n.id === edge.source)
      return sourceNode?.type === 'barrier' && sourceNode?.data?.status === 'failed'
    })
    if (hasFailedBarrier) {
      riskScore = 100
    }
  }
  
  return Math.min(100, Math.max(0, riskScore))
}

/**
 * Get risk level category (low, medium, high, critical)
 */
export const getRiskLevel = (riskScore) => {
  if (riskScore >= 80) return 'critical'
  if (riskScore >= 60) return 'high'
  if (riskScore >= 40) return 'medium'
  return 'low'
}

/**
 * Get color intensity based on risk score
 */
export const getRiskColor = (riskScore, baseColor) => {
  const intensity = riskScore / 100
  // For light colors, make darker. For dark colors, make lighter
  // This is a simplified version - you might want more sophisticated color manipulation
  return baseColor
}

