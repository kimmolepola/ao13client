import { useEffect } from "react";
import { useRecoilValue } from "recoil";

import Game from "./game";
import Frontpage from "./frontpage";

import * as frontpageHooks from "./frontpage/hooks";
import * as atoms from "./atoms";

const App = () => {
  console.log("--address:", window.location);
  console.log("--App");
  const page = useRecoilValue(atoms.page);
  const { loadSavedUser } = frontpageHooks.useAuth();

  useEffect(() => {
    loadSavedUser();
  }, [loadSavedUser]);

  return page === "frontpage" ? <Frontpage /> : <Game />;
};

export default App;
