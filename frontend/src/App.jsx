import React, { useCallback, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import BowtieWorkstation from './components/BowtieWorkstation.jsx';
import LiveDiagramPage from './components/LiveDiagramPage.jsx';
import sampleDiagram from './data/sampleBowtie.json';

const App = () => {
  const [diagramData, setDiagramData] = useState(sampleDiagram);
  const [expandedGroups, setExpandedGroups] = useState({
    prevention: true,
    mitigation: true
  });
  const [failedBarriers, setFailedBarriers] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [exporter, setExporter] = useState(null);

  const failedSet = useMemo(() => new Set(failedBarriers), [failedBarriers]);

  const handleToggleGroup = useCallback((key) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
    setSelectedNode(null);
  }, []);

  const handleToggleBarrierFailure = useCallback((barrierId) => {
    setFailedBarriers((prev) =>
      prev.includes(barrierId) ? prev.filter((id) => id !== barrierId) : [...prev, barrierId]
    );
  }, []);

  const handleResetScenario = useCallback(() => {
    setFailedBarriers([]);
    setSelectedNode(null);
  }, []);

  const handleSaveDiagram = useCallback(() => {
    const blob = new Blob([JSON.stringify(diagramData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'bowtie-diagram.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [diagramData]);

  const handleLoadDiagram = useCallback((jsonData) => {
    setDiagramData(jsonData);
    setFailedBarriers([]);
    setExpandedGroups({
      prevention: true,
      mitigation: true
    });
    setSelectedNode(null);
  }, []);

  const handleSelectNode = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const handleExportDiagram = useCallback(
    (format) => {
      if (!exporter) return;

      if (format === 'png') {
        exporter.png?.();
      } else if (format === 'svg') {
        exporter.svg?.();
      } else if (format === 'pdf') {
        exporter.pdf?.();
      }
    },
    [exporter]
  );

  const registerExporter = useCallback(
    (handlers) => {
      setExporter(handlers);
    },
    [setExporter]
  );

  const sharedProps = {
    diagramData,
    expandedGroups,
    failedBarriers,
    failedSet,
    onToggleGroup: handleToggleGroup,
    onToggleBarrierFailure: handleToggleBarrierFailure,
    onResetScenario: handleResetScenario,
    onSaveDiagram: handleSaveDiagram,
    onLoadDiagram: handleLoadDiagram,
    onSelectNode: handleSelectNode,
    selectedNode,
    registerExporter,
    onExportDiagram: handleExportDiagram
  };

  return (
    <BrowserRouter>
      <nav className="top-nav">
        <Link to="/" className="nav-brand">
          Bowtie Risk Studio
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">
            Workstation
          </Link>
          <Link to="/diagram" className="nav-link">
            Live Diagram
          </Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<BowtieWorkstation {...sharedProps} />} />
        <Route path="/diagram" element={<LiveDiagramPage {...sharedProps} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

