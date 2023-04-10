import { useCallback } from "react";
import { useSetRecoilState } from "recoil";

import * as atoms from "../../atoms";
import * as types from "../../types";
import * as hooks from ".";

export const useRTCPeerConnection = () => {
  console.log("--useRTCPeerConnection");

  const setConnectionMessage = useSetRecoilState(atoms.connectionMessage);
  const { iceServers } = hooks.useIceServers();

  const createRTCPeerConnection = useCallback(
    (remoteId: string, sendSignaling: (x: types.Signaling) => void) => {
      console.log("--createRTCPeerConnection, iceServers:", iceServers);
      const peerConnection = new RTCPeerConnection({ iceServers }); // , iceTransportPolicy: 'relay'

      peerConnection.onconnectionstatechange = () => {
        switch (peerConnection.connectionState) {
          case "failed":
            setConnectionMessage(`peer ${remoteId}, connection failed`);
            console.log("peer", remoteId, "peer connection failed");
            break;
          case "connected":
            setConnectionMessage(`peer ${remoteId}, connection ready`);
            console.log("peer", remoteId, "peer connection ready");
            break;
          case "closed":
            setConnectionMessage(`peer ${remoteId}, connection closed`);
            console.log("peer", remoteId, "peer connection closed");
            break;
          default:
            break;
        }
      };

      peerConnection.onicecandidate = ({ candidate }) => {
        console.log("--onicecandidate sendSignaling");
        sendSignaling({ remoteId, candidate });
      };

      peerConnection.onnegotiationneeded = async () => {
        console.log("--onnegotiationneeded");
        try {
          console.log("--setLocalDescription, sendSignaling");
          await peerConnection.setLocalDescription();
          sendSignaling({
            remoteId,
            description: peerConnection.localDescription,
          });
          console.log("--setLocalDescription, sendSignaling done");
        } catch (err) {
          console.error(err);
        }
      };

      const handleSignaling = async (
        description: RTCSessionDescription | null | undefined,
        candidate: RTCIceCandidate | null | undefined
      ) => {
        try {
          if (description) {
            console.log("--setRemoteDescription");
            await peerConnection.setRemoteDescription(description);
            if (description.type === "offer") {
              console.log("--onOffer, setLocalDescription, sendSignaling");
              await peerConnection.setLocalDescription();
              sendSignaling({
                remoteId,
                description: peerConnection.localDescription,
              });
              console.log("--onOffer, done");
            }
          } else if (candidate) {
            console.log("--onCandidate, addIceCandidate");
            await peerConnection.addIceCandidate(candidate);
          }
        } catch (err) {
          console.error(err);
        }
      };

      return { peerConnection, handleSignaling };
    },
    [setConnectionMessage, iceServers]
  );

  return createRTCPeerConnection;
};
