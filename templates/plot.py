import pandas as pd
import streamlit as st

st.title("Let's see some :bar_chart:")
st.write("Some charts")

df = pd.DataFrame({"a": [1, 2, 3], "b": [2, 5, 10]})
st.line_chart(df)
st.write("# :boom: :boom: :boom: :boom: :boom:")
st.bar_chart(df)
