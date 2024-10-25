import os
import joblib
import pandas as pd 
import numpy as np 
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split

df = pd.read_csv('/machine_learning/dataset/WaTime_Dataset.csv', sep=',')

X = df.drop('soil_moisture',axis=1)
y = np.array(df['soil_moisture'])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=100)
model.fit(X_train, y_train)
y_pred = model.predict(pd.DataFrame(X_test, columns=X_train.columns))


joblib.dump(model, 'randomForestModel.joblib')

