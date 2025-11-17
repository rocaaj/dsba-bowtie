import streamlit as st
import json
import os
from pathlib import Path

# Page configuration
st.set_page_config(
    page_title="Bowtie Risk Visualization",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 1rem;
    }
    .node-type-card {
        padding: 1rem;
        border-radius: 8px;
        margin: 0.5rem 0;
        border-left: 4px solid;
    }
    .hazard-card {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border-left-color: #f59e0b;
    }
    .threat-card {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        border-left-color: #3b82f6;
    }
    .barrier-card {
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        border-left-color: #10b981;
    }
    .consequence-card {
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        border-left-color: #ef4444;
    }
    .stButton>button {
        width: 100%;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'diagram_data' not in st.session_state:
    st.session_state.diagram_data = None
if 'diagram_file' not in st.session_state:
    st.session_state.diagram_file = None

def load_diagram_from_file(file):
    """Load and validate bowtie diagram from uploaded file"""
    try:
        data = json.load(file)
        # Basic validation
        if 'nodes' in data and 'edges' in data:
            return data
        else:
            st.error("Invalid diagram format: missing 'nodes' or 'edges'")
            return None
    except json.JSONDecodeError:
        st.error("Invalid JSON file")
        return None
    except Exception as e:
        st.error(f"Error loading file: {str(e)}")
        return None

def save_diagram_to_file(data, filename):
    """Save diagram data to JSON file"""
    json_str = json.dumps(data, indent=2)
    return json_str.encode('utf-8')

def get_node_type_stats(nodes):
    """Calculate statistics for each node type"""
    stats = {
        'hazard': 0,
        'threat': 0,
        'barrier': 0,
        'consequence': 0
    }
    for node in nodes:
        node_type = node.get('type', '')
        if node_type in stats:
            stats[node_type] += 1
    return stats

def display_node_info(nodes, node_type):
    """Display information about nodes of a specific type"""
    filtered_nodes = [n for n in nodes if n.get('type') == node_type]
    
    if not filtered_nodes:
        st.info(f"No {node_type} nodes in the diagram")
        return
    
    for node in filtered_nodes:
        data = node.get('data', {})
        label = data.get('label', 'Unnamed')
        description = data.get('description', 'No description')
        status = data.get('status', 'normal')
        
        card_class = f"{node_type}-card"
        status_badge = "❌ Failed" if status == 'failed' else "✅ Normal"
        
        st.markdown(f"""
        <div class="node-type-card {card_class}">
            <strong>{label}</strong> {status_badge if node_type == 'barrier' else ''}<br>
            <small>{description}</small>
        </div>
        """, unsafe_allow_html=True)

# Main header
st.markdown('<div class="main-header">🎯 Bowtie Risk Visualization</div>', unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.header("📁 File Management")
    
    # File uploader
    uploaded_file = st.file_uploader(
        "Upload Bowtie Diagram",
        type=['json'],
        help="Upload a JSON file containing your bowtie diagram"
    )
    
    if uploaded_file is not None:
        if st.session_state.diagram_file != uploaded_file.name:
            data = load_diagram_from_file(uploaded_file)
            if data:
                st.session_state.diagram_data = data
                st.session_state.diagram_file = uploaded_file.name
                st.success("Diagram loaded successfully!")
    
    st.divider()
    
    # Sample diagram button
    if st.button("📋 Load Sample Diagram"):
        sample_path = Path(__file__).parent / "data" / "sample_bowtie.json"
        if sample_path.exists():
            with open(sample_path, 'r') as f:
                st.session_state.diagram_data = json.load(f)
                st.session_state.diagram_file = "sample_bowtie.json"
                st.success("Sample diagram loaded!")
        else:
            st.warning("Sample diagram file not found")
    
    st.divider()
    
    # Download button
    if st.session_state.diagram_data:
        json_data = save_diagram_to_file(
            st.session_state.diagram_data,
            "bowtie-diagram.json"
        )
        st.download_button(
            label="💾 Download Diagram",
            data=json_data,
            file_name="bowtie-diagram.json",
            mime="application/json"
        )

# Main content area
if st.session_state.diagram_data:
    data = st.session_state.diagram_data
    nodes = data.get('nodes', [])
    edges = data.get('edges', [])
    
    # Statistics
    col1, col2, col3, col4 = st.columns(4)
    
    stats = get_node_type_stats(nodes)
    
    with col1:
        st.metric("⚠️ Hazards", stats['hazard'])
    with col2:
        st.metric("⚡ Threats", stats['threat'])
    with col3:
        st.metric("🛡️ Barriers", stats['barrier'])
    with col4:
        st.metric("💥 Consequences", stats['consequence'])
    
    st.divider()
    
    # Diagram visualization section
    st.header("📊 Diagram Overview")
    
    # Embed React app (if running)
    react_app_url = st.text_input(
        "React App URL (optional)",
        value="http://localhost:5173",
        help="Enter the URL of your running React Flow app to embed it here"
    )
    
    if react_app_url:
        try:
            st.components.v1.iframe(
                react_app_url,
                height=600,
                scrolling=True
            )
        except Exception as e:
            st.warning(f"Could not load React app: {str(e)}")
            st.info("Make sure your React app is running and accessible at the provided URL")
    
    st.divider()
    
    # Node details tabs
    tab1, tab2, tab3, tab4 = st.tabs([
        f"⚠️ Hazards ({stats['hazard']})",
        f"⚡ Threats ({stats['threat']})",
        f"🛡️ Barriers ({stats['barrier']})",
        f"💥 Consequences ({stats['consequence']})"
    ])
    
    with tab1:
        display_node_info(nodes, 'hazard')
    
    with tab2:
        display_node_info(nodes, 'threat')
    
    with tab3:
        display_node_info(nodes, 'barrier')
    
    with tab4:
        display_node_info(nodes, 'consequence')
    
    st.divider()
    
    # Raw JSON viewer
    with st.expander("🔍 View Raw JSON"):
        st.json(data)
    
    # Edge connections
    st.subheader("🔗 Connections")
    if edges:
        connection_data = []
        for edge in edges:
            source_node = next((n for n in nodes if n['id'] == edge['source']), None)
            target_node = next((n for n in nodes if n['id'] == edge['target']), None)
            if source_node and target_node:
                connection_data.append({
                    'From': source_node['data'].get('label', edge['source']),
                    'To': target_node['data'].get('label', edge['target']),
                    'Type': f"{source_node.get('type', 'unknown')} → {target_node.get('type', 'unknown')}"
                })
        
        if connection_data:
            st.dataframe(connection_data, use_container_width=True)
        else:
            st.info("No connections found in the diagram")
    else:
        st.info("No edges/connections in the diagram")
        
else:
    # Welcome screen
    st.info("👈 Upload a bowtie diagram JSON file from the sidebar to get started")
    
    st.markdown("""
    ### 📖 About Bowtie Diagrams
    
    Bowtie diagrams are a risk visualization tool that shows:
    
    - **Hazards**: Potential sources of harm
    - **Threats**: Events that could lead to the hazard
    - **Barriers**: Controls that prevent or mitigate risks
    - **Consequences**: Outcomes if barriers fail
    
    ### 🚀 Getting Started
    
    1. Use the React Flow app to create and edit bowtie diagrams
    2. Save your diagram as JSON
    3. Upload it here to view and analyze
    4. Use the sidebar to manage your diagrams
    """)
