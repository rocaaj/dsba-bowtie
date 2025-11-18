import React, { useState } from 'react'
import { Handle, Position } from 'reactflow'

// Standard node dimensions for layout calculations
export const NODE_DIMENSIONS = {
  collapsed: { width: 140, height: 80 },
  expanded: { width: 250, height: 180 },
  topEvent: { width: 120, height: 120 }, // Circular, so same for both
  topEventExpanded: { width: 200, height: 200 },
}

const nodeBaseStyles = {
  padding: '12px 16px',
  borderRadius: '8px',
  border: '2px solid',
  minWidth: '120px',
  textAlign: 'center',
  fontWeight: '500',
  fontSize: '14px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
}

const handleStyle = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  border: '2px solid #fff',
}

// Risk badge component
const RiskBadge = ({ riskScore, riskLevel }) => {
  const badgeColors = {
    critical: '#ef4444',
    high: '#f59e0b',
    medium: '#3b82f6',
    low: '#10b981',
  }
  
  return (
    <div
      style={{
        position: 'absolute',
        top: '-8px',
        right: '-8px',
        background: badgeColors[riskLevel] || '#6b7280',
        color: '#fff',
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: '700',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        border: '2px solid #fff',
      }}
      title={`Risk Score: ${riskScore}`}
    >
      {riskScore}
    </div>
  )
}

// Helper to get color intensity based on risk
const getColorIntensity = (baseColor, riskScore) => {
  const intensity = riskScore / 100
  // For gradients, we'll adjust opacity or use a darker variant
  // This is a simplified approach
  return baseColor
}

export const HazardNode = ({ data, selected }) => {
  const [isHovered, setIsHovered] = useState(false)
  const isHighlighted = data?.isHighlighted || false
  const isDimmed = data?.isDimmed || false
  const isAnimated = data?.isAnimated || false
  const isComparison = data?.isComparison || false
  const riskScore = data?.riskScore || 80
  const riskLevel = data?.riskLevel || 'high'
  const isExpanded = isHovered || selected
  // Match toolbar button color: #f59e0b
  const baseGradient = 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
  const intensityGradient = riskScore >= 80 
    ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
    : riskScore >= 60
    ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
    : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
  
  const borderColor = isComparison 
    ? '#f59e0b' 
    : selected 
    ? '#fff' 
    : isHighlighted || isAnimated
    ? '#fbbf24' 
    : '#d97706'
  
  return (
    <div
      style={{
        ...nodeBaseStyles,
        width: isExpanded ? NODE_DIMENSIONS.expanded.width : NODE_DIMENSIONS.collapsed.width,
        height: isExpanded ? NODE_DIMENSIONS.expanded.height : NODE_DIMENSIONS.collapsed.height,
        background: intensityGradient,
        borderColor: borderColor,
        borderWidth: isComparison ? '3px' : '2px',
        color: '#1f2937',
        transform: selected ? 'scale(1.05)' : (isHighlighted || isAnimated) ? 'scale(1.03)' : 'scale(1)',
        opacity: isDimmed ? 0.2 : 1,
        boxShadow: isComparison
          ? '0 4px 12px rgba(245, 158, 11, 0.6)'
          : isHighlighted || isAnimated
          ? '0 4px 12px rgba(245, 158, 11, 0.4)' 
          : '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: isExpanded ? 1000 : (isHighlighted || isAnimated || isComparison) ? 10 : 1,
        animation: isAnimated ? 'pulse 0.6s ease-in-out' : 'none',
      }}
      title={data.description || data.label}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ ...handleStyle, background: '#f59e0b' }}
      />
      <div style={{ fontWeight: '600', marginBottom: '4px' }}>⚠️</div>
      <div style={{ fontSize: isExpanded ? '16px' : '14px', fontWeight: '600' }}>
        {data.label || 'Hazard'}
      </div>
      {isExpanded && data.description && (
        <div style={{ 
          fontSize: '12px', 
          marginTop: '8px', 
          opacity: 0.9,
          lineHeight: '1.4',
          padding: '0 4px'
        }}>
          {data.description}
        </div>
      )}
      {isExpanded && (
        <div style={{ 
          fontSize: '11px', 
          marginTop: '8px', 
          opacity: 0.8,
          fontWeight: '500'
        }}>
          Risk: {riskLevel.toUpperCase()}
        </div>
      )}
      <RiskBadge riskScore={riskScore} riskLevel={riskLevel} />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ ...handleStyle, background: '#f59e0b' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        style={{ ...handleStyle, background: '#f59e0b' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ ...handleStyle, background: '#f59e0b' }}
      />
    </div>
  )
}

export const ThreatNode = ({ data, selected }) => {
  const [isHovered, setIsHovered] = useState(false)
  const isHighlighted = data?.isHighlighted || false
  const isDimmed = data?.isDimmed || false
  const isAnimated = data?.isAnimated || false
  const isComparison = data?.isComparison || false
  const riskScore = data?.riskScore || 60
  const riskLevel = data?.riskLevel || 'medium'
  const isExpanded = isHovered || selected
  // Match toolbar button color: #3b82f6
  const intensityColor = riskScore >= 80
    ? '#2563eb'
    : riskScore >= 60
    ? '#3b82f6'
    : '#60a5fa'
  
  const borderColor = isComparison 
    ? '#f59e0b' 
    : selected 
    ? '#fff' 
    : isHighlighted || isAnimated
    ? '#60a5fa' 
    : '#2563eb'
  
  return (
    <div
      style={{
        ...nodeBaseStyles,
        width: isExpanded ? NODE_DIMENSIONS.expanded.width : NODE_DIMENSIONS.collapsed.width,
        height: isExpanded ? NODE_DIMENSIONS.expanded.height : NODE_DIMENSIONS.collapsed.height,
        background: intensityColor,
        borderColor: borderColor,
        borderWidth: isComparison ? '3px' : '2px',
        color: '#fff',
        transform: selected ? 'scale(1.05)' : (isHighlighted || isAnimated) ? 'scale(1.03)' : 'scale(1)',
        opacity: isDimmed ? 0.2 : 1,
        boxShadow: isComparison
          ? '0 4px 12px rgba(245, 158, 11, 0.6)'
          : isHighlighted || isAnimated
          ? '0 4px 12px rgba(59, 130, 246, 0.4)' 
          : '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: isExpanded ? 1000 : (isHighlighted || isAnimated || isComparison) ? 10 : 1,
        animation: isAnimated ? 'pulse 0.6s ease-in-out' : 'none',
      }}
      title={data.description || data.label}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ ...handleStyle, background: intensityColor }}
      />
      <div style={{ fontWeight: '600', marginBottom: '4px' }}>⚡</div>
      <div style={{ fontSize: isExpanded ? '16px' : '14px', fontWeight: '600' }}>
        {data.label || 'Threat'}
      </div>
      {isExpanded && data.description && (
        <div style={{ 
          fontSize: '12px', 
          marginTop: '8px', 
          opacity: 0.9,
          lineHeight: '1.4',
          padding: '0 4px'
        }}>
          {data.description}
        </div>
      )}
      {isExpanded && (
        <div style={{ 
          fontSize: '11px', 
          marginTop: '8px', 
          opacity: 0.8,
          fontWeight: '500'
        }}>
          Risk: {riskLevel.toUpperCase()}
        </div>
      )}
      <RiskBadge riskScore={riskScore} riskLevel={riskLevel} />
      <Handle
        type="source"
        position={Position.Right}
        style={{ ...handleStyle, background: intensityColor }}
      />
    </div>
  )
}

export const BarrierNode = ({ data, selected }) => {
  const [isHovered, setIsHovered] = useState(false)
  const isHighlighted = data?.isHighlighted || false
  const isDimmed = data?.isDimmed || false
  const isAnimated = data?.isAnimated || false
  const isComparison = data?.isComparison || false
  const riskScore = data?.riskScore || 40
  const riskLevel = data?.riskLevel || 'low'
  const isFailed = data.status === 'failed'
  const barrierType = data.barrierType || 'prevention' // 'prevention' or 'mitigation'
  const effectiveRiskScore = isFailed ? 90 : riskScore
  const isExpanded = isHovered || selected
  
  // Match toolbar button color: #10b981
  const intensityGradient = isFailed
    ? 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)'
    : effectiveRiskScore >= 60
    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  
  const borderColor = isComparison 
    ? '#f59e0b' 
    : selected 
    ? '#fff' 
    : isHighlighted || isAnimated
    ? (isFailed ? '#fca5a5' : '#34d399') 
    : (isFailed ? '#dc2626' : '#047857')
  
  return (
    <div
      style={{
        ...nodeBaseStyles,
        width: isExpanded ? NODE_DIMENSIONS.expanded.width : NODE_DIMENSIONS.collapsed.width,
        height: isExpanded ? NODE_DIMENSIONS.expanded.height : NODE_DIMENSIONS.collapsed.height,
        background: intensityGradient,
        borderColor: borderColor,
        borderWidth: isComparison ? '3px' : '2px',
        color: '#fff',
        transform: selected ? 'scale(1.05)' : (isHighlighted || isAnimated) ? 'scale(1.03)' : 'scale(1)',
        opacity: isDimmed ? 0.2 : (isFailed ? 0.8 : 1),
        boxShadow: isComparison
          ? '0 4px 12px rgba(245, 158, 11, 0.6)'
          : isHighlighted || isAnimated
          ? `0 4px 12px ${isFailed ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}` 
          : '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: isExpanded ? 1000 : (isHighlighted || isAnimated || isComparison) ? 10 : 1,
        animation: isAnimated ? 'pulse 0.6s ease-in-out' : (isFailed ? 'pulse 2s infinite' : 'none'),
      }}
      title={`${barrierType === 'prevention' ? 'Prevention' : 'Mitigation'} Barrier${data.description ? ': ' + data.description : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
      <div style={{ fontSize: isExpanded ? '13px' : '12px', marginBottom: '2px', opacity: 0.9 }}>
        {barrierType === 'prevention' ? 'Prevention' : 'Mitigation'}
      </div>
      <div style={{ fontSize: isExpanded ? '16px' : '14px', fontWeight: '600' }}>
        {data.label || 'Barrier'}
      </div>
      {isExpanded && data.description && (
        <div style={{ 
          fontSize: '12px', 
          marginTop: '8px', 
          opacity: 0.9,
          lineHeight: '1.4',
          padding: '0 4px'
        }}>
          {data.description}
        </div>
      )}
      {isExpanded && (
        <div style={{ 
          fontSize: '11px', 
          marginTop: '8px', 
          opacity: 0.8,
          fontWeight: '500'
        }}>
          Status: {isFailed ? 'FAILED' : 'NORMAL'} | Risk: {riskLevel.toUpperCase()}
        </div>
      )}
      <RiskBadge riskScore={effectiveRiskScore} riskLevel={isFailed ? 'critical' : riskLevel} />
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

// Top Event - The central "knot" of the bowtie
export const TopEventNode = ({ data, selected }) => {
  const [isHovered, setIsHovered] = useState(false)
  const isHighlighted = data?.isHighlighted || false
  const isDimmed = data?.isDimmed || false
  const isAnimated = data?.isAnimated || false
  const isComparison = data?.isComparison || false
  const riskScore = data?.riskScore || 90
  const riskLevel = data?.riskLevel || 'critical'
  const isExpanded = isHovered || selected
  // Match toolbar button color: #f97316
  const intensityGradient = riskScore >= 90
    ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
    : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
  
  const borderColor = isComparison 
    ? '#f59e0b' 
    : selected 
    ? '#fff' 
    : isHighlighted || isAnimated
    ? '#fbbf24' 
    : '#f97316'
  
  return (
    <div
      style={{
        ...nodeBaseStyles,
        borderRadius: '50%',
        width: isExpanded ? NODE_DIMENSIONS.topEventExpanded.width : NODE_DIMENSIONS.topEvent.width,
        height: isExpanded ? NODE_DIMENSIONS.topEventExpanded.height : NODE_DIMENSIONS.topEvent.height,
        background: intensityGradient,
        borderColor: borderColor,
        borderWidth: isComparison ? '4px' : '3px',
        color: '#fff',
        transform: selected ? 'scale(1.1)' : (isHighlighted || isAnimated) ? 'scale(1.05)' : 'scale(1)',
        opacity: isDimmed ? 0.2 : 1,
        boxShadow: isComparison
          ? '0 6px 16px rgba(245, 158, 11, 0.6)'
          : isHighlighted || isAnimated
          ? '0 6px 16px rgba(220, 38, 38, 0.5)' 
          : '0 4px 8px rgba(0,0,0,0.2)',
        zIndex: isExpanded ? 1000 : (isHighlighted || isAnimated || isComparison) ? 10 : 1,
        animation: isAnimated ? 'pulse 0.6s ease-in-out' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title={data.description || data.label}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ ...handleStyle, background: '#f97316', width: '12px', height: '12px' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ ...handleStyle, background: '#f97316', width: '12px', height: '12px' }}
      />
      <div style={{ fontWeight: '700', marginBottom: '4px', fontSize: isExpanded ? '20px' : '16px' }}>🎯</div>
      <div style={{ fontSize: isExpanded ? '14px' : '12px', fontWeight: '600' }}>{data.label || 'Top Event'}</div>
      {isExpanded && data.description && (
        <div style={{ 
          fontSize: '11px', 
          marginTop: '6px', 
          opacity: 0.9,
          lineHeight: '1.3',
          padding: '0 8px',
          textAlign: 'center'
        }}>
          {data.description}
        </div>
      )}
      <RiskBadge riskScore={riskScore} riskLevel={riskLevel} />
      <Handle
        type="source"
        position={Position.Right}
        style={{ ...handleStyle, background: '#f97316', width: '12px', height: '12px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ ...handleStyle, background: '#f97316', width: '12px', height: '12px' }}
      />
    </div>
  )
}

export const ConsequenceNode = ({ data, selected }) => {
  const [isHovered, setIsHovered] = useState(false)
  const isHighlighted = data?.isHighlighted || false
  const isDimmed = data?.isDimmed || false
  const isAnimated = data?.isAnimated || false
  const isComparison = data?.isComparison || false
  const riskScore = data?.riskScore || 100
  const riskLevel = data?.riskLevel || 'critical'
  const isExpanded = isHovered || selected
  // Match toolbar button color: #ef4444
  const intensityGradient = riskScore >= 90
    ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
  
  const borderColor = isComparison 
    ? '#f59e0b' 
    : selected 
    ? '#fff' 
    : isHighlighted || isAnimated
    ? '#fca5a5' 
    : '#b91c1c'
  
  return (
    <div
      style={{
        ...nodeBaseStyles,
        width: isExpanded ? NODE_DIMENSIONS.expanded.width : NODE_DIMENSIONS.collapsed.width,
        height: isExpanded ? NODE_DIMENSIONS.expanded.height : NODE_DIMENSIONS.collapsed.height,
        background: intensityGradient,
        borderColor: borderColor,
        borderWidth: isComparison ? '3px' : '2px',
        color: '#fff',
        transform: selected ? 'scale(1.05)' : (isHighlighted || isAnimated) ? 'scale(1.03)' : 'scale(1)',
        opacity: isDimmed ? 0.2 : 1,
        boxShadow: isComparison
          ? '0 4px 12px rgba(245, 158, 11, 0.6)'
          : isHighlighted || isAnimated
          ? '0 4px 12px rgba(239, 68, 68, 0.4)' 
          : '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: isExpanded ? 1000 : (isHighlighted || isAnimated || isComparison) ? 10 : 1,
        animation: isAnimated ? 'pulse 0.6s ease-in-out' : 'none',
      }}
      title={data.description || data.label}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ ...handleStyle, background: '#ef4444' }}
      />
      <div style={{ fontWeight: '600', marginBottom: '4px' }}>💥</div>
      <div style={{ fontSize: isExpanded ? '16px' : '14px', fontWeight: '600' }}>
        {data.label || 'Consequence'}
      </div>
      {isExpanded && data.description && (
        <div style={{ 
          fontSize: '12px', 
          marginTop: '8px', 
          opacity: 0.9,
          lineHeight: '1.4',
          padding: '0 4px'
        }}>
          {data.description}
        </div>
      )}
      {isExpanded && (
        <div style={{ 
          fontSize: '11px', 
          marginTop: '8px', 
          opacity: 0.8,
          fontWeight: '500'
        }}>
          Risk: {riskLevel.toUpperCase()}
        </div>
      )}
      <RiskBadge riskScore={riskScore} riskLevel={riskLevel} />
      <Handle
        type="source"
        position={Position.Right}
        style={{ ...handleStyle, background: '#ef4444' }}
      />
    </div>
  )
}

export const DegradationFactorNode = ({ data, selected }) => {
  const [isHovered, setIsHovered] = useState(false)
  const isHighlighted = data?.isHighlighted || false
  const isDimmed = data?.isDimmed || false
  const isAnimated = data?.isAnimated || false
  const isExpanded = isHovered || selected
  
  return (
    <div
      style={{
        ...nodeBaseStyles,
        width: isExpanded ? NODE_DIMENSIONS.expanded.width : NODE_DIMENSIONS.collapsed.width,
        height: isExpanded ? NODE_DIMENSIONS.expanded.height : NODE_DIMENSIONS.collapsed.height,
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        borderColor: selected ? '#fff' : (isHighlighted || isAnimated ? '#f59e0b' : '#f59e0b'),
        borderWidth: isHighlighted || isAnimated ? '3px' : '2px',
        color: '#78350f',
        transform: selected ? 'scale(1.05)' : (isHighlighted || isAnimated) ? 'scale(1.03)' : 'scale(1)',
        opacity: isDimmed ? 0.2 : 1,
        zIndex: isExpanded ? 1000 : (isHighlighted || isAnimated) ? 10 : 1,
      }}
      title={data.description || data.label}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ ...handleStyle, background: '#f59e0b' }}
      />
      <div style={{ fontWeight: '600', marginBottom: '4px' }}>⚠️</div>
      <div style={{ fontSize: isExpanded ? '16px' : '14px', fontWeight: '600' }}>
        {data.label || 'Degradation Factor'}
      </div>
      {isExpanded && data.description && (
        <div style={{ 
          fontSize: '12px', 
          marginTop: '8px', 
          opacity: 0.9,
          lineHeight: '1.4',
          padding: '0 4px'
        }}>
          {data.description}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        style={{ ...handleStyle, background: '#f59e0b' }}
      />
    </div>
  )
}

export const DegradationControlNode = ({ data, selected }) => {
  const [isHovered, setIsHovered] = useState(false)
  const isHighlighted = data?.isHighlighted || false
  const isDimmed = data?.isDimmed || false
  const isAnimated = data?.isAnimated || false
  const isExpanded = isHovered || selected
  
  return (
    <div
      style={{
        ...nodeBaseStyles,
        width: isExpanded ? NODE_DIMENSIONS.expanded.width : NODE_DIMENSIONS.collapsed.width,
        height: isExpanded ? NODE_DIMENSIONS.expanded.height : NODE_DIMENSIONS.collapsed.height,
        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        borderColor: selected ? '#fff' : (isHighlighted || isAnimated ? '#10b981' : '#10b981'),
        borderWidth: isHighlighted || isAnimated ? '3px' : '2px',
        color: '#065f46',
        transform: selected ? 'scale(1.05)' : (isHighlighted || isAnimated) ? 'scale(1.03)' : 'scale(1)',
        opacity: isDimmed ? 0.2 : 1,
        zIndex: isExpanded ? 1000 : (isHighlighted || isAnimated) ? 10 : 1,
      }}
      title={data.description || data.label}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ ...handleStyle, background: '#10b981' }}
      />
      <div style={{ fontWeight: '600', marginBottom: '4px' }}>🛡️</div>
      <div style={{ fontSize: isExpanded ? '16px' : '14px', fontWeight: '600' }}>
        {data.label || 'Degradation Control'}
      </div>
      {isExpanded && data.description && (
        <div style={{ 
          fontSize: '12px', 
          marginTop: '8px', 
          opacity: 0.9,
          lineHeight: '1.4',
          padding: '0 4px'
        }}>
          {data.description}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        style={{ ...handleStyle, background: '#10b981' }}
      />
    </div>
  )
}

export const nodeTypes = {
  hazard: HazardNode,
  topEvent: TopEventNode,
  threat: ThreatNode,
  barrier: BarrierNode,
  consequence: ConsequenceNode,
  degradationFactor: DegradationFactorNode,
  degradationControl: DegradationControlNode,
}
