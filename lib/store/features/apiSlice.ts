import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const apiSlice = createSlice({
  name: "features",
  initialState: {
    tradeType: { name: "Perpetual" },
  },
  reducers: {
    setSelectTradeType: (state: any, action) => {
      state.tradeType = action.payload;
    },
  },
});

export const { setSelectTradeType } = apiSlice.actions;

export const tradeTypeSelector = (state: any) => state.features.tradeType;

export default apiSlice.reducer;
