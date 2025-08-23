import { Route, Switch} from "wouter";
import { Header, Footer, Dashboard } from "./components/_index";
import { Reactle, Battleship, Tic_Tac_Toe, Dots_And_Boxes } from "./components/games/_index"
import { Fragment } from 'preact';
import "./App.css";

export const App = () => (
  <>
    <Header/>
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
    <Footer/>
  </>
);
