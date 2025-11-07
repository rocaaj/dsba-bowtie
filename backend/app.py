"""Streamlit viewer for Bowtie risk diagrams."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List

import streamlit as st
from streamlit.components.v1 import iframe

from utils.load_json import load_bowtie

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DEFAULT_SAMPLE = DATA_DIR / "sample_bowtie.json"


def get_session_data() -> Dict:
    """Ensure the session state contains Bowtie data."""
    if "bowtie_data" not in st.session_state:
        st.session_state["bowtie_data"] = load_bowtie(DEFAULT_SAMPLE)
    if "failed_barriers" not in st.session_state:
        st.session_state["failed_barriers"] = []
    return st.session_state["bowtie_data"]


def set_session_data(data: Dict) -> None:
    st.session_state["bowtie_data"] = data
    st.session_state["failed_barriers"] = []


def set_failed_barriers(failed_ids: List[str]) -> None:
    st.session_state["failed_barriers"] = failed_ids


def build_storylines(data: Dict, failed: List[str]) -> List[str]:
    failed_set = set(failed)
    lines = [
        f'We are managing the hazard "{data.get("hazard", "—")}" to avoid the top event "{data.get("top_event", "—")}".'
    ]

    threats = data.get("threats", [])
    if threats:
        threat_names = ", ".join(item["name"] for item in threats)
        lines.append(f"Primary threats monitored: {threat_names}.")

    for key, label in (("prevention_barriers", "Prevention barriers"), ("mitigation_barriers", "Mitigation barriers")):
        barriers = data.get(key, [])
        if not barriers:
            continue

        effective = [b["name"] for b in barriers if b["id"] not in failed_set]
        failed_names = [b["name"] for b in barriers if b["id"] in failed_set]

        if effective:
            lines.append(f"{label} currently effective: {', '.join(effective)}.")
        if failed_names:
            lines.append(f"⚠️ {label} failed: {', '.join(failed_names)}.")

    consequences = data.get("consequences", [])
    if consequences:
        consequence_names = ", ".join(item["name"] for item in consequences)
        lines.append(f"If the top event occurs, potential consequences include {consequence_names}.")

    return lines


def render_barrier_controls(label: str, barriers: List[Dict], failed: List[str]) -> List[str]:
    st.subheader(label)
    updated_failed = set(failed)
    for barrier in barriers:
        checked = barrier["id"] not in updated_failed
        checkbox = st.checkbox(
            barrier["name"],
            value=checked,
            help=barrier.get("description"),
            key=f"{label}-{barrier['id']}",
        )
        if checkbox:
            updated_failed.discard(barrier["id"])
        else:
            updated_failed.add(barrier["id"])
    return sorted(updated_failed)


def render_sidebar(data: Dict) -> None:
    st.sidebar.header("Scenario Controls")

    if st.sidebar.button("Reload Sample Scenario"):
        set_session_data(load_bowtie(DEFAULT_SAMPLE))
        st.experimental_rerun()

    uploaded = st.sidebar.file_uploader("Load Bowtie JSON", type=["json"])
    if uploaded:
        try:
            parsed = json.load(uploaded)
            set_session_data(parsed)
            st.sidebar.success("Diagram loaded.")
        except json.JSONDecodeError:
            st.sidebar.error("The uploaded file is not valid JSON.")

    current_json = json.dumps(data, indent=2).encode("utf-8")
    st.sidebar.download_button("Download JSON", current_json, file_name="bowtie-diagram.json", mime="application/json")

    with st.sidebar.expander("Optional: Embed live React app"):
        frontend_url = st.text_input(
            "React app URL",
            value=st.session_state.get("frontend_url", "http://localhost:5173"),
            help="Run the React app locally with `npm run dev` and paste the URL here to preview inside Streamlit.",
        )
        st.session_state["frontend_url"] = frontend_url
        if st.button("Show React diagram"):
            st.session_state["show_iframe"] = True

    prevention = data.get("prevention_barriers", [])
    mitigation = data.get("mitigation_barriers", [])
    failed_ids = st.session_state.get("failed_barriers", [])

    st.sidebar.markdown("---")
    st.sidebar.caption("Toggle barriers to simulate failures:")

    if prevention:
        failed_ids = render_barrier_controls("Prevention Barriers", prevention, failed_ids)
    if mitigation:
        failed_ids = render_barrier_controls("Mitigation Barriers", mitigation, failed_ids)

    set_failed_barriers(failed_ids)


def format_items(label: str, items: List[Dict]) -> None:
    if not items:
        return
    st.write(f"**{label}**")
    for item in items:
        st.markdown(f"- {item['name']}  \n  <span style='color:#4b5563;'>{item.get('description','')}</span>", unsafe_allow_html=True)


def render_main_view(data: Dict) -> None:
    st.title("Bowtie Risk Visualization")
    st.caption("Explore hazards, threats, and barriers with scenario storytelling.")

    st.markdown(
        f"""
**Hazard**: {data.get('hazard', '—')}  
**Top Event**: {data.get('top_event', '—')}
""".strip()
    )

    cols = st.columns(2)
    with cols[0]:
        format_items("Threats", data.get("threats", []))
        format_items("Prevention Barriers", data.get("prevention_barriers", []))
    with cols[1]:
        format_items("Mitigation Barriers", data.get("mitigation_barriers", []))
        format_items("Consequences", data.get("consequences", []))

    storylines = build_storylines(data, st.session_state.get("failed_barriers", []))
    st.markdown("### Risk Story")
    for line in storylines:
        st.write(f"- {line}")

    if st.session_state.get("show_iframe"):
        st.markdown("### Live Diagram")
        iframe(st.session_state["frontend_url"], height=620, scrolling=True)
        st.caption("Interact with the full ReactFlow diagram in the embedded viewer.")

    st.markdown("---")
    st.subheader("Raw Diagram JSON")
    st.json(data)


def main() -> None:
    st.set_page_config(page_title="Bowtie Risk Viewer", layout="wide")
    data = get_session_data()

    render_sidebar(data)
    render_main_view(data)


if __name__ == "__main__":
    main()


