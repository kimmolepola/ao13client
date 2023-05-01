import { useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useRecoilState, useSetRecoilState, useRecoilValue } from "recoil";

import { backendUrl } from "src/config";
import { state, peerConnections } from "src/globals";
import { useReceiveOnClient } from "./useReceiveOnClient";
import { useReceiveOnMain } from "./useReceiveOnMain";
import * as clientHooks from "src/Game/Client/hooks";
import * as serverHooks from "src/Game/Server/hooks";
import * as atoms from "src/atoms";
import * as types from "src/types";
import * as globals from "src/globals";

let socket: (Socket & { auth: { [key: string]: any } }) | undefined;

export const useConnection = () => {
  const user = useRecoilValue(atoms.user);
  const iceServers = useRecoilValue(atoms.iceServers);
  const [main, setMain] = useRecoilState(atoms.main);
  const setConnectionMessage = useSetRecoilState(atoms.connectionMessage);
  const setConnectedAmount = useSetRecoilState(atoms.connectedAmount);
  const {
    handleRemoveId: handleRemoveIdOnClient,
    handleQuit: handleQuitForObjectsOnClient,
  } = clientHooks.useObjects();
  const {
    handleQuitForObjects: handleQuitForObjectsOnMain,
    handleRemoveId: handleRemoveIdOnMain,
    handleNewId: handleNewIdOnMain,
  } = serverHooks.useObjects(main);
  const { onReceive: onReceiveOnMain } = useReceiveOnMain();
  const { onReceive: onReceiveOnClient } = useReceiveOnClient();

  const closePeerConnection = useCallback(
    (peerConnection: types.PeerConnection) => {
      peerConnection.orderedChannel.close();
      peerConnection.unorderedChannel.close();
      peerConnection.peerConnection.close();
    },
    []
  );

  const removePeer = useCallback(
    (remoteId: string) => {
      const index = peerConnections.findIndex((x) => x.remoteId === remoteId);
      if (index !== -1) {
        closePeerConnection(peerConnections[index]);
        peerConnections.splice(index, 1);
      }
    },
    [closePeerConnection]
  );

  const handleConnectedAmount = useCallback(() => {
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
  }, [setConnectedAmount]);

  const handleChannelOpen = useCallback(
    (remoteId: string) => {
      if (state.main) {
        handleNewIdOnMain(remoteId);
        setConnectionMessage(remoteId + " connected");
      } else {
        setConnectionMessage("Connected to host");
      }
      handleConnectedAmount();
    },
    [handleConnectedAmount, handleNewIdOnMain, setConnectionMessage]
  );

  const handleChannelClosed = useCallback(
    (remoteId: string) => {
      if (state.main) {
        handleRemoveIdOnMain(remoteId);
        setConnectionMessage(remoteId + " disconnected");
      } else {
        handleRemoveIdOnClient(remoteId);
        setConnectionMessage("Disconnected from host");
      }
      removePeer(remoteId);
      handleConnectedAmount();
    },
    [
      handleConnectedAmount,
      handleRemoveIdOnClient,
      handleRemoveIdOnMain,
      removePeer,
      setConnectionMessage,
    ]
  );

  const createPeerConnection = useCallback(
    (remoteId: string) => {
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
    },
    [
      iceServers,
      handleChannelClosed,
      handleChannelOpen,
      onReceiveOnClient,
      onReceiveOnMain,
      setConnectionMessage,
    ]
  );

  const peerConnectionHandleSignaling = useCallback(
    async (
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
    },
    []
  );

  const disconnect = useCallback(async () => {
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
  }, [
    closePeerConnection,
    handleQuitForObjectsOnClient,
    handleQuitForObjectsOnMain,
    setMain,
  ]);

  const connect = useCallback(async () => {
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
  }, [
    user?.token,
    closePeerConnection,
    createPeerConnection,
    disconnect,
    handleNewIdOnMain,
    peerConnectionHandleSignaling,
    setConnectionMessage,
    setMain,
  ]);

  return { connect, disconnect };
};
