import React from 'react'
import { BaseEdge, getBezierPath } from 'reactflow'

// Custom edge with animated particle flow
export default function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  animated = false,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 3 : style.strokeWidth || 2,
          stroke: selected ? '#6366f1' : style.stroke || '#6366f1',
        }}
      />
      {animated && (
        <g>
          <circle r="3" fill="#6366f1" opacity="0.8">
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={edgePath}
            />
          </circle>
          <circle r="2" fill="#818cf8" opacity="0.6">
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              begin="0.5s"
              path={edgePath}
            />
          </circle>
        </g>
      )}
    </>
  )
}

