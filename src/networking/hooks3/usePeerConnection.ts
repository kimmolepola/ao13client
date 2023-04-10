import { useCallback, RefObject } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";

import * as atoms from "../../atoms";
import * as types from "../../types";
import * as hooks from ".";

export const usePeerConnection = (
  objectsRef: RefObject<types.GameObject[]>
) => {
  console.log("--usePeerConnection");

  const main = useRecoilValue(atoms.main);

  const setConnectionMessage = useSetRecoilState(atoms.connectionMessage);
  const setChannelsOrdered = useSetRecoilState(atoms.channelsOrdered);
  const setChannelsUnordered = useSetRecoilState(atoms.channelsUnordered);
  const createRTCPeerConnection = hooks.useRTCPeerConnection();
  const createOrderedChannel = hooks.useChannelOrdered();
  const createUnorderedChannel = hooks.useChannelUnordered();
  const { onReceive: onReceiveOnMain } = hooks.useReceiveOnMain(objectsRef);
  const { onReceive: onReceiveOnClient } = hooks.useReceiveOnClient(objectsRef);

  const onChannelOrderedOpen = useCallback(
    (remoteId: string, channel: RTCDataChannel) => {
      console.log(
        "--onChannelOrderedOpen setChannelsOrdered:",
        remoteId,
        channel
      );
      setChannelsOrdered((x) => [...x, { remoteId, channel }]);
    },
    [setChannelsOrdered]
  );

  const onChannelOrderedClosed = useCallback(
    (remoteId: string) => {
      setChannelsOrdered((x) => x.filter((xx) => xx.remoteId !== remoteId));
    },
    [setChannelsOrdered]
  );

  const onChannelUnorderedOpen = useCallback(
    (remoteId: string, channel: RTCDataChannel) => {
      console.log(
        "--onChannelUnorderedOpen setChannelsUnordered:",
        remoteId,
        channel
      );
      setChannelsUnordered((x) => [...x, { remoteId, channel }]);
    },
    [setChannelsUnordered]
  );

  const onChannelUnorderedClosed = useCallback(
    (remoteId: string) => {
      setChannelsUnordered((x) => x.filter((xx) => xx.remoteId !== remoteId));
    },
    [setChannelsUnordered]
  );

  const connectToPeer = useCallback(
    (remoteId: string, sendSignaling: (x: types.Signaling) => void) => {
      console.log("--connect to peer", remoteId);
      console.log("--main:", main);
      setConnectionMessage(`connecting with peer ${remoteId}`);
      console.log("peer", remoteId, "connecting");
      const { peerConnection, handleSignaling } = createRTCPeerConnection(
        remoteId,
        sendSignaling
      );
      if (main) {
        console.log("--connectToPeer yes main");
        createOrderedChannel(
          remoteId,
          peerConnection,
          onReceiveOnMain,
          onChannelOrderedOpen,
          onChannelOrderedClosed
        );
        createUnorderedChannel(
          remoteId,
          peerConnection,
          onReceiveOnMain,
          onChannelUnorderedOpen,
          onChannelUnorderedClosed
        );
      } else {
        console.log("--connectToPeer not main yes client");
        createOrderedChannel(
          remoteId,
          peerConnection,
          onReceiveOnClient,
          onChannelOrderedOpen,
          onChannelOrderedClosed
        );
        createUnorderedChannel(
          remoteId,
          peerConnection,
          onReceiveOnClient,
          onChannelUnorderedOpen,
          onChannelUnorderedClosed
        );
      }
      return { peerConnection, handleSignaling };
    },
    [
      main,
      setConnectionMessage,
      createRTCPeerConnection,
      createOrderedChannel,
      createUnorderedChannel,
      onReceiveOnMain,
      onReceiveOnClient,
      onChannelOrderedOpen,
      onChannelOrderedClosed,
      onChannelUnorderedOpen,
      onChannelUnorderedClosed,
    ]
  );

  return connectToPeer;
};
