import { create } from "zustand";
import { MomState } from "./types";
import { createUiSlice } from "./uiSlice";
import { createProfileSlice } from "./profileSlice";
import { createScheduleSlice } from "./scheduleSlice";
import { createLogSlice } from "./logSlice";

export type { MomState } from "./types";

export const useMomStore = create<MomState>()((...a) => ({
  ...createUiSlice(...a),
  ...createProfileSlice(...a),
  ...createScheduleSlice(...a),
  ...createLogSlice(...a),
}));
