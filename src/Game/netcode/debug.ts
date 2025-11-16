import * as globals from "src/globals";
import { debugOn } from "../components/UserInterface/Sidepanel/Header";
// import * as netcodeGlobals from "./globals";

export const debug = (stateSequenceNumber: number) => {
  console.log("Received state sequance number:", stateSequenceNumber);
  // console.log("RecentStates:", netcodeGlobals.recentStates);
  console.log("GameServer:", globals.gameServer);
  setTimeout(async () => {
    globals.gameServer.connection?.peerConnection
      .getStats(null)
      .then((stats) => {
        let selected_firefox;
        let selectedCandidatePairId: string;
        let transportReport: any;
        const candidatePairs: any[] = [];

        stats.forEach((report) => {
          if (report.type === "candidate-pair" && report.selected) {
            selected_firefox = report;
          }
          if (report.type === "transport") {
            selectedCandidatePairId = report.selectedCandidatePairId;
            transportReport = report;
          }
          if (report.type === "candidate-pair") {
            candidatePairs.push(report);
          }
          console.log("Report:", report.type, report);
        });

        const selectedCandidatePair =
          selected_firefox ||
          candidatePairs.find((x) => x.id === selectedCandidatePairId);

        const local = stats.get(selectedCandidatePair.localCandidateId);
        const remote = stats.get(selectedCandidatePair.remoteCandidateId);

        console.log("Local candidate:", local);
        console.log("Remote candidate:", remote);

        console.log("Local protocol:", local?.protocol);
        console.log("Remote protocol:", remote?.protocol);
        console.log("Remote candidate type:", remote?.candidateType); // 'host', 'srflx', 'relay'

        if (remote?.candidateType === "relay") {
          console.log("Using TURN relay");
        } else {
          console.log("Not using TURN relay");
        }

        console.log("Relay protocol:", transportReport?.relayProtocol);
        console.log("Transport protocol:", transportReport?.protocol); // 'udp' or 'tcp'
      });
  });
};

export const debugNoRecentObjectState = (
  idIsProvided: boolean,
  idOverNetwork: number,
  index: number
) => {
  debugOn.value &&
    console.error(
      "No recentObjectState, idIsProvided:",
      idIsProvided,
      "idOverNetwork:",
      idOverNetwork,
      "index:",
      index
    );
};

export const debugDifferenceSignificance = (
  variableName: string,
  differenceSignificance: number
) => {
  debugOn.value &&
    console.error(
      "DifferenceSignificance:",
      variableName,
      differenceSignificance
    );
};
