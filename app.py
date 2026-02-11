import streamlit as st
import pandas as pd
import random
import time
from nba_api.stats.static import teams
from nba_api.stats.endpoints import commonteamroster

# --- APP CONFIG & CSS ---
st.set_page_config(page_title="Draft Showdown", layout="centered", initial_sidebar_state="collapsed")

st.markdown("""
<style>
    .stApp { background-color: #0d1117; color: #ffffff; }
    .center-text { text-align: center; font-family: 'Helvetica Neue', sans-serif; }
    .roster-card { background-color: #161b22; border-radius: 15px; padding: 25px; width: 350px; margin: 0 auto 30px auto; border: 1px solid #30363d; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .roster-header { color: #ff5722; font-weight: 800; font-size: 1.1em; margin-bottom: 20px; letter-spacing: 1px; }
    .roster-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #30363d; }
    .roster-row:last-child { border-bottom: none; }
    .pos-label { color: #6e7681; font-weight: 700; width: 30px; }
    .player-name { color: #c9d1d9; font-weight: 500; text-align: right; }
    
    div.stButton > button:first-child {
        background: linear-gradient(90deg, #ff5722 0%, #ff8a50 100%);
        color: white; border: none; border-radius: 12px; padding: 15px 0;
        font-size: 22px; font-weight: 800; letter-spacing: 2px; width: 100%;
        transition: all 0.2s ease-in-out; box-shadow: 0 0 15px rgba(255, 87, 34, 0.4);
    }
    div.stButton > button:first-child:hover { transform: scale(1.02); box-shadow: 0 0 25px rgba(255, 87, 34, 0.7); }
    
    .team-card { background-color: #161b22; border: 2px solid #ff5722; border-radius: 15px; padding: 20px; text-align: center; margin: 20px auto; box-shadow: 0 0 20px rgba(255, 87, 34, 0.2); }
    .team-city { color: #8b949e; font-size: 0.9em; text-transform: uppercase; }
    .team-name { color: #ffffff; font-size: 1.8em; font-weight: bold; margin-top: 5px; }
</style>
""", unsafe_allow_html=True)

# --- NBA POSITION MAPPING ---
# Maps your UI positions to the NBA API position classifications
POSITION_MAP = {
    "PG": ["G", "G-F", "F-G"],
    "SG": ["G", "G-F", "F-G"],
    "SF": ["F", "G-F", "F-G", "F-C", "C-F"],
    "PF": ["F", "F-C", "C-F"],
    "C": ["C", "F-C", "C-F"]
}

# --- CACHED DATA ---
@st.cache_data(ttl=86400)
def get_nba_teams():
    return teams.get_teams()

@st.cache_data(ttl=86400)
def get_team_roster(team_id):
    roster = commonteamroster.CommonTeamRoster(team_id=team_id).get_data_frames()[0]
    return roster[['PLAYER', 'POSITION']]

# --- STATE MANAGEMENT ---
if 'roster' not in st.session_state:
    st.session_state.roster = {"PG": "---", "SG": "---", "SF": "---", "PF": "---", "C": "---"}
if 'spun_team' not in st.session_state:
    st.session_state.spun_team = None

nba_teams = get_nba_teams()

# --- HEADER & ROSTER UI ---
st.markdown("<h3 class='center-text' style='color:#ff5722; margin-bottom: 30px;'>PLAYER 1's DRAFT</h3>", unsafe_allow_html=True)

# Fixed HTML string formatting (No indentation to prevent markdown code block rendering)
roster_html = "<div class='roster-card'><div class='roster-header'>🔴 PLAYER 1</div>"
for pos, player in st.session_state.roster.items():
    player_display = player if player else "---"
    roster_html += f"<div class='roster-row'><span class='pos-label'>{pos}</span><span class='player-name'>{player_display}</span></div>"
roster_html += "</div>"
st.markdown(roster_html, unsafe_allow_html=True)

# --- DRAFT COMPLETION CHECK ---
if all(player != "---" for player in st.session_state.roster.values()):
    st.success("🎉 Roster Complete! Ready for tip-off.")
    if st.button("START NEW DRAFT"):
        st.session_state.roster = {"PG": "---", "SG": "---", "SF": "---", "PF": "---", "C": "---"}
        st.session_state.spun_team = None
        st.rerun()
    st.stop()

# --- MAIN LOGIC AREA ---
spin_container = st.empty()

if st.session_state.spun_team is None:
    with spin_container.container():
        st.write("") 
        if st.button("SPIN"):
            for i in range(15):
                temp_team = random.choice(nba_teams)
                spin_container.markdown(f"<div class='team-card' style='border-color: #30363d; box-shadow: none;'><div class='team-city'>{temp_team['city']}</div><div class='team-name'>{temp_team['nickname']}</div></div>", unsafe_allow_html=True)
                time.sleep(max(0.05, i * 0.02))
            
            st.session_state.spun_team = random.choice(nba_teams)
            st.rerun()

else:
    team = st.session_state.spun_team
    st.markdown(f"<div class='team-card'><div class='team-city'>{team['city']}</div><div class='team-name'>{team['nickname']}</div></div>", unsafe_allow_html=True)
    
    try:
        roster_df = get_team_roster(team['id'])
        available_positions = [pos for pos, player in st.session_state.roster.items() if player == "---"]
        
        st.markdown("<div style='margin-top: 20px;'></div>", unsafe_allow_html=True)
        
        # 1. User picks the position they want to fill first
        selected_pos = st.selectbox("1. SELECT POSITION TO FILL", available_positions)
        
        # 2. Filter the roster based on actual NBA positions mapped to that selection
        if selected_pos:
            allowed_nba_positions = POSITION_MAP[selected_pos]
            
            # Find players whose NBA position contains one of our allowed map values
            eligible_players_df = roster_df[roster_df['POSITION'].apply(lambda x: any(p in str(x) for p in allowed_nba_positions))]
            
            if eligible_players_df.empty:
                st.warning(f"No eligible {selected_pos}s on this roster! You have to re-spin.")
                if st.button("RE-SPIN TEAM"):
                    st.session_state.spun_team = None
                    st.rerun()
            else:
                selected_player = st.selectbox("2. DRAFT PLAYER", eligible_players_df['PLAYER'].tolist())
                
                if st.button("CONFIRM PICK"):
                    st.session_state.roster[selected_pos] = selected_player
                    st.session_state.spun_team = None
                    st.rerun()
            
    except Exception as e:
        st.error("API Error. Please try spinning again.")
        if st.button("RESET"):
            st.session_state.spun_team = None
            st.rerun()
