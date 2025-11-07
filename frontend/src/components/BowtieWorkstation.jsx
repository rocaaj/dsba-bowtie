import React from 'react';

import BowtieDiagram from './BowtieDiagram.jsx';
import SidePanel from './SidePanel.jsx';

const BowtieWorkstation = ({
  diagramData,
  expandedGroups,
  failedBarriers,
  onToggleGroup,
  onToggleBarrierFailure,
  onResetScenario,
  onSaveDiagram,
  onLoadDiagram,
  onExportDiagram,
  onSelectNode,
  selectedNode,
  registerExporter
}) => {
  return (
    <div className="app-container">
      <SidePanel
        diagramData={diagramData}
        expandedGroups={expandedGroups}
        onToggleGroup={onToggleGroup}
        failedBarriers={failedBarriers}
        onToggleBarrierFailure={onToggleBarrierFailure}
        onResetScenario={onResetScenario}
        onSaveDiagram={onSaveDiagram}
        onLoadDiagram={onLoadDiagram}
        onExportDiagram={onExportDiagram}
        selectedNode={selectedNode}
      />

      <BowtieDiagram
        data={diagramData}
        expandedGroups={expandedGroups}
        failedBarriers={failedBarriers}
        onSelectNode={onSelectNode}
        selectedNodeId={selectedNode?.id}
        registerExporter={registerExporter}
      />
    </div>
  );
};

export default BowtieWorkstation;


