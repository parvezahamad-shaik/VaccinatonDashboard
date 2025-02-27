import scipy
from flask import Flask, render_template, jsonify
import pandas as pd
from sklearn import preprocessing
from sklearn.cluster import KMeans
from sklearn.manifold import MDS
from sklearn.preprocessing import StandardScaler

def mds_correlation(temp_data):
    correlation_matrix = temp_data.corr()
    mds_corr_matrix = 1 - correlation_matrix.abs()
    model = MDS(n_components=2, dissimilarity='precomputed', random_state=1)
    mds_out = model.fit_transform(mds_corr_matrix)
    return mds_out

data = pd.read_csv("static/data/Vaccination.csv")
val_columns = ["Dose 1%","Dose 2%",
    "Booster Percentage","Metro Counties","Non Metro Counties","Literacy Rate","Total Cases","Active Cases",
    "Total Deaths","Total Tests","Tests Per Million","Population","Pfizer %","Moderna %",
     "J&J %","Unknown Vaccine %"]

categoric_features = ["State", "Abbr"]
data.drop(categoric_features, inplace=True, axis=1)

scaler = StandardScaler()
scaled_data = pd.DataFrame(scaler.fit_transform(data), columns=data.columns)
correlated_computed_data = mds_correlation(scaled_data)

flask_data = dict()

mds_cx = list(correlated_computed_data[:, 0])
mds_cy = list(correlated_computed_data[:, 1])

flask_data["mds_cx"] = mds_cx
flask_data["mds_cy"] = mds_cy

# flask_data["columns"] = list(scaled_data.columns)
flask_data["columns"] = val_columns

app = Flask(__name__)
@app.route('/')
def index_html_render():
    return render_template("index.html",data= flask_data)


if __name__ == '__main__':
    app.run("localhost", 1234, debug=True)