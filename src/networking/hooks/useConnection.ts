import {
  useEffect,
  Dispatch,
  SetStateAction,
  useRef,
  useCallback,
} from "react";
import { HubConnection } from "@microsoft/signalr";

import { resetMostRecentSequenceNumber } from "../logic/receive";
import { initializeState } from "../../Game/netcode/state";
import {
  createOrUpdateHubConnection,
  handleDisconnect,
} from "../logic/connection";
import * as types from "src/types";

export const useConnection = (
  iceServers: types.IceServerInfo[] | undefined,
  onChangeConnectionMessage: (value: string | undefined) => void,
  onChangeIsConnectedToGameServer: (value: boolean) => void,
  setChatMessages: Dispatch<SetStateAction<types.ChatMessage[]>>,
  onChangeObjectIds: (value: string[]) => void
) => {
  const hubConnectionRef = useRef<HubConnection>();

  useEffect(() => {
    initializeState();
    resetMostRecentSequenceNumber();
  }, []);

  useEffect(() => {
    if (iceServers) {
      const hubConnection = createOrUpdateHubConnection(
        hubConnectionRef,
        iceServers,
        onChangeObjectIds,
        onChangeConnectionMessage,
        onChangeIsConnectedToGameServer,
        setChatMessages
      );
      hubConnectionRef.current = hubConnection;
    }
  }, [
    iceServers,
    onChangeObjectIds,
    onChangeConnectionMessage,
    onChangeIsConnectedToGameServer,
    setChatMessages,
  ]);

  const disconnect = useCallback(async () => {
    await handleDisconnect(
      hubConnectionRef.current,
      onChangeObjectIds,
      onChangeConnectionMessage,
      onChangeIsConnectedToGameServer
    );
    hubConnectionRef.current = undefined;
  }, [
    onChangeObjectIds,
    onChangeConnectionMessage,
    onChangeIsConnectedToGameServer,
  ]);

  return { disconnect };
};
