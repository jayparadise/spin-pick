import streamlit as st
import pandas as pd
import random
import time
import requests
from nba_api.stats.static import teams
from nba_api.stats.endpoints import commonteamroster

# --- APP CONFIG & CSS ---
st.set_page_config(page_title="Draft Showdown", layout="centered", initial_sidebar_state="collapsed")

st.markdown("""
<style>
    .stApp { background-color: #0d1117; color: #ffffff; }
    .center-text { text-align: center; font-family: 'Helvetica Neue', sans-serif; }
    .roster-card { background-color: #161b22; border-radius: 15px; padding: 25px; width: 100%; max-width: 350px; margin: 0 auto 30px auto; border: 1px solid #30363d; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .roster-header { color: #ff5722; font-weight: 800; font-size: 1.1em; margin-bottom: 20px; letter-spacing: 1px; }
    .roster-card-ai { background-color: #161b22; border-radius: 15px; padding: 25px; width: 100%; max-width: 350px; margin: 0 auto 30px auto; border: 1px solid #30363d; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .roster-header-ai { color: #00bcd4; font-weight: 800; font-size: 1.1em; margin-bottom: 20px; letter-spacing: 1px; }
    .roster-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #30363d; }
    .roster-row:last-child { border-bottom: none; }
    .pos-label { color: #6e7681; font-weight: 700; width: 40px; }
    .player-name { color: #c9d1d9; font-weight: 500; text-align: right; }
    div.stButton > button:first-child { background: linear-gradient(90deg, #ff5722 0%, #ff8a50 100%); color: white; border: none; border-radius: 12px; padding: 15px 0; font-size: 22px; font-weight: 800; letter-spacing: 2px; width: 100%; transition: all 0.2s ease-in-out; box-shadow: 0 0 15px rgba(255, 87, 34, 0.4); }
    div.stButton > button:first-child:hover { transform: scale(1.02); box-shadow: 0 0 25px rgba(255, 87, 34, 0.7); }
    .team-card { background-color: #161b22; border: 2px solid #ff5722; border-radius: 15px; padding: 20px; text-align: center; margin: 20px auto; box-shadow: 0 0 20px rgba(255, 87, 34, 0.2); }
    .team-city { color: #8b949e; font-size: 0.9em; text-transform: uppercase; }
    .team-name { color: #ffffff; font-size: 1.8em; font-weight: bold; margin-top: 5px; }
</style>
""", unsafe_allow_html=True)

# --- LEAGUE CONFIGURATIONS ---
LEAGUE_CONFIGS = {
    "NBA": {
        "positions": ["PG", "SG", "SF", "PF", "C"],
        "position_map": {"PG": ["G", "G-F", "F-G"], "SG": ["G", "G-F", "F-G"], "SF": ["F", "G-F", "F-G", "F-C", "C-F"], "PF": ["F", "F-C", "C-F"], "C": ["C", "F-C", "C-F"]},
        "live": True
    },
    "NFL": {
        "positions": ["QB", "RB", "WR1", "WR2", "TE", "DEF"],
        "position_map": {"QB": ["QB"], "RB": ["RB"], "WR1": ["WR"], "WR2": ["WR"], "TE": ["TE"], "DEF": ["DEF"]},
        "live": False
    },
    "NHL": {
        "positions": ["C", "F1", "F2", "D", "G"],
        "position_map": {"C": ["C"], "F1": ["F", "W", "LW", "RW"], "F2": ["F", "W", "LW", "RW"], "D": ["D"], "G": ["G"]},
        "live": False
    },
    "EPL": {
        "positions": ["GK", "DEF", "MID1", "MID2", "FWD1", "FWD2"],
        "position_map": {"GK": ["GK"], "DEF": ["DEF"], "MID1": ["MID"], "MID2": ["MID"], "FWD1": ["FWD"], "FWD2": ["FWD"]},
        "live": True
    },
    "MLB": {
        "positions": ["P1", "P2", "INF1", "INF2", "OF1", "OF2"],
        "position_map": {"P1": ["P", "SP", "RP"], "P2": ["P", "SP", "RP"], "INF1": ["1B", "2B", "3B", "SS"], "INF2": ["1B", "2B", "3B", "SS"], "OF1": ["OF", "LF", "CF", "RF"], "OF2": ["OF", "LF", "CF", "RF"]},
        "live": False
    }
}

# --- STATE MANAGEMENT & LEAGUE SELECTOR ---
if 'selected_league' not in st.session_state:
    st.session_state.selected_league = "NBA"

st.markdown("<h4 class='center-text' style='color:#6e7681;'>SELECT LEAGUE</h4>", unsafe_allow_html=True)
selected_league = st.selectbox("League", list(LEAGUE_CONFIGS.keys()), index=list(LEAGUE_CONFIGS.keys()).index(st.session_state.selected_league), label_visibility="collapsed")

if selected_league != st.session_state.selected_league:
    st.session_state.selected_league = selected_league
    empty_roster = {pos: "---" for pos in LEAGUE_CONFIGS[selected_league]["positions"]}
    st.session_state.roster = empty_roster.copy()
    st.session_state.ai_roster = empty_roster.copy()
    st.session_state.spun_team = None
    st.session_state.ai_draft_complete = False
    st.rerun()

if 'roster' not in st.session_state or list(st.session_state.roster.keys()) != LEAGUE_CONFIGS[st.session_state.selected_league]["positions"]:
    empty_roster = {pos: "---" for pos in LEAGUE_CONFIGS[st.session_state.selected_league]["positions"]}
    st.session_state.roster = empty_roster.copy()
    st.session_state.ai_roster = empty_roster.copy()
    st.session_state.spun_team = None
    st.session_state.ai_draft_complete = False

current_league = st.session_state.selected_league

# --- DATA FETCHING (REAL + MOCK) ---
@st.cache_data(ttl=86400)
def get_teams(league):
    if league == "NBA":
        return teams.get_teams()
    elif league == "EPL":
        url = "https://fantasy.premierleague.com/api/bootstrap-static/"
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        data = response.json()
        # Returns exact format expected by the app
        return [{"id": t['id'], "city": t['short_name'], "nickname": t['name']} for t in data['teams']]
    else:
        cities = ["New York", "Los Angeles", "Chicago", "Houston", "Miami", "Dallas", "Boston", "Seattle"]
        names = ["Strikers", "Vipers", "Knights", "Titans", "Spartans", "Rebels", "Phantoms", "Cosmos"]
        return [{"id": i, "city": cities[i%8], "nickname": f"{names[i%8]} {i}"} for i in range(1, 21)]

@st.cache_data(ttl=86400)
def get_team_roster(league, team_id):
    if league == "NBA":
        roster = commonteamroster.CommonTeamRoster(team_id=team_id).get_data_frames()[0]
        return roster[['PLAYER', 'POSITION']]
    elif league == "EPL":
        url = "https://fantasy.premierleague.com/api/bootstrap-static/"
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        data = response.json()
        
        # FPL uses integers for positions
        pos_map = {1: "GK", 2: "DEF", 3: "MID", 4: "FWD"}
        roster_data = [
            {"PLAYER": f"{p['first_name']} {p['second_name']}", "POSITION": pos_map.get(p['element_type'])}
            for p in data['elements'] if p['team'] == team_id
        ]
        return pd.DataFrame(roster_data)
    else:
        data = []
        for pos_list in LEAGUE_CONFIGS[league]["position_map"].values():
            core_pos = pos_list[0] 
            for i in range(1, 4):
                data.append({"PLAYER": f"Mock {core_pos} {team_id}-{i}", "POSITION": core_pos})
        return pd.DataFrame(data).drop_duplicates()

# --- AI DRAFT LOGIC ---
def generate_ai_draft(league, teams_list):
    positions = LEAGUE_CONFIGS[league]["positions"]
    pos_map = LEAGUE_CONFIGS[league]["position_map"]
    ai_roster = {pos: "---" for pos in positions}
    
    for pos in ai_roster.keys():
        player_drafted = False
        while not player_drafted:
            random_team = random.choice(teams_list)
            try:
                roster_df = get_team_roster(league, random_team['id'])
                allowed_api_positions = pos_map[pos]
                eligible_players_df = roster_df[roster_df['POSITION'].apply(lambda x: any(p in str(x) for p in allowed_api_positions))]
                
                if not eligible_players_df.empty:
                    ai_roster[pos] = random.choice(eligible_players_df['PLAYER'].tolist())
                    player_drafted = True
            except:
                pass
    return ai_roster

# --- APP RENDER ---
league_teams = get_teams(current_league)
p1_done = all(player != "---" for player in st.session_state.roster.values())

st.divider()

if p1_done:
    if not st.session_state.ai_draft_complete:
        with st.spinner("🤖 AI is analyzing rosters and making its picks..."):
            st.session_state.ai_roster = generate_ai_draft(current_league, league_teams)
            st.session_state.ai_draft_complete = True
            time.sleep(1.5)
        st.rerun()

    st.markdown("<h3 class='center-text' style='color:#ffffff; margin-bottom: 30px;'>FINAL MATCHUP</h3>", unsafe_allow_html=True)
    col1, col2 = st.columns(2)
    
    with col1:
        roster_html = "<div class='roster-card'><div class='roster-header'>🔴 PLAYER 1</div>"
        for pos, player in st.session_state.roster.items():
            roster_html += f"<div class='roster-row'><span class='pos-label'>{pos}</span><span class='player-name'>{player}</span></div>"
        roster_html += "</div>"
        st.markdown(roster_html, unsafe_allow_html=True)

    with col2:
        ai_html = "<div class='roster-card-ai'><div class='roster-header-ai'>🤖 AI OPPONENT</div>"
        for pos, player in st.session_state.ai_roster.items():
            ai_html += f"<div class='roster-row'><span class='pos-label'>{pos}</span><span class='player-name'>{player}</span></div>"
        ai_html += "</div>"
        st.markdown(ai_html, unsafe_allow_html=True)

    if st.button("START NEW MATCHUP"):
        empty_roster = {pos: "---" for pos in LEAGUE_CONFIGS[current_league]["positions"]}
        st.session_state.roster = empty_roster.copy()
        st.session_state.ai_roster = empty_roster.copy()
        st.session_state.spun_team = None
        st.session_state.ai_draft_complete = False
        st.rerun()
    st.stop()

# --- HEADER & ROSTER UI (WHILE DRAFTING) ---
if not LEAGUE_CONFIGS[current_league]["live"]:
    st.warning(f"⚠️ {current_league} API integration pending. Using Mock Data for UI testing.")

st.markdown("<h3 class='center-text' style='color:#ff5722; margin-bottom: 30px;'>PLAYER 1's DRAFT</h3>", unsafe_allow_html=True)

roster_html = "<div class='roster-card'><div class='roster-header'>🔴 PLAYER 1</div>"
for pos, player in st.session_state.roster.items():
    player_display = player if player else "---"
    roster_html += f"<div class='roster-row'><span class='pos-label'>{pos}</span><span class='player-name'>{player_display}</span></div>"
roster_html += "</div>"
st.markdown(roster_html, unsafe_allow_html=True)

spin_container = st.empty()

if st.session_state.spun_team is None:
    with spin_container.container():
        st.write("") 
        if st.button("SPIN"):
            for i in range(15):
                temp_team = random.choice(league_teams)
                spin_container.markdown(f"<div class='team-card' style='border-color: #30363d; box-shadow: none;'><div class='team-city'>{temp_team['city']}</div><div class='team-name'>{temp_team['nickname']}</div></div>", unsafe_allow_html=True)
                time.sleep(max(0.05, i * 0.02))
            st.session_state.spun_team = random.choice(league_teams)
            st.rerun()

else:
    team = st.session_state.spun_team
    st.markdown(f"<div class='team-card'><div class='team-city'>{team['city']}</div><div class='team-name'>{team['nickname']}</div></div>", unsafe_allow_html=True)
    
    try:
        roster_df = get_team_roster(current_league, team['id'])
        available_positions = [pos for pos, player in st.session_state.roster.items() if player == "---"]
        
        st.markdown("<div style='margin-top: 20px;'></div>", unsafe_allow_html=True)
        selected_pos = st.selectbox("1. SELECT POSITION TO FILL", available_positions)
        
        if selected_pos:
            allowed_api_positions = LEAGUE_CONFIGS[current_league]["position_map"][selected_pos]
            eligible_players_df = roster_df[roster_df['POSITION'].apply(lambda x: any(p in str(x) for p in allowed_api_positions))]
            
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
        st.error("Data Error. Please try spinning again.")
        if st.button("RESET"):
            st.session_state.spun_team = None
            st.rerun()
