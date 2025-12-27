import { getUser } from "../services/user";
import * as types from "../../types";

export const refreshUser = async (
  onChangeUser: (value: types.User | undefined) => void
) => {
  const { data } = await getUser();
  data && onChangeUser(data);
};
