import React, { useMemo } from 'react';

import BowtieDiagram from './BowtieDiagram.jsx';

const LiveDiagramPage = ({
  diagramData,
  expandedGroups,
  failedBarriers,
  onSelectNode,
  registerExporter
}) => {
  const data = useMemo(() => diagramData, [diagramData]);

  return (
    <main className="diagram-page">
      <section className="diagram-page-header">
        <h1>Live Diagram</h1>
        <p>Full-screen view of the Bowtie diagram for presentation and navigation.</p>
      </section>
      <section className="diagram-page-body">
        <BowtieDiagram
          data={data}
          expandedGroups={expandedGroups}
          failedBarriers={failedBarriers}
          onSelectNode={onSelectNode}
          selectedNodeId={null}
          registerExporter={registerExporter}
        />
      </section>
    </main>
  );
};

export default LiveDiagramPage;


