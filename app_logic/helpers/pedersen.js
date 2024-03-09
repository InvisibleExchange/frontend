// Import the Rust-generated WebAssembly package

// const {
//   pedersen_on_vec_binding,
//   pedersen_binding,
// } = require("../../pedersen_pkg/starknet");

const { poseidonHash, poseidonHashMany } = require("@scure/starknet");

function pedersen(vec2) {
  // let h = pedersen_binding(vec2[0].toString(), vec2[1].toString());

  let h = poseidonHash(BigInt(vec2[0].toString()), BigInt(vec2[1].toString()));

  return BigInt(h);
}

function computeHashOnElements(arr) {
  //   let h = pedersen_on_vec_binding(arr.map((x) => x.toString()));

  let h = poseidonHashMany(arr.map((x) => BigInt(x.toString())));

  return BigInt(h);
}

module.exports = { pedersen, computeHashOnElements };
