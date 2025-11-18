# Interactive Bowtie Risk Visualization

## Team Information

**Team #**: Group 5  
**Team Members**: Anthony Roca, Harper Clark, Ronan Lilley, Sofia Martinez
**Chosen Approach**: Interactive web-based visualization using React Flow for the diagram editor and Streamlit for the presentation platform. Our approach focuses on making bowtie diagrams more interpretable through story-like narratives, progressive disclosure of information, and focus mode to reduce cognitive overload.

## Risk Story Summary

Our demo scenario explores the risk of losing control of a commercial vehicle traveling at 70 mph on a highway. Multiple threats such as intoxicated driving, distracted driving, slippery road conditions, and poor visibility could lead to the top event—loss of vehicle control. The diagram illustrates how prevention barriers (like drug screening programs, hands-free device policies, weather monitoring, and defensive driving training) work together to prevent threats from reaching the critical top event. If prevention fails, mitigation barriers (including forward collision warning systems, seatbelt systems, electronic stability control) reduce the severity of consequences such as crashes, driver impact with vehicle internals, and vehicle rollovers. The visualization also shows degradation factors that can weaken barriers and the controls that prevent such degradation.

## How to Run/View

### Running the React Flow Interactive Diagram

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

The interactive diagram will be available at `http://localhost:5173`

### Running the Streamlit Presentation

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

The presentation will be available at `http://localhost:8501`

### Prototype Links

- **Interactive Diagram**: http://localhost:5173 (when running locally)
- **Streamlit Presentation**: http://localhost:8501 (when running locally)
- **Demo Data**: Located in `backend/data/demo_bowtie.json`

### Deployed Website Link

- `https://dsba-bowtie.streamlit.app/`

## Acknowledgement

This is a student project developed for DSBA 5122 in collaboration with Todus Advisors. Bowtie Symbols are proprietary of Todus Advisors.
