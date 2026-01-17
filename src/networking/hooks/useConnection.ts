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
  onChangeObjectIds: (value: string[]) => void,
  onChangeStaticObjects: (value: types.BaseStateStaticObject[]) => void
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
        setChatMessages,
        onChangeStaticObjects
      );
      hubConnectionRef.current = hubConnection;
    }
  }, [
    iceServers,
    onChangeObjectIds,
    onChangeConnectionMessage,
    onChangeIsConnectedToGameServer,
    setChatMessages,
    onChangeStaticObjects,
  ]);

  const disconnect = useCallback(async () => {
    await handleDisconnect(
      hubConnectionRef.current,
      onChangeObjectIds,
      onChangeConnectionMessage,
      onChangeIsConnectedToGameServer,
      onChangeStaticObjects
    );
    hubConnectionRef.current = undefined;
  }, [
    onChangeObjectIds,
    onChangeConnectionMessage,
    onChangeIsConnectedToGameServer,
    onChangeStaticObjects,
  ]);

  return { disconnect };
};
