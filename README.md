# Bowtie Risk Visualization

A modern, interactive bowtie risk diagram visualization tool built with React Flow and Streamlit.

## Features

### React Flow Application

- **Core Node Types**:
  - **Hazard** (⚠️): Potential sources of harm
  - **Top Event** (🎯): The point at which control over the hazard is lost
  - **Threat** (⚡): Events that could lead to the top event
  - **Barrier** (🛡️): Prevention or mitigation controls (can be marked as failed)
  - **Consequence** (💥): Outcomes if barriers fail
  - **Degradation Factor** (⚠️): Factors that can degrade barrier effectiveness
  - **Degradation Control** (🛡️): Controls that prevent degradation factors
- **Sequential Barrier Chains**: Barriers form sequential chains showing layers of security
  - **Prevention**: Threat → Barrier1 → Barrier2 → ... → Top Event
  - **Mitigation**: Top Event → Barrier1 → Barrier2 → ... → Consequence
- **Progressive Disclosure**:
  - By default, only Hazard, Top Event, Threats, and Consequences are visible
  - Barriers expand/contract on click of their connected threat/consequence
  - Degradation factors/controls expand from their connected barriers
- **Canvas Features**:
  - Zoom and pan controls
  - Grid snapping (20px grid)
  - Mini-map for navigation
  - Background grid
  - Auto-layout with bowtie-specific positioning
- **Interactive Features**:
  - Hover to expand nodes and show full information
  - Click to toggle barrier visibility
  - Path highlighting and focus mode
  - Animated edge flows
  - Risk score badges
  - Color intensity based on risk levels
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

- **Hazard** (⚠️): Potential sources of harm (orange gradient) - positioned above Top Event
- **Top Event** (🎯): The point at which control over the hazard is lost (red circular node, center of bowtie)
- **Threat** (⚡): Events that could lead to the top event (blue) - positioned on left side
- **Barrier** (🛡️): Controls that prevent or mitigate risks
  - **Prevention Barriers**: Positioned between threats and top event (green)
  - **Mitigation Barriers**: Positioned between top event and consequences (green)
  - Can be marked as failed (red when failed)
  - Form sequential chains showing layers of security
- **Consequence** (💥): Outcomes if barriers fail (red gradient) - positioned on right side
- **Degradation Factor** (⚠️): Factors that can degrade barrier effectiveness (yellow/amber)
- **Degradation Control** (🛡️): Controls that prevent degradation factors (light green)

### Streamlit Presentation

1. Upload a bowtie diagram JSON file from the sidebar
2. View statistics and node details
3. Analyze connections between nodes
4. Optionally embed the React Flow app for interactive viewing
5. Download updated diagrams

## JSON Schema

The bowtie diagram follows this structure with sequential barrier chains:

### Node Types

- `hazard`: The central element that has the potential to cause harm
- `topEvent`: The point at which control over the hazard is lost
- `threat`: Potential causes that could lead to the top event
- `barrier`: Preventive and mitigation measures (must specify `barrierType`)
- `consequence`: Potential outcomes if the top event occurs
- `degradationFactor`: Factors that can degrade barrier effectiveness
- `degradationControl`: Controls that prevent degradation factors

### Connection Logic

**Prevention Barriers (Left Side)**:

- Threat connects ONLY to the first prevention barrier
- Barriers connect sequentially: Barrier1 → Barrier2 → Barrier3 → ...
- The last barrier connects to Top Event
- Example: `threat-1 → prevention-barrier-1 → prevention-barrier-2 → topEvent-1`

**Mitigation Barriers (Right Side)**:

- Top Event connects ONLY to the first mitigation barrier
- Barriers connect sequentially: Barrier1 → Barrier2 → Barrier3 → ...
- The last barrier connects to Consequence
- Example: `topEvent-1 → mitigation-barrier-1 → mitigation-barrier-2 → consequence-1`

**Degradation Factors/Controls**:

- Degradation Factor connects to Degradation Control
- Degradation Control connects to Barrier
- Example: `degradation-factor-1 → degradation-control-1 → barrier-1`

### Schema Structure

```json
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "hazard|topEvent|threat|barrier|consequence|degradationFactor|degradationControl",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Node Label",
        "description": "Optional description",
        "status": "normal|failed", // Only for barriers
        "barrierType": "prevention|mitigation", // Required for barriers
        "expanded": false // Optional: for threats/consequences to control barrier visibility
      }
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "type": "smoothstep" // Optional: edge type for horizontal flow
    }
  ]
}
```

**Note**: The `sourcePosition` and `targetPosition` properties are automatically set by the layout function to enforce horizontal left-to-right flow. You don't need to include them in the JSON file.

### Example: Prevention Barrier Chain

```json
{
  "nodes": [
    {
      "id": "threat-1",
      "type": "threat",
      "data": { "label": "Intoxicated driving" }
    },
    {
      "id": "barrier-1",
      "type": "barrier",
      "data": {
        "label": "Pre-employment screening",
        "barrierType": "prevention"
      }
    },
    {
      "id": "barrier-2",
      "type": "barrier",
      "data": { "label": "Random testing", "barrierType": "prevention" }
    },
    {
      "id": "topEvent-1",
      "type": "topEvent",
      "data": { "label": "Loss of control" }
    }
  ],
  "edges": [
    { "id": "e1", "source": "threat-1", "target": "barrier-1" },
    { "id": "e2", "source": "barrier-1", "target": "barrier-2" },
    { "id": "e3", "source": "barrier-2", "target": "topEvent-1" }
  ]
}
```

### Progressive Disclosure

- By default, only `hazard`, `topEvent`, `threat`, and `consequence` nodes are visible
- `barrier` nodes are hidden until their connected threat/consequence is clicked
- `degradationFactor` and `degradationControl` nodes are hidden until their connected barrier is visible
- Clicking a threat/consequence toggles the visibility of its barrier chain

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
