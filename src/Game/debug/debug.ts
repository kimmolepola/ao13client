import * as globals from "src/globals";
// import * as netcodeGlobals from "./globals";
import * as state from "../netcode/state";
import * as types from "../../types";
import GUI from "lil-gui";
import * as THREE from "three";

export const debugOn = { value: false };

let debugGuiIsEnabled = false;
let gui: GUI | null = null;
const camRot = {
  pitch: 0, // rotate around camera X
  yaw: 0, // rotate around camera Y
  roll: 0, // rotate around camera Z
};

const last = { pitch: 0, yaw: 0, roll: 0 };
function updateCamera(camera: THREE.Camera) {
  const dp = camRot.pitch - last.pitch;
  const dy = camRot.yaw - last.yaw;
  const dr = camRot.roll - last.roll;
  camera.rotateX(dp);
  camera.rotateY(dy);
  camera.rotateZ(dr);
  last.pitch = camRot.pitch;
  last.yaw = camRot.yaw;
  last.roll = camRot.roll;
}

const createGUI = (camera: THREE.Camera) => {
  gui = new GUI();
  const cameraFolder = gui.addFolder("Camera");
  cameraFolder.add(camera.position, "x", -10000, 10000);
  cameraFolder.add(camera.position, "y", -10000, 10000);
  cameraFolder.add(camera.position, "x", -10, 10);
  cameraFolder.add(camera.position, "y", -10, 10);
  cameraFolder.add(camera.position, "z", 0, 10);
  cameraFolder
    .add(camRot, "pitch", -Math.PI / 2, Math.PI / 2)
    .onChange(() => updateCamera(camera));
  cameraFolder
    .add(camRot, "yaw", -Math.PI, Math.PI)
    .onChange(() => updateCamera(camera));
  cameraFolder
    .add(camRot, "roll", -Math.PI, Math.PI)
    .onChange(() => updateCamera(camera));

  cameraFolder.open();
};

const removeGUI = () => {
  gui?.reset();
  gui?.destroy();
};

const handleObjects = () => {
  globals.remoteObjects.forEach((x) =>
    x.object3d?.material.forEach((xx: any, i) => {
      xx.wireframe = i !== 4 && debugOn.value;
      xx.needsUpdate = i !== 4 && debugOn.value;
    })
  );
};

export const handleDebugGui = (camera: THREE.Camera) => {
  if (debugOn.value && !debugGuiIsEnabled) {
    debugGuiIsEnabled = true;
    createGUI(camera);
    handleObjects();
  } else if (!debugOn.value && debugGuiIsEnabled) {
    debugGuiIsEnabled = false;
    removeGUI();
    handleObjects();
  }
};

export const receiveState = (data: ArrayBuffer) => {
  !debugOn.value && (statistics.outOfSequence = 0);
  debugOn.value && (statistics.bytes = data.byteLength);
};

export const statistics = {
  bytes: 0,
  objects: 0,
  outOfSequence: 0,
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

export const debug = (stateSequenceNumber: number) => {
  if (!debugOn.value) return;
  console.log("RemoteGameObjects:", globals.remoteObjects);
  console.log("Received state sequence number:", stateSequenceNumber);
  console.log("RecentStates:", state.getRecentStateForDebug());
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

export const debugSaveState = (updateObject: types.UpdateObject) => {
  if (!debugOn.value) return;
  console.log("SaveState:", updateObject);
};
