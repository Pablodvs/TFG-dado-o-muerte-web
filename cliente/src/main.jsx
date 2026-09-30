import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import './i18n';
import App from './App';
import store from './store';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Provider store={store}>
            {/* Sin Suspense ni carga perezosa, las transiciones solo retrasarían el cambio de pantalla */}
            <BrowserRouter useTransitions={false}>
                <App />
            </BrowserRouter>
        </Provider>
    </React.StrictMode>,
);
