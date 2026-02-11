import streamlit as st
import pandas as pd
import random
import time
from nba_api.stats.static import teams
from nba_api.stats.endpoints import commonteamroster

# --- APP CONFIG ---
st.set_page_config(page_title="Random Roster Showdown", page_icon="🏀")
st.title("🏀 Random Roster Showdown")
st.markdown("Spin the wheel, get a random team, and draft your starting 5 to win!")

# --- INITIALIZE SESSION STATE ---
# This keeps track of the data while the user clicks around
if 'roster' not in st.session_state:
    st.session_state.roster = {"PG": None, "SG": None, "SF": None, "PF": None, "C": None}
if 'spun_team' not in st.session_state:
    st.session_state.spun_team = None

# --- CACHED DATA FETCHING ---
@st.cache_data(ttl=86400) # Cache for 24 hours to keep the app fast
def get_nba_teams():
    return teams.get_teams()

@st.cache_data(ttl=86400)
def get_team_roster(team_id):
    # Fetch roster from NBA.com
    roster = commonteamroster.CommonTeamRoster(team_id=team_id).get_data_frames()[0]
    # Keep relevant columns: Player Name, Position
    return roster[['PLAYER', 'POSITION']]

# --- UI: CURRENT ROSTER ---
st.subheader("Your Lineup")
cols = st.columns(5)
for i, (pos, player) in enumerate(st.session_state.roster.items()):
    with cols[i]:
        st.markdown(f"**{pos}**")
        if player:
            st.success(player)
        else:
            st.warning("Empty")

st.divider()

# Check if roster is full
if all(player is not None for player in st.session_state.roster.values()):
    st.balloons()
    st.success("Draft Complete! Waiting for games to tip off to calculate fantasy points...")
    if st.button("Reset Draft"):
        st.session_state.roster = {"PG": None, "SG": None, "SF": None, "PF": None, "C": None}
        st.session_state.spun_team = None
        st.rerun()
    st.stop()

# --- UI: SPIN THE WHEEL ---
nba_teams = get_nba_teams()

if st.session_state.spun_team is None:
    if st.button("🎰 Spin for a Team!", use_container_width=True):
        with st.spinner("Spinning through all 30 NBA teams..."):
            time.sleep(1.5) # Fake suspense
            random_team = random.choice(nba_teams)
            st.session_state.spun_team = random_team
            st.rerun()
else:
    # --- UI: DRAFTING A PLAYER ---
    team = st.session_state.spun_team
    st.subheader(f"You spun the: **{team['full_name']}**")
    
    # Fetch and show the roster
    try:
        roster_df = get_team_roster(team['id'])
        st.dataframe(roster_df, hide_index=True, use_container_width=True)
        
        # Determine available positions to fill
        available_positions = [pos for pos, player in st.session_state.roster.items() if player is None]
        
        # Draft form
        with st.form("draft_form"):
            selected_player = st.selectbox("Select a Player:", roster_df['PLAYER'].tolist())
            selected_pos = st.selectbox("Fill Position:", available_positions)
            
            submitted = st.form_submit_button("Draft Player")
            if submitted:
                st.session_state.roster[selected_pos] = selected_player
                st.session_state.spun_team = None # Reset for next spin
                st.rerun()
                
    except Exception as e:
        st.error("Error fetching team data. Please try spinning again.")
        if st.button("Reset Spin"):
            st.session_state.spun_team = None
            st.rerun()
