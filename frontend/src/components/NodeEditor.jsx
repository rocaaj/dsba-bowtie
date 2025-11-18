import React, { useState, useEffect } from 'react'

const NodeEditor = ({ node, onUpdate, onDelete, onClose }) => {
  const [label, setLabel] = useState(node.data.label || '')
  const [description, setDescription] = useState(node.data.description || '')
  const [status, setStatus] = useState(node.data.status || 'normal')

  useEffect(() => {
    setLabel(node.data.label || '')
    setDescription(node.data.description || '')
    setStatus(node.data.status || 'normal')
  }, [node])

  const handleSave = () => {
    onUpdate({
      ...node,
      data: {
        ...node.data,
        label,
        description,
        status,
      },
    })
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this node?')) {
      onDelete()
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '320px',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
        padding: '20px',
        zIndex: 1000,
        border: '1px solid #e5e7eb',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
          Edit {node.type}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#6b7280',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label
          htmlFor={`node-label-${node.id}`}
          style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
          }}
        >
          Label
        </label>
        <input
          id={`node-label-${node.id}`}
          name={`node-label-${node.id}`}
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          autoComplete="off"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label
          htmlFor={`node-description-${node.id}`}
          style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
          }}
        >
          Description
        </label>
        <textarea
          id={`node-description-${node.id}`}
          name={`node-description-${node.id}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          autoComplete="off"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {node.type === 'barrier' && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor={`node-barrier-type-${node.id}`}
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
              }}
            >
              Barrier Type
            </label>
            <select
              id={`node-barrier-type-${node.id}`}
              name={`node-barrier-type-${node.id}`}
              value={node.data?.barrierType || 'prevention'}
              onChange={(e) => {
                onUpdate({
                  ...node,
                  data: {
                    ...node.data,
                    barrierType: e.target.value,
                  },
                })
              }}
              autoComplete="off"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="prevention">🛡️ Prevention (Left side)</option>
              <option value="mitigation">🛡️ Mitigation (Right side)</option>
            </select>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor={`node-status-${node.id}`}
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
              }}
            >
              Status
            </label>
            <select
              id={`node-status-${node.id}`}
              name={`node-status-${node.id}`}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              autoComplete="off"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="normal">Normal</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            padding: '10px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Save
        </button>
        <button
          onClick={handleDelete}
          style={{
            padding: '10px 16px',
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default NodeEditor

