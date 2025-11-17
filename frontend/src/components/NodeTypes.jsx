import React from 'react'
import { Handle, Position } from 'reactflow'

const nodeBaseStyles = {
  padding: '12px 16px',
  borderRadius: '8px',
  border: '2px solid',
  minWidth: '120px',
  textAlign: 'center',
  fontWeight: '500',
  fontSize: '14px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  transition: 'all 0.2s',
}

const handleStyle = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  border: '2px solid #fff',
}

export const HazardNode = ({ data, selected }) => {
  return (
    <div
      style={{
        ...nodeBaseStyles,
        background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
        borderColor: selected ? '#fff' : '#d97706',
        color: '#1f2937',
        transform: selected ? 'scale(1.05)' : 'scale(1)',
      }}
      title={data.description || data.label}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ ...handleStyle, background: '#f59e0b' }}
      />
      <div style={{ fontWeight: '600', marginBottom: '4px' }}>⚠️</div>
      <div>{data.label || 'Hazard'}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ ...handleStyle, background: '#f59e0b' }}
      />
    </div>
  )
}

export const ThreatNode = ({ data, selected }) => {
  return (
    <div
      style={{
        ...nodeBaseStyles,
        background: '#3b82f6',
        borderColor: selected ? '#fff' : '#2563eb',
        color: '#fff',
        transform: selected ? 'scale(1.05)' : 'scale(1)',
      }}
      title={data.description || data.label}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ ...handleStyle, background: '#3b82f6' }}
      />
      <div style={{ fontWeight: '600', marginBottom: '4px' }}>⚡</div>
      <div>{data.label || 'Threat'}</div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ ...handleStyle, background: '#3b82f6' }}
      />
    </div>
  )
}

export const BarrierNode = ({ data, selected }) => {
  const isFailed = data.status === 'failed'
  return (
    <div
      style={{
        ...nodeBaseStyles,
        background: isFailed
          ? 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)'
          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        borderColor: selected ? '#fff' : isFailed ? '#dc2626' : '#047857',
        color: '#fff',
        transform: selected ? 'scale(1.05)' : 'scale(1)',
        opacity: isFailed ? 0.7 : 1,
      }}
      title={data.description || data.label}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          ...handleStyle,
          background: isFailed ? '#f87171' : '#10b981',
        }}
      />
      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
        {isFailed ? '❌' : '🛡️'}
      </div>
      <div>{data.label || 'Barrier'}</div>
      <Handle
        type="source"
        position={Position.Right}
        style={{
          ...handleStyle,
          background: isFailed ? '#f87171' : '#10b981',
        }}
      />
    </div>
  )
}

export const ConsequenceNode = ({ data, selected }) => {
  return (
    <div
      style={{
        ...nodeBaseStyles,
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        borderColor: selected ? '#fff' : '#b91c1c',
        color: '#fff',
        transform: selected ? 'scale(1.05)' : 'scale(1)',
      }}
      title={data.description || data.label}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ ...handleStyle, background: '#ef4444' }}
      />
      <div style={{ fontWeight: '600', marginBottom: '4px' }}>💥</div>
      <div>{data.label || 'Consequence'}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ ...handleStyle, background: '#ef4444' }}
      />
    </div>
  )
}

export const nodeTypes = {
  hazard: HazardNode,
  threat: ThreatNode,
  barrier: BarrierNode,
  consequence: ConsequenceNode,
}
