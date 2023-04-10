import { useEffect, useCallback, RefObject } from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";

import * as gameHooks from "../../game/hooks";
import * as hooks from ".";
import * as atoms from "../../atoms";
import * as types from "../../types";

const peerConnections: types.PeerConnectionsDictionary = {};

export const useConnections = (objectsRef: RefObject<types.GameObject[]>) => {
  console.log("--useConnections");

  const socket = useRecoilValue(atoms.socket);
  const setOwnId = useSetRecoilState(atoms.ownId);
  const { handleQuitForObjectsOnClient } =
    gameHooks.useObjectsOnClient(objectsRef);
  const { onReceiveMain, handleQuitOnMain } = hooks.useMain(objectsRef);
  const {
    connectToSignaler,
    disconnectFromSignaler,
    registerListeners,
    unregisterListeners,
    sendSignaling,
  } = hooks.useSignaler();
  const connectToPeer = hooks.usePeerConnection(objectsRef);

  const onReceiveInit = useCallback(
    (id: string) => {
      setOwnId(id);
    },
    [setOwnId]
  );

  const onReceiveConnectToMain = useCallback(
    (remoteId: string) => {
      console.log("--on receive connect to main", remoteId);
      peerConnections[remoteId] = connectToPeer(remoteId, sendSignaling);
    },
    [connectToPeer, sendSignaling]
  );

  const onReceiveSignaling = useCallback(
    async ({ remoteId, description, candidate }: types.Signaling) => {
      console.log("--onreceive signaling:", peerConnections[remoteId]);
      const { peerConnection, handleSignaling } =
        peerConnections[remoteId] || connectToPeer(remoteId, sendSignaling);
      if (!peerConnections[remoteId]) {
        peerConnections[remoteId] = { peerConnection, handleSignaling };
      }
      handleSignaling(description, candidate);
    },
    [connectToPeer, sendSignaling]
  );

  const onReceivePeerDisconnected = useCallback((remoteId: string) => {
    peerConnections[remoteId]?.peerConnection.close();
    delete peerConnections[remoteId];
  }, []);

  useEffect(() => {
    console.log("CONNECT TO PEER CHANGE");
  }, [connectToPeer]);

  useEffect(() => {
    registerListeners(
      onReceiveInit,
      onReceiveSignaling,
      onReceiveConnectToMain,
      onReceiveMain,
      onReceivePeerDisconnected
    );
    return () => unregisterListeners();
  }, [
    unregisterListeners,
    registerListeners,
    onReceiveInit,
    onReceiveSignaling,
    onReceiveConnectToMain,
    onReceiveMain,
    onReceivePeerDisconnected,
    socket,
  ]);

  const connect = useCallback(() => {
    connectToSignaler();
  }, [connectToSignaler]);

  const disconnect = useCallback(async () => {
    handleQuitForObjectsOnClient();
    await handleQuitOnMain();
    Object.values(peerConnections).forEach((x) => x.peerConnection.close());
    disconnectFromSignaler();
    const remoteIds = Object.keys(peerConnections);
    remoteIds.forEach((x) => {
      delete peerConnections[x];
    });
    setOwnId(undefined);
  }, [
    disconnectFromSignaler,
    handleQuitForObjectsOnClient,
    handleQuitOnMain,
    setOwnId,
  ]);

  return { connect, disconnect };
};
