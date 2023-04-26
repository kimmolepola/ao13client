import { io, Socket } from "socket.io-client";
import { useSetRecoilState, useRecoilValue } from "recoil";

import { backendUrl } from "src/config";
import { state, peerConnections } from "src/globals";
import { useReceiveOnClient } from "./useReceiveOnClient";
import { useReceiveOnMain } from "./useReceiveOnMain";
import * as gameHooks from "src/game/hooks";
import * as hooks from ".";
import * as atoms from "src/atoms";
import * as types from "src/types";
import * as globals from "src/globals";

let socket: (Socket & { auth: { [key: string]: any } }) | undefined;

export const useConnection = () => {
  const user = useRecoilValue(atoms.user);
  const setMain = useSetRecoilState(atoms.main);
  const setConnectionMessage = useSetRecoilState(atoms.connectionMessage);
  const setConnectedAmount = useSetRecoilState(atoms.connectedAmount);
  const { handleRemoveIdOnClient, handleQuitForObjectsOnClient } =
    gameHooks.useObjectsOnClient();
  const {
    handleQuitForObjectsOnMain,
    handleRemoveIdOnMain,
    handleNewIdOnMain,
  } = gameHooks.useObjectsOnMain();
  const { iceServers } = hooks.useIceServers();
  const { onReceive: onReceiveOnMain } = useReceiveOnMain();
  const { onReceive: onReceiveOnClient } = useReceiveOnClient();

  const closePeerConnection = (peerConnection: types.PeerConnection) => {
    peerConnection.orderedChannel.close();
    peerConnection.unorderedChannel.close();
    peerConnection.peerConnection.close();
  };

  const removePeer = (remoteId: string) => {
    const index = peerConnections.findIndex((x) => x.remoteId === remoteId);
    if (index !== -1) {
      closePeerConnection(peerConnections[index]);
      peerConnections.splice(index, 1);
    }
  };

  const handleConnectedAmount = () => {
    setConnectedAmount(
      peerConnections.reduce(
        (acc, cur) =>
          cur.orderedChannel.readyState === "open" &&
          cur.unorderedChannel.readyState === "open"
            ? acc + 1
            : acc,
        0
      )
    );
  };

  const handleChannelOpen = (remoteId: string) => {
    if (state.main) {
      handleNewIdOnMain(remoteId);
      setConnectionMessage(remoteId + " connected");
    } else {
      setConnectionMessage("Connected to host");
    }
    handleConnectedAmount();
  };

  const handleChannelClosed = (remoteId: string) => {
    if (state.main) {
      handleRemoveIdOnMain(remoteId);
      setConnectionMessage(remoteId + " disconnected");
    } else {
      handleRemoveIdOnClient(remoteId);
      setConnectionMessage("Disconnected from host");
    }
    removePeer(remoteId);
    handleConnectedAmount();
  };

  const createPeerConnection = (remoteId: string) => {
    setConnectionMessage(
      state.main ? remoteId + " connecting..." : "Connecting to host..."
    );
    const peerConnection = new RTCPeerConnection({ iceServers });
    const orderedChannel = peerConnection.createDataChannel("ordered", {
      ordered: true,
      negotiated: true,
      id: 0,
    });
    const unorderedChannel = peerConnection.createDataChannel("unordered", {
      ordered: false,
      negotiated: true,
      id: 1,
    });
    orderedChannel.onopen = () => {
      unorderedChannel.readyState === "open" && handleChannelOpen(remoteId);
    };
    unorderedChannel.onopen = () => {
      orderedChannel.readyState === "open" && handleChannelOpen(remoteId);
    };
    orderedChannel.onclose = () => {
      handleChannelClosed(remoteId);
    };
    unorderedChannel.onclose = () => {
      handleChannelClosed(remoteId);
    };
    orderedChannel.onmessage = ({ data }: { data: string }) => {
      const d = JSON.parse(data);
      state.main ? onReceiveOnMain(remoteId, d) : onReceiveOnClient(d);
    };
    unorderedChannel.onmessage = ({ data }: { data: string }) => {
      const d = JSON.parse(data);
      state.main ? onReceiveOnMain(remoteId, d) : onReceiveOnClient(d);
    };
    peerConnection.onicecandidate = ({ candidate }) => {
      socket?.emit("signaling", { remoteId, candidate });
    };
    peerConnection.onnegotiationneeded = async () => {
      try {
        await peerConnection.setLocalDescription();
        socket?.emit("signaling", {
          remoteId,
          description: peerConnection.localDescription,
        });
      } catch (err) {
        console.error(err);
      }
    };
    peerConnections.push({
      remoteId,
      peerConnection,
      orderedChannel,
      unorderedChannel,
    });
  };

  const peerConnectionHandleSignaling = async (
    remoteId: string,
    description: RTCSessionDescription | undefined,
    candidate: RTCIceCandidate | undefined
  ) => {
    const peerConnection = peerConnections.find(
      (x) => x.remoteId === remoteId
    )?.peerConnection;
    if (peerConnection) {
      try {
        if (description) {
          await peerConnection.setRemoteDescription(description);
          if (description.type === "offer") {
            await peerConnection.setLocalDescription();
            socket?.emit("signaling", {
              remoteId,
              description: peerConnection.localDescription,
            });
          }
        } else if (candidate) {
          await peerConnection.addIceCandidate(candidate);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const disconnect = async () => {
    state.main
      ? await handleQuitForObjectsOnMain()
      : handleQuitForObjectsOnClient();
    state.main = false;
    socket?.disconnect();
    socket?.off("connect");
    socket?.off("disconnect");
    socket?.off("init");
    socket?.off("main");
    socket?.off("connectToMain");
    socket?.off("signaling");
    socket = undefined;
    peerConnections.forEach((x) => closePeerConnection(x));
    peerConnections.splice(0, peerConnections.length);
    globals.state.ownId = undefined;
    setMain(false);
  };

  const connect = async () => {
    await disconnect();
    socket = io(backendUrl, {
      auth: {
        token: `${user?.token}`,
      },
    });

    socket?.on("connect", () => {
      setConnectionMessage("Connected to signaling server");
      console.log("Signaling socket connected");
    });

    socket?.on("init", (id: string) => {
      globals.state.ownId = id;
    });

    socket?.on("main", (id: string) => {
      setConnectionMessage("You are the game host");
      state.main = true;
      setMain(true);
      handleNewIdOnMain(id);
    });

    socket?.on("connectToMain", (remoteId: string) => {
      peerConnections.forEach((x) => closePeerConnection(x));
      peerConnections.splice(0, peerConnections.length);
      createPeerConnection(remoteId);
    });

    socket?.on(
      "signaling",
      ({
        id: remoteId,
        description,
        candidate,
      }: {
        id: string;
        description?: RTCSessionDescription;
        candidate?: RTCIceCandidate;
      }) => {
        !peerConnections.some((x) => x.remoteId === remoteId) &&
          createPeerConnection(remoteId);
        peerConnectionHandleSignaling(remoteId, description, candidate);
      }
    );

    socket?.on("disconnect", () => {
      setConnectionMessage("Disconnected from signaling server");
      console.log("Signaling socket disconnected");
      disconnect();
    });
  };

  return { connect, disconnect };
};
