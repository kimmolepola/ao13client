import { useEffect } from "react";
import { useRecoilValue } from "recoil";

import Game from "./Game";
import Frontpage from "./Frontpage";

import * as frontpageHooks from "./Frontpage/hooks";
import * as atoms from "./atoms";

const App = () => {
  const page = useRecoilValue(atoms.page);
  const { loadSavedUser } = frontpageHooks.useAuth();

  useEffect(() => {
    loadSavedUser();
  }, [loadSavedUser]);

  return page === "frontpage" ? <Frontpage /> : <Game />;
};

export default App;
