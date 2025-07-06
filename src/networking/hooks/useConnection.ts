import { useRef, useCallback } from "react";
import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";
// import { io, Socket } from "socket.io-client";
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

// let socket: (Socket & { auth: { [key: string]: any } }) | undefined;

export const useConnection = () => {
  // const socketRef = useRef<
  //   (Socket & { auth: { [key: string]: any } }) | undefined
  // >();
  const socketRef = useRef<HubConnection | undefined>();
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
      peerConnection.orderedChannel?.close();
      peerConnection.unorderedChannel?.close();
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
          cur.orderedChannel?.readyState === "open" &&
          cur.unorderedChannel?.readyState === "open"
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
      const peerConnection = new RTCPeerConnection({
        iceServers,
        iceTransportPolicy: "relay",
      });
      peerConnection.addTransceiver("audio", { direction: "recvonly" });

      peerConnection.onconnectionstatechange = () => {
        console.log("Connection state change:", peerConnection.connectionState);
      };

      peerConnection.ondatachannel = (event: RTCDataChannelEvent) => {
        console.log("--ondatachannel", event.channel.label);
      };

      const orderedChannel = peerConnection.createDataChannel("ordered", {
        ordered: true,
        // negotiated: true,
        id: 0,
      });
      const unorderedChannel = peerConnection.createDataChannel("unordered", {
        ordered: false,
        // negotiated: true,
        id: 1,
      });

      orderedChannel.onopen = () => {
        console.log("--ordered open");
        unorderedChannel.readyState === "open" && handleChannelOpen(remoteId);
        setInterval(() => {
          if (orderedChannel.readyState === "open") {
            console.log("--ping orderedChannel");
            orderedChannel.send("ping");
          }
        }, 30000);
      };
      unorderedChannel.onopen = () => {
        console.log("--unordered open");
        orderedChannel.readyState === "open" && handleChannelOpen(remoteId);
      };
      orderedChannel.onclose = () => {
        console.log("--ordered close");
        handleChannelClosed(remoteId);
      };
      unorderedChannel.onclose = () => {
        handleChannelClosed(remoteId);
      };
      orderedChannel.onmessage = ({ data }: { data: string }) => {
        try {
          const d = JSON.parse(data);
          state.main ? onReceiveOnMain(remoteId, d) : onReceiveOnClient(d);
        } catch (err) {
          console.log("--catch:", data);
        }
      };
      unorderedChannel.onmessage = ({ data }: { data: string }) => {
        const d = JSON.parse(data);
        state.main ? onReceiveOnMain(remoteId, d) : onReceiveOnClient(d);
      };

      peerConnection.onicecandidate = ({ candidate }) => {
        console.log("--onicecandidate:", candidate);
        const socket = socketRef.current;
        // socket?.send("signaling", { remoteId, candidate });
        candidate &&
          socket?.send("signaling", {
            // remoteId,
            // candidate,
            id: remoteId,
            type: "candidate",
            candidate: candidate.candidate,
            mid: candidate.sdpMid,
          });
        socket?.send("signalingx", "peerConnection.onicecandidate");
        console.log("--signalingx", "peerConnection.onicecandidate", remoteId);
      };
      peerConnection.onnegotiationneeded = async () => {
        console.log("--onnegotiationneeded");
        try {
          await peerConnection.setLocalDescription();
          const socket = socketRef.current;
          socket?.send("signaling", {
            // remoteId,
            // description: peerConnection.localDescription,
            id: remoteId,
            type: peerConnection.localDescription?.type,
            description: peerConnection.localDescription?.sdp,
          });
          socket?.send("signalingx", "peerConnection.onnegotiationneeded");
          console.log(
            "--signalingx",
            "peerConnection.onnegotiationneeded",
            remoteId
          );
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

  type RTCSdpType = "answer" | "offer" | "pranswer" | "rollback";
  type Msg =
    | {
        id: string;
        type: RTCSdpType;
        description: string;
      }
    | {
        id: string;
        type: "candidate";
        candidate: string;
        mid: string;
      };

  const peerConnectionHandleSignaling = useCallback(async (msg: Msg) => {
    const { id, type } = msg;
    const peerConnection = peerConnections.find(
      (x) => x.remoteId === id
    )?.peerConnection;
    if (peerConnection) {
      try {
        if (type !== "candidate") {
          await peerConnection.setRemoteDescription({
            // sdp: description.sdp,
            sdp: msg.description,
            type,
          });
          if (type === "offer") {
            await peerConnection.setLocalDescription();
            const socket = socketRef.current;
            socket?.send("signaling", {
              // remoteId: idx,
              // description: peerConnection.localDescription,
              id,
              type: peerConnection.localDescription?.type,
              description: peerConnection.localDescription?.sdp,
            });
            socket?.send("signalingx", "peerConnection.setRemoteDescription");
            console.log(
              "--signalingx",
              "peerConnection.setRemoteDescription",
              id
            );
          }
        } else if (type === "candidate") {
          await peerConnection.addIceCandidate({
            // candidate: candidate.candidate,
            candidate: msg.candidate,
            // sdpMid: candidate.sdpMid,
            sdpMid: msg.mid,
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const disconnect = useCallback(async () => {
    state.main
      ? await handleQuitForObjectsOnMain()
      : handleQuitForObjectsOnClient();
    state.main = false;
    const socket = socketRef.current;
    // socket?.send("DisconnectClient");

    await socket?.stop();
    socket?.off("connect");
    socket?.off("disconnect");
    socket?.off("init");
    socket?.off("main");
    socket?.off("connectToMain");
    socket?.off("signaling");
    socket?.off("signalingx");
    socketRef.current = undefined;
    peerConnections.forEach((x) => closePeerConnection(x));
    peerConnections.splice(0, peerConnections.length);
    globals.state.ownId = undefined;
    setMain(false);
    setConnectionMessage("Disconnected from signaling server");
    console.log("Signaling socket disconnected");
  }, [
    closePeerConnection,
    handleQuitForObjectsOnClient,
    handleQuitForObjectsOnMain,
    setMain,
    setConnectionMessage,
  ]);

  const connect = useCallback(async () => {
    console.log("--await getUserMedia");
    try {
      await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    } catch (err) {
      console.log("getUserMedia err:", err);
    }
    console.log("--await getUserMedia resolved");
    // await disconnect(true);
    // socketRef.current = io(backendUrl, {
    //   auth: {
    //     token: `${user?.token}`,
    //   },
    // });
    console.log("--user?.token:", user?.token);
    socketRef.current = new HubConnectionBuilder()
      .withUrl(backendUrl + "/api/v1/hub", {
        accessTokenFactory: () => user?.token || "",
      })
      .build();

    const socket = socketRef.current;

    socket?.start().catch((err) => document.write(err));

    socket?.on("serverError", () => {
      setConnectionMessage("Server error. Disconnecting...");
      console.log("Server error. Disconnecting...");
      disconnect();
    });

    socket?.on("init", (id: string) => {
      setConnectionMessage("Connected to signaling server");
      console.log("Signaling socket connected");
      globals.state.ownId = id;
      createPeerConnection("server");
    });

    // socket?.on("main", (id: string) => {
    //   console.log("--main");
    //   setConnectionMessage("You are the game host");
    //   state.main = true;
    //   setMain(true);
    //   handleNewIdOnMain(id);
    // });

    // socket?.on("connectToMain", (remoteId: string) => {
    //   console.log("--connect to main. main: ", remoteId);
    //   peerConnections.forEach((x) => closePeerConnection(x));
    //   peerConnections.splice(0, peerConnections.length);
    //   createPeerConnection(remoteId);
    // });

    socket?.on("signaling", (msg: Msg) => {
      console.log("--signaling received:", msg.id, msg.type);
      msg.id &&
        !peerConnections.some((x) => x.remoteId === msg.id) &&
        createPeerConnection(msg.id);
      peerConnectionHandleSignaling(msg);
    });

    socket?.on("disconnect", () => {
      setConnectionMessage("Disconnecting from signaling server");
      console.log("Signaling socket disconnecting");
      disconnect();
    });
  }, [
    user?.token,
    createPeerConnection,
    disconnect,
    peerConnectionHandleSignaling,
    setConnectionMessage,
  ]);

  return { connect, disconnect };
};
