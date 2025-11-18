// Utility functions for path animation and traversal

/**
 * Get ordered path from start to end node
 * Returns array of node IDs in order
 */
export const getOrderedPath = (startNodeId, endNodeId, edges, nodes) => {
  // Build adjacency list
  const graph = {}
  edges.forEach((edge) => {
    if (!graph[edge.source]) graph[edge.source] = []
    if (!graph[edge.target]) graph[edge.target] = []
    graph[edge.source].push(edge.target)
    graph[edge.target].push(edge.source)
  })

  // BFS to find path
  const queue = [[startNodeId]]
  const visited = new Set([startNodeId])

  while (queue.length > 0) {
    const path = queue.shift()
    const current = path[path.length - 1]

    if (current === endNodeId) {
      return path
    }

    const neighbors = graph[current] || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push([...path, neighbor])
      }
    }
  }

  return null // No path found
}

/**
 * Get all paths from a starting node
 * Returns array of paths (each path is array of node IDs)
 */
export const getAllPathsFromNode = (startNodeId, edges, nodes, maxDepth = 10) => {
  const paths = []
  const graph = {}
  
  edges.forEach((edge) => {
    if (!graph[edge.source]) graph[edge.source] = []
    graph[edge.source].push(edge.target)
  })

  const dfs = (current, path, depth) => {
    if (depth > maxDepth) return
    
    paths.push([...path])
    
    const neighbors = graph[current] || []
    for (const neighbor of neighbors) {
      if (!path.includes(neighbor)) {
        dfs(neighbor, [...path, neighbor], depth + 1)
      }
    }
  }

  dfs(startNodeId, [startNodeId], 0)
  return paths
}

/**
 * Get the main path (longest or most critical) from a node
 */
export const getMainPath = (nodeId, edges, nodes) => {
  const allPaths = getAllPathsFromNode(nodeId, edges, nodes)
  
  if (allPaths.length === 0) return [nodeId]
  
  // Find the longest path that ends at a consequence
  const pathsToConsequences = allPaths.filter((path) => {
    const lastNode = nodes.find((n) => n.id === path[path.length - 1])
    return lastNode?.type === 'consequence'
  })
  
  if (pathsToConsequences.length > 0) {
    // Return longest path to consequence
    return pathsToConsequences.reduce((longest, path) => 
      path.length > longest.length ? path : longest
    )
  }
  
  // Otherwise return longest path
  return allPaths.reduce((longest, path) => 
    path.length > longest.length ? path : longest
  )
}

/**
 * Animate through a path
 * Calls callback for each node in sequence
 */
export const animatePath = async (path, nodes, onNodeHighlight, delay = 500) => {
  for (let i = 0; i < path.length; i++) {
    const nodeId = path[i]
    const node = nodes.find((n) => n.id === nodeId)
    
    if (node) {
      onNodeHighlight(nodeId, i === path.length - 1) // Last node
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

