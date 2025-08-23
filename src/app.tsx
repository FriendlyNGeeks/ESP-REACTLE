import { Route, Switch} from "wouter";
import { Header, Footer, Dashboard } from "./components/_index";
import { Reactle, Battleship, Tic_Tac_Toe, Dots_And_Boxes } from "./components/games/_index"
import { Fragment } from 'preact';
import "./App.css";


export const App = () => (
  <div className="drawer">
    <input id="main-drawer" type="checkbox" className="drawer-toggle" />
    <div className="drawer-content flex flex-col min-h-screen">
      <Header />
      <div className="flex-1">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/reactle" component={Reactle} />
          <Route path="/battleship" component={Battleship} />
          <Route path="/tic-tac-toe" component={Tic_Tac_Toe} />
          <Route path="/dots-and-boxes" component={Dots_And_Boxes} />
          <Route>
            {() => <div className="text-center text-red-600 text-xl mt-10">Page not found</div>}
          </Route>
        </Switch>
      </div>
      <Footer />
    </div>
    <div className="drawer-side">
      <label htmlFor="main-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
      <ul className="menu bg-base-200 min-h-full w-80 p-4">
        <li><button className="btn btn-xs sm:btn-sm md:btn-md lg:btn-lg xl:btn-xl"><a href="/">Dashboard</a></button></li>
        <li><a href="/dots-and-boxes">Dots and Boxes</a></li>
        <li><a href="/battleship">Battleship</a></li>
        <li><a href="/tic-tac-toe">Tic-Tac-Toe</a></li>
        <li><a href="/reactle">Reactle</a></li>
      </ul>
    </div>
  </div>
);
