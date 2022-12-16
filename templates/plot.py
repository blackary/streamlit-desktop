import pandas as pd
import streamlit as st

st.title(":bar_chart: Show me your moves! ")
st.write("Graphical, my dear watson :male-detective:")

df = pd.DataFrame({"a": [1, 2, 3], "b": [2, 5, 10], "c": [3, 2, 1]})

t1, t2, t3 = st.tabs(["Lines", "Bars", "Areas"])
with t1:
    st.subheader("I'm a-line! :chart_with_upwards_trend:")
    st.line_chart(df)
with t2:
    st.subheader("Meet me at the bar! :bar_chart:")
    st.bar_chart(df)
with t3:
    st.subheader("Area-nah Grande :microphone:")
    st.area_chart(df)
st.write("# :boom: :boom: :boom: :boom: :boom:")
