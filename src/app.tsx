import { Link, Route, } from "wouter";
import { Header, Footer, Game} from "./components/_index";
import { Fragment } from 'preact';
import "./App.css";

export const App = () => (
  <>
    <Header/>
        {/* <!-- Page content here --> */}
        {/* <Route path="/newgame" element={<Navigate to="/" />} /> */}
        <Route path="/">
          <Game/>
        </Route>
    <Footer/>
  </>
);
