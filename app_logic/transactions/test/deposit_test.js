const { Note } = require("../../users/Notes");
const Deposit = require("../Deposit");

const { getKeyPair, sign } = require("starknet").ec;
const axios = require("axios");

let pk = 892352357238958237599238952357023959328058932590235235n;
let keyPair = getKeyPair(pk);

let sig = Deposit.signDeposit(
  1,
  [
    new Note(
      keyPair.getPublic(),
      12345,
      1_000_000_000,
      172841246712424128964682934234n,
      0
    ),
  ],
  pk
);

let deposit = new Deposit(
  1,
  12345,
  1000_000_000,
  keyPair.getPublic().getX().toString(),
  [
    new Note(
      keyPair.getPublic(),
      12345,
      1000_000_000,
      172841246712424128964682934234n,
      0
    ),
  ],
  sig
);

function test() {
  for (let i = 0; i < 1; i++) {
    axios
      .post(`http://localhost:4000/execute_deposit`, deposit.toGrpcObject())
      .then((res) => {
        console.log(res.data);
      });
  }
}

test();
