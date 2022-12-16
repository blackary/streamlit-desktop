# Import python packages
import numpy as np
import pandas as pd
import streamlit as st

# Write directly to the app
st.title("Example Streamlit-Desktop App :balloon:")

st.write(
    """Replace this example with your own code!
    **And if you're new to Streamlit,** check
    out our easy-to-follow guides at
    [docs.streamlit.io](https://docs.streamlit.io).
    """
)

# Use an interactive slider to get user input
hifives_val = st.slider(
    "Number of votes :hand:",
    min_value=0,
    max_value=90,
    value=60,
    help="Use this to enter the number of high-fives you gave in Q3",
)
sql_data = pd.DataFrame(np.random.randint(10, size=(10, 3)) * 10)
sql_data.columns = [f"Votes for {i}" for i in range(1, 4)]

# Create a simple bar chart
# See docs.streamlit.io for more types of charts
st.subheader("Number of votes :white_check_mark:")
st.bar_chart(data=sql_data)

st.subheader("Underlying data :bar_chart:")
st.table(sql_data)
