import React, { useMemo, useRef } from 'react';

import sampleDiagram from '../data/sampleBowtie.json';
import { defaultNodeStyles } from './NodeTypes.jsx';

const formatList = (items) => items.map((item) => item.name).join(', ');

const SidePanel = ({
  diagramData,
  expandedGroups,
  onToggleGroup,
  failedBarriers,
  onToggleBarrierFailure,
  onResetScenario,
  onSaveDiagram,
  onLoadDiagram,
  onExportDiagram,
  selectedNode
}) => {
  const fileInputRef = useRef(null);
  const failedSet = useMemo(() => new Set(failedBarriers), [failedBarriers]);

  const story = useMemo(() => buildNarrative(diagramData, failedSet), [diagramData, failedSet]);

  const handleLoadClick = () => fileInputRef.current?.click();

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        onLoadDiagram(parsed);
      } catch (error) {
        console.error('Invalid JSON uploaded', error);
        alert('The uploaded file is not valid Bowtie JSON.');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const preventionBarriers = diagramData?.prevention_barriers ?? [];
  const mitigationBarriers = diagramData?.mitigation_barriers ?? [];

  return (
    <aside className="side-panel">
      <section>
        <h2>Bowtie Overview</h2>
        <p className="text-subtle">
          Hazard: <strong>{diagramData?.hazard}</strong>
        </p>
        <p className="text-subtle">
          Top Event: <strong>{diagramData?.top_event}</strong>
        </p>
        <div className="scenario-controls">
          <button type="button" onClick={onResetScenario}>
            Reset Scenario
          </button>
          <button
            type="button"
            onClick={() => onLoadDiagram(sampleDiagram)}
            title="Reload the sample highway driving scenario"
          >
            Load Sample
          </button>
        </div>
      </section>

      <section>
        <h3>Diagram Layers</h3>
        <div className="toggle-group">
          <label htmlFor="toggle-prevention">
            <input
              id="toggle-prevention"
              name="toggle-prevention"
              type="checkbox"
              checked={expandedGroups.prevention}
              onChange={() => onToggleGroup('prevention')}
            />
            Show Prevention Barriers
          </label>
          <label htmlFor="toggle-mitigation">
            <input
              id="toggle-mitigation"
              name="toggle-mitigation"
              type="checkbox"
              checked={expandedGroups.mitigation}
              onChange={() => onToggleGroup('mitigation')}
            />
            Show Mitigation Barriers
          </label>
        </div>
      </section>

      <section>
        <h3>Barrier Scenario Toggles</h3>
        <p className="helper-text">
          Toggle barriers to explore how failures change the risk story. Downstream nodes highlight in
          orange when barriers fail.
        </p>

        <div className="barrier-list">
          <div className="barrier-column">
            <h4>Prevention</h4>
            {preventionBarriers.map((barrier) => (
              <label
                key={barrier.id}
                htmlFor={`prevention-barrier-${barrier.id}`}
                className={failedSet.has(barrier.id) ? 'barrier-toggle failed' : 'barrier-toggle'}
              >
                <input
                  id={`prevention-barrier-${barrier.id}`}
                  name={`prevention-barrier-${barrier.id}`}
                  type="checkbox"
                  checked={!failedSet.has(barrier.id)}
                  onChange={() => onToggleBarrierFailure(barrier.id)}
                />
                <span>{barrier.name}</span>
              </label>
            ))}
          </div>
          <div className="barrier-column">
            <h4>Mitigation</h4>
            {mitigationBarriers.map((barrier) => (
              <label
                key={barrier.id}
                htmlFor={`mitigation-barrier-${barrier.id}`}
                className={failedSet.has(barrier.id) ? 'barrier-toggle failed' : 'barrier-toggle'}
              >
                <input
                  id={`mitigation-barrier-${barrier.id}`}
                  name={`mitigation-barrier-${barrier.id}`}
                  type="checkbox"
                  checked={!failedSet.has(barrier.id)}
                  onChange={() => onToggleBarrierFailure(barrier.id)}
                />
                <span>{barrier.name}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h3>Selected Element</h3>
        {selectedNode ? (
          <div className="selected-node">
            <p className="selected-node-title">{selectedNode.data.label}</p>
            {selectedNode.data.description ? <p>{selectedNode.data.description}</p> : null}
            <p className="selected-node-meta">
              Type: <strong>{friendlyNodeType(selectedNode.type)}</strong>
            </p>
          </div>
        ) : (
          <p className="helper-text">Click a node to see its context and description here.</p>
        )}
      </section>

      <section>
        <h3>Story Narrative</h3>
        <div className="story-panel">
          {story.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      <section>
        <h3>Legend</h3>
        <div className="legend">
          {Object.entries(legendItems).map(([key, label]) => (
            <div key={key} className="legend-item">
              <span className="legend-color" style={{ background: defaultNodeStyles[key]?.background ?? '#94a3b8' }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3>Data & Export</h3>
        <div className="toolbar">
          <button type="button" onClick={onSaveDiagram}>
            Save JSON
          </button>
          <button type="button" onClick={handleLoadClick}>
            Load JSON
          </button>
        </div>
        <div className="toolbar">
          <button type="button" onClick={() => onExportDiagram?.('png')}>
            Export PNG
          </button>
          <button type="button" onClick={() => onExportDiagram?.('svg')}>
            Export SVG
          </button>
          <button type="button" onClick={() => onExportDiagram?.('pdf')}>
            Export PDF
          </button>
        </div>
        <input
          id="load-json-input"
          name="load-json-input"
          ref={fileInputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={handleFileChange}
          aria-label="Load Bowtie diagram JSON file"
        />
      </section>
    </aside>
  );
};

export default SidePanel;

const legendItems = {
  hazard: 'Hazard',
  topEvent: 'Top Event',
  threat: 'Threat',
  barrier: 'Barrier',
  consequence: 'Consequence',
  barrierGroup: 'Barrier Group'
};

function friendlyNodeType(type) {
  switch (type) {
    case 'hazard':
      return 'Hazard';
    case 'topEvent':
      return 'Top Event';
    case 'threat':
      return 'Threat';
    case 'barrier':
      return 'Barrier';
    case 'barrierGroup':
      return 'Barrier Group';
    case 'consequence':
      return 'Consequence';
    default:
      return 'Node';
  }
}

function buildNarrative(data, failedSet) {
  if (!data) return [];

  const lines = [
    `We are managing the hazard "${data.hazard}" with the intent to avoid the top event "${data.top_event}".`
  ];

  if ((data.threats ?? []).length) {
    lines.push(`Primary threats include ${formatList(data.threats)}.`);
  }

  if ((data.prevention_barriers ?? []).length) {
    const effective = data.prevention_barriers.filter((barrier) => !failedSet.has(barrier.id));
    const failed = data.prevention_barriers.filter((barrier) => failedSet.has(barrier.id));

    if (effective.length) {
      lines.push(`Prevention barriers in place: ${formatList(effective)}.`);
    }
    if (failed.length) {
      lines.push(`⚠️ Failed prevention barriers: ${formatList(failed)}.`);
    }
  }

  if ((data.mitigation_barriers ?? []).length) {
    const effective = data.mitigation_barriers.filter((barrier) => !failedSet.has(barrier.id));
    const failed = data.mitigation_barriers.filter((barrier) => failedSet.has(barrier.id));

    if (effective.length) {
      lines.push(`Mitigation barriers ready to respond: ${formatList(effective)}.`);
    }
    if (failed.length) {
      lines.push(`⚠️ Failed mitigation barriers: ${formatList(failed)}.`);
    }
  }

  if ((data.consequences ?? []).length) {
    lines.push(`If the top event occurs, consequences may include ${formatList(data.consequences)}.`);
  }

  return lines;
}

