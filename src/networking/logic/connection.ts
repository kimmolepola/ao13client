import { Dispatch, MutableRefObject, SetStateAction } from "react";
import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";
import { backendUrl } from "src/config";
import * as globals from "src/globals";
import {
  handleReceiveBaseState,
  handleQuit as handleQuitForObjects,
  handleReceiveState,
} from "src/Game/logic/objects";
import * as types from "src/types";
import { onReceiveStringData, onReceiveState } from "./receive";

const peerConnectionHandleSignaling = async (
  msg: types.Msg,
  hubConnection: HubConnection
) => {
  const { id, type } = msg;
  const pr = globals.gameServer.connection?.peerConnection;
  if (pr) {
    try {
      if (type !== "candidate") {
        await pr.setRemoteDescription({
          sdp: msg.description,
          type,
        });
        if (type === "offer") {
          await pr.setLocalDescription();
          hubConnection.send("signaling", {
            id,
            type: pr.localDescription?.type,
            description: pr.localDescription?.sdp,
          });
        }
      } else if (type === "candidate") {
        await pr.addIceCandidate({
          candidate: msg.candidate,
          sdpMid: msg.mid,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
};

const createPeerConnection = (
  remoteId: string,
  iceServers: types.IceServerInfo[] | undefined,
  hubConnection: HubConnection,
  onChangeConnectionMessage: (value: string | undefined) => void,
  onChangeIsConnectedToGameServer: (value: boolean) => void,
  onChangeObjectIds: (value: string[]) => void,
  setChatMessages: Dispatch<SetStateAction<types.ChatMessage[]>>
) => {
  console.log("--create");
  onChangeConnectionMessage("Connecting to server...");
  const peerConnection = new RTCPeerConnection({
    iceServers,
    iceTransportPolicy: "relay",
  });

  peerConnection.onconnectionstatechange = () => {
    console.log("Connection state change:", peerConnection.connectionState);
  };

  peerConnection.ondatachannel = (event: RTCDataChannelEvent) => {
    console.log("On data channel:", event.channel.label);
  };

  const stringChannel = peerConnection.createDataChannel("string-reliable", {
    ordered: true,
    id: 0,
  });
  const ackChannel = peerConnection.createDataChannel("ack-reliable", {
    ordered: true,
    id: 1,
  });
  const controlsChannel = peerConnection.createDataChannel(
    "controls-unreliable",
    { ordered: false, id: 2, maxRetransmits: 0 }
  );
  const stateChannel = peerConnection.createDataChannel("state-unreliable", {
    ordered: false,
    id: 3,
    maxRetransmits: 0,
  });

  stringChannel.onopen = () => {
    onChangeConnectionMessage("Connected to game server");
    onChangeIsConnectedToGameServer(true);
    console.log("Connected to game server");
  };

  stringChannel.onclose = () => {
    onChangeConnectionMessage("Disconnected from game server");
    onChangeIsConnectedToGameServer(false);
    console.log("Disconnected from game server");
  };

  stringChannel.onmessage = ({ data }: { data: string }) => {
    try {
      const d = JSON.parse(data);
      onReceiveStringData(
        d,
        handleReceiveBaseState,
        onChangeObjectIds,
        setChatMessages
      );
    } catch (err) {
      console.log("String channel onmessage error:", data);
    }
  };
  ackChannel.binaryType = "arraybuffer";
  controlsChannel.binaryType = "arraybuffer";
  stateChannel.binaryType = "arraybuffer";
  stateChannel.onmessage = ({ data }: { data: ArrayBuffer }) => {
    onReceiveState(data, handleReceiveState);
  };

  peerConnection.onicecandidate = ({ candidate }) => {
    candidate &&
      hubConnection.send("signaling", {
        id: remoteId,
        type: "candidate",
        candidate: candidate.candidate,
        mid: candidate.sdpMid,
      });
  };
  peerConnection.onnegotiationneeded = async () => {
    try {
      await peerConnection.setLocalDescription();
      hubConnection.send("signaling", {
        id: remoteId,
        type: peerConnection.localDescription?.type,
        description: peerConnection.localDescription?.sdp,
      });
    } catch (err) {
      console.error(err);
    }
  };
  globals.gameServer.connection = {
    peerConnection,
    stringChannel,
    ackChannel,
    controlsChannel,
    stateChannel,
    remoteId,
  };
};

const closePeerConnection = (peerConnection?: types.ConnectionObject) => {
  peerConnection?.stringChannel?.close();
  peerConnection?.ackChannel?.close();
  peerConnection?.controlsChannel?.close();
  peerConnection?.stateChannel?.close();
  peerConnection?.peerConnection.close();
};

enum HubConnectionMethodName {
  Disconnect = "disconnect",
  Init = "init",
  ServerError = "serverError",
  Signaling = "signaling",
}

export const handleDisconnect = async (
  hubConnection: HubConnection | undefined,
  onChangeObjectIds: (value: string[]) => void,
  onChangeConnectionMessage: (value: string | undefined) => void,
  onChangeIsConnectedToGameServer: (value: boolean) => void
) => {
  handleQuitForObjects(onChangeObjectIds);
  await hubConnection?.stop();
  hubConnection?.off(HubConnectionMethodName.Disconnect);
  hubConnection?.off(HubConnectionMethodName.Init);
  hubConnection?.off(HubConnectionMethodName.ServerError);
  hubConnection?.off(HubConnectionMethodName.Signaling);
  closePeerConnection(globals.gameServer.connection);
  globals.gameServer.connection = undefined;
  globals.state.ownId = undefined;
  onChangeConnectionMessage("Disconnected from signaling server");
  onChangeIsConnectedToGameServer(false);
  console.log("Signaling socket disconnected");
};

export const createOrUpdateHubConnection = (
  hubConnectionRef: MutableRefObject<HubConnection | undefined>,
  iceServers: types.IceServerInfo[] | undefined,
  onChangeObjectIds: (value: string[]) => void,
  onChangeConnectionMessage: (value: string | undefined) => void,
  onChangeIsConnectedToGameServer: (value: boolean) => void,
  setChatMessages: Dispatch<SetStateAction<types.ChatMessage[]>>
) => {
  if (!hubConnectionRef.current) {
    hubConnectionRef.current = new HubConnectionBuilder()
      .withUrl(backendUrl + "/api/v1/hub", {
        accessTokenFactory: () => globals.accessToken.value || "",
      })
      .build();

    hubConnectionRef.current.start().catch((err) => {
      console.error(err);
    });
  }

  const hubConnection = hubConnectionRef.current;

  hubConnection.off(HubConnectionMethodName.Disconnect);
  hubConnection.on(HubConnectionMethodName.Disconnect, () => {
    onChangeConnectionMessage("Disconnecting from signaling server");
    console.log("Signaling socket disconnecting");
    handleDisconnect(
      hubConnection,
      onChangeObjectIds,
      onChangeConnectionMessage,
      onChangeIsConnectedToGameServer
    );
  });

  hubConnection.off(HubConnectionMethodName.Init);
  hubConnection.on(HubConnectionMethodName.Init, (id: string) => {
    onChangeConnectionMessage("Connected to signaling server");
    console.log("Signaling socket connected");
    globals.state.ownId = id;
    createPeerConnection(
      "server",
      iceServers,
      hubConnection,
      onChangeConnectionMessage,
      onChangeIsConnectedToGameServer,
      onChangeObjectIds,
      setChatMessages
    );
  });

  hubConnection.off(HubConnectionMethodName.ServerError);
  hubConnection.on(HubConnectionMethodName.ServerError, () => {
    onChangeConnectionMessage("Server error. Disconnecting...");
    console.log("Server error. Disconnecting...");
    handleDisconnect(
      hubConnection,
      onChangeObjectIds,
      onChangeConnectionMessage,
      onChangeIsConnectedToGameServer
    );
  });

  hubConnection.off(HubConnectionMethodName.Signaling);
  hubConnection.on(HubConnectionMethodName.Signaling, (msg: types.Msg) => {
    msg.id &&
      !globals.gameServer.connection &&
      createPeerConnection(
        msg.id,
        iceServers,
        hubConnection,
        onChangeConnectionMessage,
        onChangeIsConnectedToGameServer,
        onChangeObjectIds,
        setChatMessages
      );
    peerConnectionHandleSignaling(msg, hubConnection);
  });

  return hubConnection;
};
