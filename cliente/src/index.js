import { BrowserRouter, Routes, Route } from "react-router-dom";
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'bootstrap/dist/css/bootstrap.css';
import PantallaEleccion from "./Components/PantallaEleccion";
import Partida from "./Components/Partida";
import { Provider } from "react-redux";
import store from "./store";
import PantallaFinal from "./Components/PantallaFinal";
import Header from "./Components/Header";


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<PantallaEleccion />}>
          </Route>
          <Route path="partida" element={<Partida />} />
          <Route path="pantalla-final" element={<PantallaFinal />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  </React.StrictMode >
);

