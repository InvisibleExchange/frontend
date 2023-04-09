const { Note } = require("../../users/Notes");
const Deposit = require("../Deposit");

const { getKeyPair, sign } = require("starknet").ec;
const axios = require("axios");
const LimitOrder = require("../LimitOrder");

let pk = 892352357238958237599238952357023959328058932590235235n;
let keyPair = getKeyPair(pk);

let note1 = new Note(
  keyPair.getPublic(),
  12345,
  1_000_000_000,
  172841246712424128964682934234n,
  0
);
let note2 = new Note(
  keyPair.getPublic(),
  55555,
  1_000_000_000,
  172841246712424128964682934234n,
  0
);

let addr = keyPair.getPublic();
let order = new LimitOrder(
  37842732353252,
  12345,
  55555,
  1_000_000_000,
  1_000_000_000,
  1_000_000,
  addr,
  124214412,
  124124124124,
  [note1],
  null
);
order.signOrder([pk]);

let order2 = new LimitOrder(
  37842732353252,
  12345,
  55555,
  1_000_000_000,
  1_000_000_000,
  1_000_000,
  addr,
  124214412,
  124124124124,
  [note1],
  null
);
order2.signOrder([pk]);

console.log("sending order");
console.time("orders");
let counter = 0;
for (let i = 0; i < 100; i++) {
  axios
    .post(`http://localhost:4000/submit_limit_order`, order.toGrpcObject())
    .then((res) => {
      //   console.log(res.data);
      counter++;
      if (counter == 200) {
        console.timeEnd("orders");
      }
    });
}

for (let i = 0; i < 100; i++) {
  axios
    .post(`http://localhost:4000/submit_limit_order`, order2.toGrpcObject())
    .then((res) => {
      //   console.log(res.data);
      counter++;
      if (counter == 200) {
        console.timeEnd("orders");
      }
    });
}
