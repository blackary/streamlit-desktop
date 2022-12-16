import datetime
import numpy as np
import pandas as pd
import streamlit as st

# Welcome to Streamlit! Pick a face, any face...
st.title("Even basic apps can be :fire:")
choices = ["😀", "😁", "🤣", "😃", "😄", "😅", "😆", "😉", "😊", "😋", "😎", "😍", "😘", "😗"]

select = st.button("Random Face!")

if select:
    st.title(np.random.choice(choices, 1).tolist()[0])

time = datetime.datetime.now().strftime("%m/%d/%y")
st.metric("Current Time", time)

# Cumulative sum
ts = pd.DataFrame(
    np.random.randn(1000, 3), index=pd.date_range("1/1/2000", periods=1000)
)
ts = ts.cumsum()

st.write("# Some serious time series :watch:")
st.line_chart(ts)

num = st.slider("Select number of points", 1, 10, 3)

# Create a map!
df = pd.DataFrame(
    np.random.randn(num, 2) / [50, 50] + [37.76, -122.4], columns=["lat", "lon"]
)
st.map(df)
