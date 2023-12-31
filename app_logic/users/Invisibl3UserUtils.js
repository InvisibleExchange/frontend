const bigInt = require("big-integer");
const { pedersen, computeHashOnElements } = require("../helpers/pedersen");
const { getKeyPair, sign } = require("starknet").ec;

const { trimHash } = require("./Notes.js");
const {
  fetchStoredPosition,
  fetchStoredNotes,
  storePrivKey,
} = require("../helpers/firebaseConnection");

/* global BigInt */

async function fetchNoteData(keyPairs, privateSeed) {
  // priv keys that don't point to a note stored in the database
  let emptyPrivKeys = [];
  //{token1: [note1,...,noteN],...,tokenN: ...]}
  let noteData = {};
  let notePrivKeys = {}; // {addr : privKey}

  let error;
  let promises = keyPairs.map((keyPair) => {
    let addr = keyPair.getPublic();
    let privKey = BigInt(keyPair.getPrivate());

    let blinding = _generateNewBliding(addr.getX(), privateSeed);

    return fetchStoredNotes(addr.getX().toString(), blinding)
      .then((notes_) => {
        if (!notes_ || notes_.length == 0) {
          emptyPrivKeys.push(privKey);

          return;
        }

        if (noteData[notes_[0].token]) {
          noteData[notes_[0].token].push(notes_[0]);
        } else {
          noteData[notes_[0].token] = [notes_[0]];
        }

        for (let j = 1; j < notes_.length; j++) {
          noteData[notes_[j].token].push(notes_[j]);
        }

        notePrivKeys[BigInt(addr.getX())] = privKey;
      })
      .catch((err) => {
        error = err;
      });
  });

  await Promise.all(promises);

  return { emptyPrivKeys, noteData, notePrivKeys, error };
}

async function fetchPositionData(addressData) {
  let emptyPositionPrivKeys = [];
  let positionData = {};
  let posPrivKeys = {};

  let error;
  let promises = addressData.map((address) => {
    let addr = address.address;
    let privKey = BigInt(address.pk);

    return fetchStoredPosition(addr.getX().toString())
      .then((positions) => {
        if (!positions || positions.length == 0) {
          emptyPositionPrivKeys.push(privKey);
          return;
        }

        if (positionData[positions[0].position_header.synthetic_token]) {
          positionData[positions[0].position_header.synthetic_token].push(
            positions[0]
          );
        } else {
          positionData[positions[0].position_header.synthetic_token] = [
            positions[0],
          ];
        }

        for (let j = 1; j < positions.length; j++) {
          positionData[positions[j].position_header.synthetic_token].push(
            positions[j]
          );
        }

        posPrivKeys[BigInt(addr.getX())] = privKey;
      })
      .catch((err) => {
        error = err;
      });
  });

  await Promise.all(promises);

  return { emptyPositionPrivKeys, positionData, posPrivKeys, error };
}

// *
function signMarginChange(
  direction,
  marginChange,
  notesIn,
  refundNote,
  closeOrderFields,
  position,
  positionPrivKey
) {
  if (direction == "Add") {
    let hashInputs = notesIn.map((note) => note.note.hash);
    hashInputs.push(refundNote ? refundNote.hash : 0n);
    hashInputs.push(position.hash);

    let hash = computeHashOnElements(hashInputs);

    let privKeySum = notesIn.reduce((acc, note) => {
      return acc + note.privKey;
    }, 0n);

    let keyPair = getKeyPair(privKeySum);

    let sig = sign(keyPair, hash.toString(16));

    return sig;
  } else {
    const P = 2n ** 251n + 17n * 2n ** 192n + 1n;
    let changeAmount = P - BigInt(Math.abs(marginChange));

    let hashInputs = [changeAmount, closeOrderFields.hash(), position.hash];

    let hash = computeHashOnElements(hashInputs);

    let keyPair = getKeyPair(positionPrivKey);

    let sig = sign(keyPair, hash.toString(16));

    return sig;
  }
}

// ! CRYPTO HELPERS
function _subaddressPrivKeys(privSpendKey, privViewKey, randSeed) {
  // //ksi = ks + H(kv, i)
  // //kvi = kv + H(ks, i)

  const ksi = trimHash(pedersen([privSpendKey, randSeed]), 240);
  const kvi = trimHash(pedersen([privViewKey, randSeed]), 240);

  return { ksi, kvi };
}

function _oneTimeAddressPrivKey(Kvi, ks, count) {
  // ko = H(count , Kvi.x) + ks
  let h = trimHash(pedersen([count, BigInt(Kvi.getX())]), 240);

  return h + ks;
}

// Each output of a transaction should have this hiding
function _hideValuesForRecipient(Ko, amount, privateSeed) {
  // Todo: should replace Ko with Kv so someone can reveal their trades without revealing their private keys
  // r is the transaction priv key (randomly generated)
  // yt = H("comm_mask", H(rKv, t))  (NOTE: t is used to make the values unique and we are omitting it for now)
  // amount_t = bt XOR8 yt -> (where bt is the 64 bit amount of the note)

  //todo: might add an index to the blinding like:
  //todo|    - yt0 = H(Ko.X, privateSeed)
  //todo|    - yt1 = H(yto, 1), yt2 = H(yt1, 2), yt3 = H(yt2, 3), ...
  //todo| this allows as to create different blindings for two notes with the same address

  let yt = pedersen([BigInt(Ko.getX()), privateSeed]); // this is the blinding used in the commitment

  // Todo: Should adjust the amount to be at least 40-50 bits
  // ! If the amount is less than 40 bits then the first 20+ bits of the blinding are revealed
  // ! Either that or trim blinding to less bits
  let hash8 = trimHash(yt, 64);
  let hiddentAmount = bigInt(amount).xor(hash8).value;

  return { yt, hiddentAmount };
}

function _generateNewBliding(Ko, privateSeed) {
  let yt = pedersen([BigInt(Ko), privateSeed]);

  return yt;
}

function _revealHiddenValues(Ko, privateSeed, hiddentAmount, commitment) {
  let yt = pedersen([BigInt(Ko.getX()), privateSeed]);
  let hash8 = trimHash(yt, 64);
  let bt = bigInt(hiddentAmount).xor(hash8).value;

  if (pedersen([bt, yt]) != commitment) {
    throw "Invalid amount and blinding";
  }

  return { yt, bt };
}

function _checkOwnership(Ks, Kv, Ko, kv, token, count) {
  let { _, kvi } = _subaddressPrivKeys(0, kv, token);
  let Kvi = getKeyPair(kvi.toString(16)).getPublic();

  // Todo: finsih this function
}

async function handlePfrNoteData(
  userId,
  pfrKey,
  privateSeed,
  noteData,
  notePrivKeys
) {
  let pfrAddress = getKeyPair(pfrKey).getPublic().getX();
  let blinding = _generateNewBliding(pfrAddress, privateSeed);
  await fetchStoredNotes(pfrAddress, blinding).then((notes) => {
    if (notes && notes.length) {
      let token = notes[0].token;
      if (!noteData[token]) {
        noteData[token] = [];
      }
      noteData[token].push(...notes);
      notePrivKeys[pfrAddress] = pfrKey;

      storePrivKey(userId, pfrKey, false);
    }
  });
}

module.exports = {
  _subaddressPrivKeys,
  _oneTimeAddressPrivKey,
  _generateNewBliding,
  _hideValuesForRecipient,
  _revealHiddenValues,
  _checkOwnership,
  fetchNoteData,
  fetchPositionData,
  signMarginChange,
  handlePfrNoteData,
};

// & The generation of addresses
// User generates Ks and Kv as the original private public key pair (useful for revealing his history if necessary)

// Generates Kvi view key subaddresses for each token along with corresponding priv_keys (ksi)

// Generate a one time address for a note as such:
// count = num of notes/addresses generated for this token (used as the txR - making the addresses unique)
// Ko = H(count, Kvi)G + Ks

// & To prove ownership one needs: Ks, Kv, Ko, and kv:
// - first generate the Kvi with Kv,kv for that token
// - then generate Ks' = Ko - H(count, Kvi)G
// - check if Ks' == Ks

// & To find your own notes for token X:
// get Kvi
// addresses = []

// for i in NUM_TRADES:
// 	Ko = H(i, Kvi) + Ks
// 	addresses.append(Ko)

// loop over all notes onchain:
// 	check if note.address is in addresses:
// 		if so then its yours
