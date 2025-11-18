// JSON Schema for Bowtie Diagram
export const bowtieSchema = {
  type: 'object',
  required: ['nodes', 'edges'],
  properties: {
    nodes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'type', 'position', 'data'],
        properties: {
          id: { type: 'string' },
          type: {
            type: 'string',
            enum: ['hazard', 'topEvent', 'threat', 'barrier', 'consequence', 'degradationFactor', 'degradationControl'],
          },
          position: {
            type: 'object',
            required: ['x', 'y'],
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            },
          },
          data: {
            type: 'object',
            required: ['label'],
            properties: {
              label: { type: 'string' },
              description: { type: 'string' },
              status: { type: 'string', enum: ['normal', 'failed'] },
              barrierType: { type: 'string', enum: ['prevention', 'mitigation'] },
            },
          },
        },
      },
    },
    edges: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'source', 'target'],
        properties: {
          id: { type: 'string' },
          source: { type: 'string' },
          target: { type: 'string' },
          label: { type: 'string' },
        },
      },
    },
  },
}

// Validate bowtie diagram structure
export const validateBowtieSchema = (data) => {
  if (!data || typeof data !== 'object') return false
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) return false

  // Basic validation - check required fields
  for (const node of data.nodes) {
    if (!node.id || !node.type || !node.position || !node.data) return false
    if (!['hazard', 'topEvent', 'threat', 'barrier', 'consequence', 'degradationFactor', 'degradationControl'].includes(node.type))
      return false
    if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number')
      return false
    if (!node.data.label) return false
  }

  for (const edge of data.edges) {
    if (!edge.id || !edge.source || !edge.target) return false
    // Validate that source and target nodes exist
    const sourceExists = data.nodes.some((n) => n.id === edge.source)
    const targetExists = data.nodes.some((n) => n.id === edge.target)
    if (!sourceExists || !targetExists) return false
  }

  return true
}

// Save diagram to JSON file
export const saveToJSON = (data) => {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `bowtie-diagram-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Load diagram from JSON file
export const loadFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result)
        if (validateBowtieSchema(data)) {
          resolve(data)
        } else {
          reject(new Error('Invalid bowtie diagram schema'))
        }
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

