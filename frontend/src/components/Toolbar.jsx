import React, { useRef } from 'react'

const Toolbar = ({ onAutoLayout, onSave, onLoad, onAddNode, isLayouting }) => {
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      onLoad(file)
    }
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        border: '1px solid #e5e7eb',
      }}
    >
      <button
        onClick={() => onAddNode('hazard')}
        style={{
          padding: '8px 16px',
          background: '#f59e0b',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
        }}
        title="Add Hazard"
      >
        + Hazard
      </button>
      <button
        onClick={() => onAddNode('threat')}
        style={{
          padding: '8px 16px',
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
        }}
        title="Add Threat"
      >
        + Threat
      </button>
      <button
        onClick={() => onAddNode('barrier')}
        style={{
          padding: '8px 16px',
          background: '#10b981',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
        }}
        title="Add Barrier"
      >
        + Barrier
      </button>
      <button
        onClick={() => onAddNode('consequence')}
        style={{
          padding: '8px 16px',
          background: '#ef4444',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
        }}
        title="Add Consequence"
      >
        + Consequence
      </button>
      <div style={{ width: '1px', background: '#e5e7eb', margin: '0 4px' }} />
      <button
        onClick={onAutoLayout}
        disabled={isLayouting}
        style={{
          padding: '8px 16px',
          background: isLayouting ? '#9ca3af' : '#6366f1',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '500',
          cursor: isLayouting ? 'not-allowed' : 'pointer',
        }}
        title="Auto Layout (ELK)"
      >
        {isLayouting ? 'Layouting...' : 'Auto Layout'}
      </button>
      <button
        onClick={onSave}
        style={{
          padding: '8px 16px',
          background: '#059669',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
        }}
        title="Save Diagram"
      >
        💾 Save
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: '8px 16px',
          background: '#7c3aed',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
        }}
        title="Load Diagram"
      >
        📂 Load
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default Toolbar

