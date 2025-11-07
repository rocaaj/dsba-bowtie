import React from 'react';
import cc from 'classcat';

const NodeWrapper = ({ data, type }) => {
  const { label, description, status = 'normal', icon } = data;

  return (
    <div
      className={cc([
        'bowtie-node',
        `bowtie-node-${type}`,
        status !== 'normal' && `bowtie-node-${status}`
      ])}
      title={description || label}
    >
      {icon ? <span className="bowtie-node-icon">{icon}</span> : null}
      <span className="bowtie-node-label">{label}</span>
    </div>
  );
};

export const nodeTypes = {
  hazard: (props) => <NodeWrapper {...props} type="hazard" />,
  topEvent: (props) => <NodeWrapper {...props} type="topEvent" />,
  threat: (props) => <NodeWrapper {...props} type="threat" />,
  consequence: (props) => <NodeWrapper {...props} type="consequence" />,
  barrier: (props) => <NodeWrapper {...props} type="barrier" />,
  barrierGroup: (props) => <NodeWrapper {...props} type="barrierGroup" />
};

export const defaultNodeStyles = {
  hazard: {
    background: 'linear-gradient(135deg,#f59e0b,#f97316)',
    color: '#1f2937'
  },
  topEvent: {
    background: 'linear-gradient(135deg,#f97316,#dc2626)',
    color: '#fff'
  },
  threat: {
    background: '#1d4ed8',
    color: '#fff'
  },
  barrier: {
    background: '#10b981',
    color: '#0f172a'
  },
  barrierFailed: {
    background: '#f87171',
    color: '#fff'
  },
  consequence: {
    background: '#ef4444',
    color: '#fff'
  },
  barrierGroup: {
    background: '#0f172a',
    color: '#e2e8f0'
  }
};


