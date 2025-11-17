# Bowtie Risk Visualization

A modern, interactive bowtie risk diagram visualization tool built with React Flow and Streamlit.

## Features

### React Flow Application

- **Core Node Types**: Hazard, Threat, Barrier, and Consequence nodes with distinct visual styling
- **Canvas Features**:
  - Zoom and pan controls
  - Grid snapping (20px grid)
  - Mini-map for navigation
  - Background grid
- **ELK.js Integration**: Automated symmetric layout algorithm for professional diagram arrangement
- **Interactive Node Editing**: Side panel for editing node labels, descriptions, and status
- **Edge Connections**: Visual connections between nodes with tooltips
- **Import/Export**: JSON schema-based save/load functionality
- **Accessibility**:
  - High contrast mode support
  - Reduced motion support
  - Keyboard navigation
  - Focus indicators

### Streamlit Presentation App

- File upload/download for bowtie diagrams
- Statistics dashboard showing node counts
- Node type categorization and details
- Connection visualization
- Raw JSON viewer
- Optional React app embedding

## Project Structure

```
dsba-bowtie/
├── frontend/              # React Flow application
│   ├── src/
│   │   ├── App.jsx       # Main application component
│   │   ├── components/
│   │   │   ├── NodeTypes.jsx      # Custom node components
│   │   │   ├── NodeEditor.jsx     # Node editing panel
│   │   │   └── Toolbar.jsx        # Toolbar with actions
│   │   ├── utils/
│   │   │   ├── elkLayout.js       # ELK.js layout integration
│   │   │   └── dataModel.js       # JSON schema and validation
│   │   ├── styles.css    # Global styles
│   │   └── main.jsx      # Entry point
│   ├── package.json
│   └── vite.config.js
├── backend/               # Streamlit presentation app
│   ├── app.py            # Main Streamlit application
│   └── data/
│       └── sample_bowtie.json
├── requirements.txt      # Python dependencies
└── README.md
```

## Getting Started

### Frontend (React Flow)

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Backend (Streamlit)

1. Create a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the Streamlit app:

```bash
cd backend
streamlit run app.py
```

The app will be available at `http://localhost:8501`

## Usage

### Creating a Bowtie Diagram

1. **Add Nodes**: Use the toolbar buttons to add Hazard, Threat, Barrier, or Consequence nodes
2. **Connect Nodes**: Click and drag from a node's handle to another node to create connections
3. **Edit Nodes**: Click on any node to open the editing panel
4. **Auto Layout**: Click "Auto Layout" to automatically arrange nodes using ELK.js
5. **Save**: Click "Save" to download your diagram as JSON
6. **Load**: Click "Load" to import a previously saved diagram

### Node Types

- **Hazard** (⚠️): Potential sources of harm (orange gradient)
- **Threat** (⚡): Events that could lead to the hazard (blue)
- **Barrier** (🛡️): Controls that prevent or mitigate risks (green, can be marked as failed)
- **Consequence** (💥): Outcomes if barriers fail (red gradient)

### Streamlit Presentation

1. Upload a bowtie diagram JSON file from the sidebar
2. View statistics and node details
3. Analyze connections between nodes
4. Optionally embed the React Flow app for interactive viewing
5. Download updated diagrams

## JSON Schema

The bowtie diagram follows this structure:

```json
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "hazard|threat|barrier|consequence",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Node Label",
        "description": "Optional description",
        "status": "normal|failed" // Only for barriers
      }
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id"
    }
  ]
}
```

## Development

### Adding New Node Types

1. Create a new component in `src/components/NodeTypes.jsx`
2. Add it to the `nodeTypes` export object
3. Update the JSON schema in `src/utils/dataModel.js`

### Customizing Layout

Modify the ELK layout options in `src/utils/elkLayout.js`:

```javascript
layoutOptions: {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',  // Change to LEFT, UP, DOWN
  'elk.spacing.nodeNode': '80',  // Adjust spacing
  // ... more options
}
```

## License

MIT © 2024
