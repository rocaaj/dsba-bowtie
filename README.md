# Bowtie Risk Visualization MVP

Interactive Bowtie risk diagram workspace that combines a ReactFlow authoring surface with a Streamlit review experience.

## Features

- Auto-laid out Bowtie diagrams with ReactFlow + ELK (`elk.layered.direction=RIGHT`)
- Custom node styling for hazards, threats, barriers, and consequences
- Scenario exploration:
  - Expand/collapse prevention & mitigation barrier groups
  - Toggle barrier failures and highlight affected paths
  - Side panel shows rich descriptions and risk storytelling narrative
- Save/Load diagrams as JSON with layout metadata preserved per node
- Export visuals as PNG, SVG, or PDF
- Streamlit viewer for narrative review, file management, and optional embedded React app

## Project Structure

```
bowtie-risk-visualization/
├── frontend/          # React + ReactFlow authoring UI (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── BowtieDiagram.jsx
│   │   │   ├── NodeTypes.js
│   │   │   └── SidePanel.jsx
│   │   ├── data/sampleBowtie.json
│   │   └── utils/elkLayout.js
│   └── package.json
├── backend/           # Streamlit read-only viewer
│   ├── app.py
│   ├── data/sample_bowtie.json
│   └── utils/load_json.py
├── requirements.txt   # Python dependencies (Streamlit)
└── README.md
```

## Getting Started

### 1. Frontend (React authoring experience)

```bash
cd frontend
npm install
npm run dev
```

Open the Vite dev server URL (default `http://localhost:5173`). The interface allows you to:

- Toggle prevention/mitigation barrier groups
- Mark barriers as failed to see downstream impact
- Inspect node details in the side panel
- Export diagrams (`PNG`, `SVG`, `PDF`)
- Save/Load JSON diagrams

### 2. Backend (Streamlit narrative viewer)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r ../requirements.txt
streamlit run app.py
```

The Streamlit app provides:

- Scenario controls with barrier toggles
- Storytelling summary that updates when barriers fail
- File uploader/downloader for Bowtie JSON files
- Optional embedded iframe for the running React app (paste the Vite dev URL)
- Raw JSON inspection for auditing

## Sample Data

Both the frontend and backend ship with a canonical sample: “Driving a vehicle on a highway”. Use it as a template for new diagrams or load your own JSON files.

## Exporting Reports

- Use the React frontend to export images (`PNG`, `SVG`) or a management-ready `PDF`.
- Streamlit hosts the same JSON data for narrative review; use the download button to capture updated scenarios.

## Next Steps & Ideas

- Persist diagrams to cloud storage or GitHub (`/bowtie_diagrams/*.json`)
- Extend node types with degradation factors or escalation barriers
- Add authentication and collaborative editing
- Integrate analytics metrics (e.g., barrier coverage scores)

## License

MIT © 2024
