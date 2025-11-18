import streamlit as st
import json
from pathlib import Path

# Page configuration
st.set_page_config(
    page_title="Interactive Bowtie Risk Visualization",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS - structural only, using Streamlit default colors
st.markdown("""
<style>
    /* Structural styles only - colors use Streamlit defaults */
    .main-header {
        font-size: 3rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
        text-align: center;
    }
    
    .section-header {
        font-size: 2rem;
        font-weight: 700;
        margin-top: 2rem;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 3px solid;
    }
    
    .narrative-box {
        padding: 2rem;
        border-radius: 15px;
        border-left: 5px solid;
        margin: 1.5rem 0;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .problem-box {
        padding: 1.5rem;
        border-radius: 10px;
        border-left: 5px solid;
        margin: 1rem 0;
    }
    
    .solution-box {
        padding: 1.5rem;
        border-radius: 10px;
        border-left: 5px solid;
        margin: 1rem 0;
    }
    
    .story-highlight {
        padding: 1rem;
        border-radius: 10px;
        margin: 1rem 0;
        font-weight: 600;
    }
    
    .stTabs [data-baseweb="tab-list"] {
        gap: 2rem;
        padding: 0.5rem;
        border-radius: 10px;
    }
    
    .stTabs [data-baseweb="tab"] {
        padding: 0.75rem 1.5rem;
        font-weight: 600;
    }
    
    .metric-card {
        padding: 1.5rem;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        text-align: center;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'current_page' not in st.session_state:
    st.session_state.current_page = 'Introduction'

def load_demo_data():
    """Load the demo bowtie data"""
    demo_path = Path(__file__).parent / "data" / "demo_bowtie.json"
    if demo_path.exists():
        with open(demo_path, 'r') as f:
            return json.load(f)
    return None

def get_narrative_data(data):
    """Extract narrative information from bowtie data"""
    if not data:
        return None
    
    nodes = data.get('nodes', [])
    
    # Find key nodes
    hazard = next((n for n in nodes if n.get('type') == 'hazard'), None)
    top_event = next((n for n in nodes if n.get('type') == 'topEvent'), None)
    threats = [n for n in nodes if n.get('type') == 'threat']
    prevention_barriers = [n for n in nodes if n.get('type') == 'barrier' and n.get('data', {}).get('barrierType') == 'prevention']
    mitigation_barriers = [n for n in nodes if n.get('type') == 'barrier' and n.get('data', {}).get('barrierType') == 'mitigation']
    consequences = [n for n in nodes if n.get('type') == 'consequence']
    degradation_factors = [n for n in nodes if n.get('type') == 'degradationFactor']
    degradation_controls = [n for n in nodes if n.get('type') == 'degradationControl']
    
    return {
        'hazard': hazard,
        'top_event': top_event,
        'threats': threats,
        'prevention_barriers': prevention_barriers,
        'mitigation_barriers': mitigation_barriers,
        'consequences': consequences,
        'degradation_factors': degradation_factors,
        'degradation_controls': degradation_controls,
        'nodes': nodes,
        'edges': data.get('edges', [])
    }

# Sidebar navigation
with st.sidebar:
    st.markdown("## 🎯 Presentation Navigation")
    st.markdown("---")
    
    page = st.radio(
        "Select Section:",
        [
            "1️⃣ Introduction",
            "2️⃣ Why This App?",
            "3️⃣ The Story",
            "4️⃣ Interactive Demo"
        ],
        label_visibility="collapsed"
    )
    
    # Store the full page value
    st.session_state.current_page = page
    
    st.markdown("---")
    st.markdown("### 📊 Demo Statistics")
    demo_data = load_demo_data()
    if demo_data:
        narrative = get_narrative_data(demo_data)
        if narrative:
            col1, col2 = st.columns(2)
            with col1:
                st.metric("Threats", len(narrative['threats']))
                st.metric("Prevention Barriers", len(narrative['prevention_barriers']))
            with col2:
                st.metric("Consequences", len(narrative['consequences']))
                st.metric("Mitigation Barriers", len(narrative['mitigation_barriers']))

# Main content based on selected page
if st.session_state.current_page == "1️⃣ Introduction" or st.session_state.current_page.startswith("1"):
    st.markdown('<div class="main-header">🎯 Interactive Bowtie Risk Visualization</div>', unsafe_allow_html=True)
    st.markdown('<div style="text-align: center; font-size: 1.2rem; margin-bottom: 3rem;">Making Risk Analysis More Interpretable and Story-Like</div>', unsafe_allow_html=True)
    
    st.markdown('<div class="section-header">What is a Bowtie Diagram?</div>', unsafe_allow_html=True)
    
    st.markdown("""
    **Bowtie diagrams** visualize how threats lead to hazards and consequences, with barriers preventing 
    or mitigating risks. Their distinctive shape shows threats converging on a central event, with 
    consequences diverging from it.
    
    ### 🎯 Key Components
    
    - **Left Side**: Threats → Prevention Barriers → Top Event
    - **Right Side**: Top Event → Mitigation Barriers → Consequences
    - **Degradation**: Factors that weaken barriers, and controls to prevent degradation
    
    **Used in**: Aviation, Oil & Gas, Healthcare, Transportation, Industrial Safety
    """)
    
    st.markdown('<div class="section-header">⚠️ Current Problems</div>', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        <div class="problem-box">
            <h4>🔴 Static & Overwhelming</h4>
            <p>Traditional diagrams are static PDFs/images with all information visible at once, making them hard to navigate</p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="problem-box">
            <h4>🔴 Lack of Context</h4>
            <p>Missing narrative flow makes it difficult to understand relationships and scenarios</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <div class="problem-box">
            <h4>🔴 Poor Interpretation</h4>
            <p>Non-experts struggle to understand complex risk scenarios</p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="problem-box">
            <h4>🔴 Passive Viewing</h4>
            <p>No interaction or exploration discourages active learning</p>
        </div>
        """, unsafe_allow_html=True)

elif st.session_state.current_page == "2️⃣ Why This App?" or st.session_state.current_page.startswith("2"):
    st.markdown('<div class="section-header">💡 Why We Built This Interactive Application</div>', unsafe_allow_html=True)
    
    st.markdown("""
    <div class="narrative-box">
        <h2 style="margin-top: 0;">Our Mission</h2>
        <p style="font-size: 1.1rem; line-height: 1.8;">
        To transform static, overwhelming risk diagrams into <strong>interactive, interpretable, 
        and story-like experiences</strong> that help both experts and non-experts understand 
        complex risk scenarios.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown('<div class="section-header">✨ Key Features</div>', unsafe_allow_html=True)
    
    feature_tabs = st.tabs([
        "🎯 Focus Mode",
        "📖 Narrative Flow",
        "🎨 Interactive Exploration"
    ])
    
    with feature_tabs[0]:
        st.markdown("""
        ### 🎯 Focus Mode
        
        <div class="solution-box">
            <p><strong>Solves:</strong> Information overload - too much visible at once</p>
            <p><strong>Solution:</strong> Hover over any node to highlight its complete path. Other paths dim automatically, reducing clutter.</p>
        </div>
        
        **Example:** Hover over "Intoxicated driving" to see its prevention barriers, the top event, mitigation barriers, and consequences - all while other paths fade.
        """, unsafe_allow_html=True)
    
    with feature_tabs[1]:
        st.markdown("""
        ### 📖 Narrative Flow
        
        <div class="solution-box">
            <p><strong>Solves:</strong> Lack of context and storytelling</p>
            <p><strong>Solution:</strong> Present scenarios as stories with beginning (threats), middle (barriers), and end (consequences). Expand nodes progressively to reveal details.</p>
        </div>
        
        **Result:** Risk scenarios become memorable narratives that anyone can understand.
        """, unsafe_allow_html=True)
    
    with feature_tabs[2]:
        st.markdown("""
        ### 🎨 Interactive Exploration
        
        <div class="solution-box">
            <p><strong>Solves:</strong> Passive viewing and poor engagement</p>
            <p><strong>Solution:</strong> Click to expand, toggle barrier status, animate paths, zoom and pan. Learn by exploring at your own pace.</p>
        </div>
        
        **Features:** Expand/collapse nodes, toggle barrier failures, focus mode, path animation, degradation factor exploration.
        """, unsafe_allow_html=True)
    
    st.markdown('<div class="section-header">🚀 The Result</div>', unsafe_allow_html=True)
    
    st.markdown("""
    <div class="story-highlight" style="font-size: 1.2rem; text-align: center; padding: 2rem;">
        Transform complex, static risk diagrams into <strong>interactive stories</strong> that are 
        <strong>easy to understand</strong>, <strong>engaging to explore</strong>, and 
        <strong>effective for communication</strong>.
    </div>
    """, unsafe_allow_html=True)

elif st.session_state.current_page == "3️⃣ The Story" or st.session_state.current_page.startswith("3"):
    st.markdown('<div class="section-header">📖 Our Demo Scenario: Commercial Vehicle Safety</div>', unsafe_allow_html=True)
    
    demo_data = load_demo_data()
    narrative = get_narrative_data(demo_data) if demo_data else None
    
    if narrative:
        # Introduction
        st.markdown("""
        <div class="narrative-box">
            <h2 style="margin-top: 0;">Our Demo Scenario</h2>
            <p style="font-size: 1.1rem; line-height: 1.8;">
            <strong>Commercial vehicle on highway at 70 mph</strong> - a scenario where loss of control 
            could lead to serious consequences. Our diagram shows how multiple threats are prevented and 
            how consequences are mitigated.
            </p>
        </div>
        """, unsafe_allow_html=True)
        
        # The Hazard
        if narrative['hazard']:
            hazard_data = narrative['hazard'].get('data', {})
            st.markdown('<div class="section-header">⚠️ The Hazard</div>', unsafe_allow_html=True)
            
            col1, col2 = st.columns([3, 1])
            with col1:
                st.markdown(f"""
                <div style="background: linear-gradient(135deg, #78350f 0%, #b45309 100%); padding: 1.5rem; border-radius: 10px; border-left: 5px solid #f59e0b; color: white;">
                    <h3 style="margin-top: 0; color: white;">{hazard_data.get('label', 'Hazard')}</h3>
                    <p style="margin-bottom: 0; color: white;">{hazard_data.get('description', '')}</p>
                </div>
                """, unsafe_allow_html=True)
            
            with col2:
                st.markdown("""
                <div style="text-align: center; padding: 1rem; background: #f3f4f6; border-radius: 10px;">
                    <div style="font-size: 2.5rem;">⚠️</div>
                    <div style="font-weight: 600; margin-top: 0.5rem;">Hazard</div>
                </div>
                """, unsafe_allow_html=True)
        
        # The Top Event
        if narrative['top_event']:
            top_event_data = narrative['top_event'].get('data', {})
            st.markdown('<div class="section-header">🎯 The Top Event</div>', unsafe_allow_html=True)
            
            st.markdown(f"""
            <div style="background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%); padding: 1.5rem; border-radius: 10px; border-left: 5px solid #ef4444; margin-bottom: 2rem; color: white;">
                <h3 style="margin-top: 0; color: white;">{top_event_data.get('label', 'Top Event')}</h3>
                <p style="margin-bottom: 0; font-size: 1.1rem; color: white;">
                {top_event_data.get('description', '')}
                </p>
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown("""
            <p style="font-size: 1.1rem; line-height: 1.8;">
            This is the <strong>critical moment</strong> where control is lost. Everything on the left side 
            (threats and prevention barriers) works to prevent reaching this point. Everything on the right 
            side (mitigation barriers and consequences) addresses what happens if we reach this point.
            </p>
            """, unsafe_allow_html=True)
        
        # Threats Section - Show only first 2 threats as examples
        st.markdown('<div class="section-header">⚡ Example Threats</div>', unsafe_allow_html=True)
        
        st.markdown("""
        <p style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 1rem;">
        Multiple threats could lead to loss of control. Each has prevention barriers. Here are two examples:
        </p>
        """, unsafe_allow_html=True)
        
        # Show only first 2 threats
        example_threats = narrative['threats'][:2]
        threat_tabs = st.tabs([t.get('data', {}).get('label', f'Threat {i+1}') for i, t in enumerate(example_threats)])
        
        for idx, threat in enumerate(example_threats):
            with threat_tabs[idx]:
                threat_data = threat.get('data', {})
                threat_label = threat_data.get('label', 'Threat')
                
                st.markdown(f"""
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 1.5rem; border-radius: 10px; border-left: 5px solid #3b82f6; margin-bottom: 1.5rem; color: white;">
                    <h3 style="margin-top: 0; color: white;">{threat_label}</h3>
                    <p style="margin-bottom: 0; color: white;">{threat_data.get('description', '')}</p>
                </div>
                """, unsafe_allow_html=True)
                
                # Find prevention barriers for this threat
                threat_id = threat.get('id')
                edges = narrative['edges']
                threat_barriers = []
                
                # Find edges from this threat
                for edge in edges:
                    if edge.get('source') == threat_id:
                        barrier_id = edge.get('target')
                        barrier = next((b for b in narrative['prevention_barriers'] if b.get('id') == barrier_id), None)
                        if barrier:
                            threat_barriers.append(barrier)
                
                # Also find barriers in the chain
                barrier_chain = []
                if threat_barriers:
                    current_barrier = threat_barriers[0]
                    while current_barrier:
                        barrier_chain.append(current_barrier)
                        # Find next barrier in chain
                        current_barrier_id = current_barrier.get('id')
                        next_edge = next((e for e in edges if e.get('source') == current_barrier_id and e.get('target') != 'topEvent-1'), None)
                        if next_edge:
                            next_barrier_id = next_edge.get('target')
                            current_barrier = next((b for b in narrative['prevention_barriers'] if b.get('id') == next_barrier_id), None)
                        else:
                            # Check if it connects to top event
                            top_edge = next((e for e in edges if e.get('source') == current_barrier_id and e.get('target') == 'topEvent-1'), None)
                            if top_edge:
                                break
                            current_barrier = None
                
                if barrier_chain:
                    st.markdown("#### 🛡️ Prevention Barriers:")
                    # Show only first 2 barriers as examples
                    for i, barrier in enumerate(barrier_chain[:2]):
                        barrier_data = barrier.get('data', {})
                        st.markdown(f"**{i+1}. {barrier_data.get('label', 'Barrier')}** - {barrier_data.get('description', '')[:80]}...")
                    if len(barrier_chain) > 2:
                        st.markdown(f"*...and {len(barrier_chain) - 2} more barriers*")
        
        # Consequences Section - Show only first 2 as examples
        st.markdown('<div class="section-header">💥 Example Consequences</div>', unsafe_allow_html=True)
        
        st.markdown("""
        <p style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 1rem;">
        If prevention fails, these consequences can occur. Each has mitigation barriers to reduce impact:
        </p>
        """, unsafe_allow_html=True)
        
        # Show only first 2 consequences
        example_consequences = narrative['consequences'][:2]
        for consequence in example_consequences:
            consequence_data = consequence.get('data', {})
            consequence_id = consequence.get('id')
            
            st.markdown(f"""
            <div style="background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%); padding: 1.5rem; border-radius: 10px; border-left: 5px solid #ef4444; margin-bottom: 1.5rem; color: white;">
                <h3 style="margin-top: 0; color: white;">💥 {consequence_data.get('label', 'Consequence')}</h3>
                <p style="margin-bottom: 1rem; color: white;">{consequence_data.get('description', '')}</p>
            </div>
            """, unsafe_allow_html=True)
            
            # Find mitigation barriers for this consequence
            mitigation_barriers = []
            for edge in edges:
                if edge.get('target') == consequence_id:
                    barrier_id = edge.get('source')
                    barrier = next((b for b in narrative['mitigation_barriers'] if b.get('id') == barrier_id), None)
                    if barrier:
                        mitigation_barriers.append(barrier)
            
            # Build barrier chain backwards from consequence
            barrier_chain = []
            if mitigation_barriers:
                current_barrier = mitigation_barriers[0]
                visited = set()
                while current_barrier and current_barrier.get('id') not in visited:
                    visited.add(current_barrier.get('id'))
                    barrier_chain.insert(0, current_barrier)  # Insert at beginning for correct order
                    # Find previous barrier in chain
                    current_barrier_id = current_barrier.get('id')
                    prev_edge = next((e for e in edges if e.get('target') == current_barrier_id), None)
                    if prev_edge and prev_edge.get('source') != 'topEvent-1':
                        prev_barrier_id = prev_edge.get('source')
                        current_barrier = next((b for b in narrative['mitigation_barriers'] if b.get('id') == prev_barrier_id), None)
                    else:
                        break
            
            if barrier_chain:
                st.markdown("#### 🛡️ Mitigation Barriers:")
                # Show only first 2 barriers as examples
                for i, barrier in enumerate(barrier_chain[:2]):
                    barrier_data = barrier.get('data', {})
                    st.markdown(f"**{i+1}. {barrier_data.get('label', 'Barrier')}** - {barrier_data.get('description', '')[:80]}...")
                if len(barrier_chain) > 2:
                    st.markdown(f"*...and {len(barrier_chain) - 2} more barriers*")
        
        # Summary
        st.markdown('<div class="section-header">📋 Summary</div>', unsafe_allow_html=True)
        
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Threats", len(narrative['threats']))
        with col2:
            st.metric("Prevention Barriers", len(narrative['prevention_barriers']))
        with col3:
            st.metric("Consequences", len(narrative['consequences']))
        with col4:
            st.metric("Mitigation Barriers", len(narrative['mitigation_barriers']))
        
        st.markdown("""
        <div class="narrative-box" style="margin-top: 2rem;">
            <h3 style="margin-top: 0;">The Complete Picture</h3>
            <p style="font-size: 1.1rem; line-height: 1.8;">
            This demonstrates how threats converge on a critical event, how prevention barriers stop them, 
            and how mitigation barriers reduce impact if the event occurs. Degradation factors show how 
            barriers can weaken, with controls to prevent failure.
            </p>
            <p style="font-size: 1.1rem; line-height: 1.8; margin-top: 1rem;">
            <strong>Now let's see this come to life in the interactive demo!</strong>
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    else:
        st.error("Could not load demo data. Please ensure demo_bowtie.json exists in the data folder.")

elif st.session_state.current_page == "4️⃣ Interactive Demo" or st.session_state.current_page.startswith("4"):
    st.markdown('<div class="section-header">🎮 Interactive Demo</div>', unsafe_allow_html=True)
    
    st.markdown("""
    <div class="narrative-box">
        <h3 style="margin-top: 0;">Explore the Interactive Bowtie Diagram</h3>
        <p style="font-size: 1.1rem; line-height: 1.8;">
        This is where the magic happens! Interact with the bowtie diagram below to see how our features 
        make risk scenarios more interpretable and story-like.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("### 🎯 How to Use")
    
    instruction_col1, instruction_col2 = st.columns(2)
    
    with instruction_col1:
        st.markdown("""
        #### Interactive Features:
        
        1. **🎯 Focus Mode**: Toggle focus mode in the toolbar
           - Hover over any node to highlight its complete path
           - Other paths will dim automatically
        
        2. **📖 Expand/Collapse**: Click on threats or consequences
           - Expand to see related barriers
           - Collapse to simplify the view
        
        3. **🎨 Barrier Status**: Click on barriers
           - Toggle between normal and failed states
           - See how barrier failure affects the risk path
        
        4. **🔍 Explore Details**: Hover over nodes
           - See descriptions and details
           - Understand relationships
        """)
    
    with instruction_col2:
        st.markdown("""
        #### Try These:
        
        ✅ **Hover over "Intoxicated driving"**  
           → See the complete prevention path
        
        ✅ **Toggle Focus Mode**  
           → Watch other paths dim as you explore
        
        ✅ **Expand "Crash into a fixed object"**  
           → View all mitigation barriers
        
        ✅ **Click a barrier** to toggle its status  
           → See visual feedback for barrier failure
        
        ✅ **Follow degradation factors**  
           → Understand how barriers can weaken
        """)
    
    st.divider()
    
    # React App Embedding
    st.markdown("### 🖥️ Interactive Diagram")
    
    react_app_url = st.text_input(
        "React App URL",
        value="http://localhost:5173",
        help="Enter the URL where your React Flow app is running (default: http://localhost:5173)"
    )
    
    col1, col2 = st.columns([3, 1])
    
    with col1:
        if react_app_url:
            try:
                st.components.v1.iframe(
                    react_app_url,
                    height=800,
                    scrolling=True
                )
            except Exception as e:
                st.warning(f"Could not load React app: {str(e)}")
                st.info("""
                **To run the demo:**
                1. Make sure the React app is running (`npm run dev` in the frontend folder)
                2. The app should be available at http://localhost:5173 (or your configured port)
                3. Enter the correct URL above
                """)
    
    with col2:
        st.markdown("""
        ### 🎛️ Controls
        
        **Status:**  
        {status}
        
        **Features:**
        - ✅ Focus Mode
        - ✅ Expand/Collapse
        - ✅ Barrier Toggle
        - ✅ Path Highlighting
        - ✅ Degradation Views
        
        **Tips:**
        - Use mouse wheel to zoom
        - Drag to pan
        - Click nodes for details
        """.format(status="🟢 Running" if react_app_url else "🔴 Not Connected"))

# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; padding: 2rem;">
    <p><strong>Interactive Bowtie Risk Visualization</strong> | Making Risk Analysis More Interpretable and Story-Like</p>
</div>
""", unsafe_allow_html=True)
