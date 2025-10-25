import { useRef, useCallback } from "react";
import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";
import { useSetRecoilState, useRecoilValue } from "recoil";

import { backendUrl } from "src/config";
import { gameServer } from "src/globals";
import { useReceive } from "./useReceive";
import * as clientHooks from "src/Game/hooks";
import * as atoms from "src/atoms";
import * as types from "src/types";
import * as globals from "src/globals";

export const useConnection = () => {
  const socketRef = useRef<HubConnection | undefined>();
  const user = useRecoilValue(atoms.user);
  const iceServers = useRecoilValue(atoms.iceServers);
  const setConnectionMessage = useSetRecoilState(atoms.connectionMessage);
  const setIsConnectedToGameServer = useSetRecoilState(
    atoms.isConnectedToGameServer
  );
  const { handleQuit: handleQuitForObjects } = clientHooks.useObjects();
  const {
    onReceiveReliable,
    onReceiveReliableBinary,
    onReceiveUnreliableBinary,
  } = useReceive();

  const closePeerConnection = useCallback(
    (peerConnection: types.PeerConnection) => {
      peerConnection.reliableChannel?.close();
      peerConnection.reliableChannelBinary?.close();
      peerConnection.unreliableChannelBinary?.close();
      peerConnection.peerConnection.close();
    },
    []
  );

  const createPeerConnection = useCallback(
    (remoteId: string) => {
      setConnectionMessage("Connecting to server...");
      const peerConnection = new RTCPeerConnection({
        iceServers,
        iceTransportPolicy: "relay",
      });
      peerConnection.addTransceiver("audio", { direction: "recvonly" });

      peerConnection.onconnectionstatechange = () => {
        console.log("Connection state change:", peerConnection.connectionState);
      };

      peerConnection.ondatachannel = (event: RTCDataChannelEvent) => {
        console.log("On data channel:", event.channel.label);
      };

      const reliableChannel = peerConnection.createDataChannel("reliable", {
        ordered: true,
        // negotiated: true,
        id: 0,
      });
      const reliableChannelBinary = peerConnection.createDataChannel(
        "reliable-binary",
        {
          ordered: true,
          // negotiated: true,
          id: 2,
        }
      );
      const unreliableChannelBinary = peerConnection.createDataChannel(
        "unreliable-binary",
        {
          ordered: false,
          // negotiated: true,
          id: 1,
          maxRetransmits: 0,
        }
      );

      reliableChannel.onopen = () => {
        setConnectionMessage("Connected to game server");
        setIsConnectedToGameServer(true);
        console.log("Connected to game server");
      };

      reliableChannel.onclose = () => {
        setConnectionMessage("Disconnected from game server");
        setIsConnectedToGameServer(false);
        console.log("Disconnected from game server");
      };

      reliableChannel.onmessage = ({ data }: { data: string }) => {
        try {
          const d = JSON.parse(data);
          onReceiveReliable(d);
        } catch (err) {
          console.log("Ordered channel onmessage error:", data);
        }
      };
      reliableChannelBinary.binaryType = "arraybuffer";
      reliableChannelBinary.onmessage = ({ data }: { data: ArrayBuffer }) => {
        onReceiveReliableBinary(data);
      };
      unreliableChannelBinary.binaryType = "arraybuffer";
      unreliableChannelBinary.onmessage = ({ data }: { data: ArrayBuffer }) => {
        onReceiveUnreliableBinary(data);
      };

      peerConnection.onicecandidate = ({ candidate }) => {
        const socket = socketRef.current;
        candidate &&
          socket?.send("signaling", {
            id: remoteId,
            type: "candidate",
            candidate: candidate.candidate,
            mid: candidate.sdpMid,
          });
      };
      peerConnection.onnegotiationneeded = async () => {
        try {
          await peerConnection.setLocalDescription();
          const socket = socketRef.current;
          socket?.send("signaling", {
            id: remoteId,
            type: peerConnection.localDescription?.type,
            description: peerConnection.localDescription?.sdp,
          });
        } catch (err) {
          console.error(err);
        }
      };
      gameServer.connection = {
        peerConnection,
        reliableChannel,
        reliableChannelBinary,
        unreliableChannelBinary,
        remoteId,
      };
    },
    [
      iceServers,
      setConnectionMessage,
      setIsConnectedToGameServer,
      onReceiveReliable,
      onReceiveReliableBinary,
      onReceiveUnreliableBinary,
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
    const pr = gameServer.connection?.peerConnection;
    if (pr) {
      try {
        if (type !== "candidate") {
          await pr.setRemoteDescription({
            sdp: msg.description,
            type,
          });
          if (type === "offer") {
            await pr.setLocalDescription();
            const socket = socketRef.current;
            socket?.send("signaling", {
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
  }, []);

  const disconnect = useCallback(async () => {
    handleQuitForObjects();
    const socket = socketRef.current;
    await socket?.stop();
    socket?.off("connect");
    socket?.off("disconnect");
    socket?.off("init");
    socket?.off("main");
    socket?.off("connectToMain");
    socket?.off("signaling");
    socket?.off("signalingx");
    socketRef.current = undefined;
    gameServer.connection && closePeerConnection(gameServer.connection);
    gameServer.connection = undefined;
    globals.state.ownId = undefined;
    setConnectionMessage("Disconnected from signaling server");
    setIsConnectedToGameServer(false);
    console.log("Signaling socket disconnected");
  }, [
    closePeerConnection,
    handleQuitForObjects,
    setConnectionMessage,
    setIsConnectedToGameServer,
  ]);

  const connect = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    } catch (err) {
      console.log("getUserMedia err:", err);
    }
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

    socket?.on("signaling", (msg: Msg) => {
      msg.id && !gameServer.connection && createPeerConnection(msg.id);
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
