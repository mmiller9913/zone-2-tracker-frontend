import React from 'react';
import App from './App';
import { createRoot } from "react-dom/client";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  // <React.StrictMode>
  //   <App />
  // </React.StrictMode>,

  //if don't want to use strict mode
  //note: when using strict mode, components render twice 
  <App />
);

