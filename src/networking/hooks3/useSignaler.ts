import { useCallback } from "react";
import { io } from "socket.io-client";
import { useRecoilState, useSetRecoilState, useRecoilValue } from "recoil";

import { backendUrl } from "src/config";
import * as atoms from "../../atoms";
import * as types from "../../types";

// let socket: undefined | Socket & { auth: { [key: string]: any } };

export const useSignaler = () => {
  console.log("---useSignaler");

  const user = useRecoilValue(atoms.user);
  const setConnectionMessage = useSetRecoilState(atoms.connectionMessage);
  const [socket, setSocket] = useRecoilState(atoms.socket);

  console.log("--backendUrl:", backendUrl);

  const connectToSignaler = useCallback(() => {
    console.log("--connectToSignaler, auth.token:", user?.token);
    const s = io(backendUrl, {
      auth: {
        token: `${user?.token}`,
      },
    });
    setSocket(s);
  }, [user?.token, setSocket]);

  const registerListeners = useCallback(
    (
      onReceiveInit: (id: string) => void,
      onReceiveSignaling: (x: types.Signaling) => void,
      onReceiveConnectToMain: (remoteId: string) => void,
      onReceiveMain: (id: string) => void,
      onReceivePeerDisconnected: (remoteId: string) => void
    ) => {
      console.log("--socket, register:", socket);
      socket?.on("connect_error", (err: any) => {
        console.error(err);
      });

      socket?.on("connect", () => {
        setConnectionMessage("signaling socket connected");
        console.log("CONNECT signaling socket connected");
      });

      socket?.on("disconnect", () => {
        setConnectionMessage("signaling socket disconnected");
        console.log("signaling socket disconnected");
      });

      socket?.on("nomain", () => {
        setConnectionMessage(
          "game host disconnected, no other available hosts found, please try again later"
        );
        console.log("game host disconnected");
      });

      socket?.on("fail", (reason: any) => {
        console.log("signaling socket fail, reason:", reason);
      });

      socket?.on("init", (id: string) => {
        onReceiveInit(id);
        console.log("own id:", id);
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
          onReceiveSignaling({ remoteId, description, candidate });
        }
      );

      socket?.on("connectToMain", (remoteId: string) => {
        onReceiveConnectToMain(remoteId);
      });

      socket?.on("main", (id: string) => {
        onReceiveMain(id);
        console.log("you are main");
      });

      socket?.on("peerDisconnected", (remoteId: any) => {
        onReceivePeerDisconnected(remoteId);
        setConnectionMessage(`peer ${remoteId} disconnected`);
        console.log("peer", remoteId, "disconnected");
      });
    },
    [setConnectionMessage, socket]
  );

  const unregisterListeners = useCallback(() => {
    socket?.off("connect_error");
    socket?.off("connect");
    socket?.off("disconnect");
    socket?.off("nomain");
    socket?.off("fail");
    socket?.off("init");
    socket?.off("signaling");
    socket?.off("connectToMain");
    socket?.off("main");
    socket?.off("peerDisconnected");
  }, [socket]);

  const disconnectFromSignaler = useCallback(() => {
    unregisterListeners();
    socket?.disconnect();
  }, [unregisterListeners, socket]);

  const sendSignaling = useCallback(
    ({ remoteId, description, candidate }: types.Signaling) => {
      socket?.emit("signaling", { remoteId, candidate, description });
    },
    [socket]
  );

  return {
    connectToSignaler,
    disconnectFromSignaler,
    registerListeners,
    unregisterListeners,
    sendSignaling,
  };
};
