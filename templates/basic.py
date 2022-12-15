import datetime

import numpy as np
import pandas as pd
import streamlit as st

st.title("Even basic apps can be :fire:")

choices = ["😀", "😁", "🤣", "😃", "😄", "😅", "😆", "😉", "😊", "😋", "😎", "😍", "😘", "😗"]

select = st.button("Random Face!")

if select:
    st.title(np.random.choice(choices, 1).tolist()[0])

ts = pd.DataFrame(
    np.random.randn(1000, 3), index=pd.date_range("1/1/2000", periods=1000)
)

time = datetime.datetime.now()

st.metric("Current Time", str(time))

ts = ts.cumsum()

tab1, tab2, tab3 = st.tabs(["Time Series", "T2 (rules)", "T3"])

with tab1:
    st.write("Some stuff")
    st.write("# Some serious time series :watch:")
    st.line_chart(ts)
with tab2:
    st.write("The middle tab!")
    st.write("# This one is THE BEST")
with tab3:
    st.write("Another tab???")
    st.write("# You better believe it")

num = st.slider("Select number", 1, 10, 3)

df = pd.DataFrame(
    np.random.randn(num, 2) / [50, 50] + [37.76, -122.4], columns=["lat", "lon"]
)

st.map(df)
