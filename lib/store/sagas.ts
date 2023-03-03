import { all } from "redux-saga/effects";
import apiSaga from "./features/apiSaga";

export default function* rootSaga() {
  yield all([apiSaga()]);
}
