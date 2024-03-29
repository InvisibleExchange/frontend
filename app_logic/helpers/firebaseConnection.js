const { db } = require("./firebase/firebaseConfig.js");
const {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  where,
  query,
  orderBy,
  limit,
} = require("firebase/firestore");

const bigInt = require("big-integer");

const { Note, trimHash } = require("../users/Notes.js");
const { pedersen } = require("./pedersen.js");

const { ec } = require("starknet").ec; //require("starknet/utils/ellipticCurve.js");

const BN = require("bn.js");
// TODO: fetch deposit ids on login and remove them if they've been used

/* global BigInt */

async function getAddressIndexes(address) {
  const querySnapshot = await getDocs(
    collection(db, `addr2idx/addresses/${address}`)
  );

  if (querySnapshot.empty) {
    return [];
  }

  let indexes = [];
  querySnapshot.forEach((doc) => {
    let index = doc.id;

    indexes.push(index);
  });

  return indexes;
}

// ---- NOTES ---- //
async function fetchStoredNotes(address, blinding) {
  // Address should be the x coordinate of the address in decimal format

  let indexes = await getAddressIndexes(address);

  let notes = [];
  for (let index of indexes) {
    const noteDoc = await getDoc(doc(db, `notes`, index.toString()));

    if (!noteDoc.exists()) {
      continue;
    }

    let noteData = noteDoc.data();

    let addr = ec
      .keyFromPublic({
        x: new BN(noteData.address[0]),
        y: new BN(noteData.address[1]),
      })
      .getPublic();

    // let yt = pedersen([BigInt(addr.getX()), privateSeed]);
    let hash8 = trimHash(blinding, 64);
    let amount = Number.parseInt(
      bigInt(noteData.hidden_amount).xor(hash8).value
    );

    if (pedersen([BigInt(amount), blinding]) != noteData.commitment) {
      throw "Invalid amount and blinding";
    }

    let note = new Note(
      addr,
      BigInt(noteData.token),
      amount,
      blinding,
      BigInt(noteData.index)
    );

    notes.push(note);
  }

  return notes;
}

async function checkNoteExistance(address) {
  // Address should be the x coordinate of the address in decimal format

  const indexes = await getAddressIndexes(address);

  return indexes && indexes.length > 0;
}

// ---- POSITIONS ---- //
async function fetchStoredPosition(address) {
  // returns the position at this address from the db

  let indexes = await getAddressIndexes(address);

  let positions = [];
  for (let index of indexes) {
    const posDoc = await getDoc(doc(db, `positions`, index.toString()));

    if (!posDoc.exists()) {
      continue;
    }

    let position = posDoc.data();

    positions.push(position);
  }

  return positions;
}

async function fetchIndividualPosition(address, index) {
  // returns the position at this address from the db

  const positionData = await getDoc(doc(db, `positions/`, index.toString()));

  if (!positionData.exists()) {
    return null;
  }

  let position = positionData.data();

  return position;
}

async function checkPositionExistance(address) {
  // Address should be the x coordinate of the address in decimal format

  const indexes = await getAddressIndexes(address);

  return indexes && indexes.length > 0;
}

// ---- USER INFO ---- //
async function registerUser(userId) {
  let userAddressesDoc = doc(db, "users", userId.toString());
  let userAddressData = await getDoc(userAddressesDoc);

  if (userAddressData.exists()) {
    return;
  }

  let userData = {
    noteCounts: {},
    positionCounts: {},
    depositIds: [],
  };

  await setDoc(userAddressesDoc, userData);

  return userData;
}

async function storeUserData(userId, noteCounts, positionCounts) {
  //& stores privKey, the address can be derived from the privKey

  let userDataDoc = doc(db, "users", userId.toString());
  let userDataData = await getDoc(userDataDoc);

  if (!userDataData.exists()) {
    throw "Register user first";
  }

  await updateDoc(userDataDoc, {
    noteCounts,
    positionCounts,
  });
}

async function storePrivKey(userId, privKey, isPosition, privateSeed) {
  let docRef;

  if (!privKey || !privateSeed) {
    return;
  }

  let encryptedPk = bigInt(privKey).xor(privateSeed).toString();

  if (isPosition) {
    docRef = doc(db, `users/${userId}/positionPrivKeys`, encryptedPk);
  } else {
    docRef = doc(db, `users/${userId}/privKeys`, encryptedPk);
  }

  await setDoc(docRef, {});
}

async function removePrivKey(userId, privKey, isPosition, privateSeed) {
  let docRef;

  let encryptedPk = bigInt(privKey).xor(privateSeed).toString();

  if (isPosition) {
    docRef = doc(db, `users/${userId}/positionPrivKeys`, encryptedPk);
  } else {
    docRef = doc(db, `users/${userId}/privKeys`, encryptedPk);
  }

  await deleteDoc(docRef);

  // let docRef2 = doc(db, `users/${userId}/deprecatedKeys`, encryptedPk);
  // await setDoc(docRef2, {});
}

async function storeOrderId(
  userId,
  orderId,
  pfrNotePrivKey,
  isPerp,
  privateSeed
) {
  if (!orderId) {
    return;
  }

  let privSeedSquare = bigInt(privateSeed).pow(2).value;
  let mask = trimHash(privSeedSquare, 32);
  let encryptedOrderId = bigInt(orderId).xor(mask).toString();

  let encryptedNotePk = pfrNotePrivKey
    ? bigInt(pfrNotePrivKey).xor(privateSeed).toString()
    : null;

  let docRef;
  if (isPerp) {
    docRef = doc(db, `users/${userId}/perpetualOrderIds`, encryptedOrderId);
  } else {
    docRef = doc(db, `users/${userId}/orderIds`, encryptedOrderId);
  }

  await setDoc(docRef, {
    pfrPrivKey: encryptedNotePk,
  });
}

async function removeOrderId(userId, orderId, isPerp, privateSeed) {
  let privSeedSquare = bigInt(privateSeed).pow(2).value;
  let mask = trimHash(privSeedSquare, 32);
  let encryptedOrderId = bigInt(orderId).xor(mask).toString();

  let docRef;
  if (isPerp) {
    docRef = doc(db, `users/${userId}/perpetualOrderIds`, encryptedOrderId);
  } else {
    docRef = doc(db, `users/${userId}/orderIds`, encryptedOrderId);
  }

  await deleteDoc(docRef);

  // let docRef2 = doc(db, `users/${userId}/deprecatedOrderIds`, encryptedOrderId);
  // await setDoc(docRef2, {});
}

async function fetchUserData(userId, privateSeed) {
  //& stores privKey : [address.x, address.y]

  let userDoc = doc(db, "users", userId.toString());
  let userData = await getDoc(userDoc);

  if (!userData.exists()) {
    await registerUser(userId);
    return {
      privKeys: [],
      positionPrivKeys: [],
      orderIds: [],
      perpetualOrderIds: [],
      noteCounts: {},
      positionCounts: {},
      depositIds: [],
      withdrawalIds: [],
    };
  }

  let noteCounts = userData.data().noteCounts;
  let positionCounts = userData.data().positionCounts;
  let depositIds = userData.data().depositIds;
  let withdrawalIds = userData.data().withdrawalIds;

  let pfrKeys = {};

  // Note priv_keys
  let querySnapshot = await getDocs(collection(db, `users/${userId}/privKeys`));
  let privKeys = [];
  if (!querySnapshot.empty) {
    querySnapshot.forEach((doc) => {
      let decyrptedPk = bigInt(doc.id).xor(privateSeed).value;

      privKeys.push(BigInt(decyrptedPk));
    });
  }

  // position priv_keys
  querySnapshot = await getDocs(
    collection(db, `users/${userId}/positionPrivKeys`)
  );
  let positionPrivKeys = [];
  if (!querySnapshot.empty) {
    querySnapshot.forEach((doc) => {
      let decyrptedPk = bigInt(doc.id).xor(privateSeed).value;

      positionPrivKeys.push(decyrptedPk);
    });
  }

  // spot order ids
  querySnapshot = await getDocs(collection(db, `users/${userId}/orderIds`));
  let orderIds = [];
  if (!querySnapshot.empty) {
    querySnapshot.forEach((doc) => {
      let privSeedSquare = bigInt(privateSeed).pow(2).value;
      let mask = trimHash(privSeedSquare, 32);
      let decyrptedPk = bigInt(doc.id).xor(mask).value;

      let decryptedNotePk = doc.data().pfrPrivKey
        ? bigInt(doc.data().pfrPrivKey).xor(privateSeed).toString()
        : null;

      orderIds.push(Number.parseInt(decyrptedPk));
      if (decryptedNotePk) {
        pfrKeys[decyrptedPk] = decryptedNotePk;
      }
    });
  }

  // perpetual order ids
  querySnapshot = await getDocs(
    collection(db, `users/${userId}/perpetualOrderIds`)
  );
  let perpetualOrderIds = [];
  if (!querySnapshot.empty) {
    querySnapshot.forEach((doc) => {
      let privSeedSquare = bigInt(privateSeed).pow(2).value;
      let mask = trimHash(privSeedSquare, 32);
      let decyrptedPk = bigInt(doc.id).xor(mask).value;

      let decryptedNotePk = doc.data().pfrPrivKey
        ? bigInt(doc.data().pfrPrivKey).xor(privateSeed).toString()
        : null;

      perpetualOrderIds.push(Number.parseInt(decyrptedPk));
      if (decryptedNotePk) {
        pfrKeys[decyrptedPk] = decryptedNotePk;
      }
    });
  }

  return {
    privKeys,
    noteCounts,
    positionCounts,
    orderIds,
    perpetualOrderIds,
    positionPrivKeys,
    pfrKeys,
    depositIds,
    withdrawalIds,
  };
}

async function fetchDeprecatedKeys(userId, privateSeed) {
  let querySnapshot = await getDocs(
    collection(db, `users/${userId}/deprecatedKeys`)
  );
  let privKeys = [];
  if (!querySnapshot.empty) {
    querySnapshot.forEach((doc) => {
      let decyrptedPk = bigInt(doc.id).xor(privateSeed).value;

      privKeys.push(BigInt(decyrptedPk));
    });
  }

  return privKeys;
}

// ---- DEPOSIT ---- //

async function storeDepositIds(userId, depositIds, newDepositId, privateSeed) {
  if (!depositIds) depositIds = [];
  // ? Stores the depositId of the user

  let userDataDoc = doc(db, "users", userId.toString());

  let mask = trimHash(privateSeed, 64);
  let encryptedDepositId = bigInt(newDepositId).xor(mask).toString();

  depositIds.push(encryptedDepositId);

  await updateDoc(userDataDoc, {
    depositIds: depositIds,
  });
}

async function storeWithdrawalIds(
  userId,
  withdrawalIds,
  newWithdrawalId,
  privateSeed
) {
  if (!withdrawalIds) withdrawalIds = [];
  // ? Stores the withdrawalId of the user

  let userDataDoc = doc(db, "users", userId.toString());

  let mask = trimHash(privateSeed, 64);
  let encryptedWithdrawalId = bigInt(newWithdrawalId).xor(mask).toString();

  withdrawalIds.push(encryptedWithdrawalId);

  await updateDoc(userDataDoc, {
    withdrawalIds: withdrawalIds,
  });
}

async function fetchOnchainDeposits(depositIds, privateSeed) {
  if (!depositIds || depositIds.length == 0) {
    return [];
  }

  let newDepositIds = [];
  let deposits = [];
  for (const depositId of depositIds) {
    let mask = trimHash(privateSeed, 64);
    let decryptedDepositId = bigInt(depositId).xor(mask).toString();

    let depositDoc = doc(db, "deposits", decryptedDepositId);
    let depositData = await getDoc(depositDoc);

    if (!depositData.exists()) {
      continue;
    }

    newDepositIds.push(depositId);

    deposits.push(depositData.data());
  }

  return { deposits, newDepositIds };
}

const EXCHANGE_CONFIG = require("../../exchange-config.json");
const CHAIN_IDS = EXCHANGE_CONFIG["CHAIN_IDS"];

async function fetchPendingWithdrawals(withdrawalIds, privateSeed) {
  if (!withdrawalIds || withdrawalIds.length == 0) {
    return [];
  }

  let newWithdrawalIds = [];
  let withdrawals = [];
  for (const withdrawalId of withdrawalIds) {
    let mask = trimHash(privateSeed, 64);
    let decryptedwithdrawalId = bigInt(withdrawalId).xor(mask).toString();

    // ? Get pending L1 withdrawals
    let withdrawalDoc = doc(
      db,
      "withdrawals/L1/pending",
      decryptedwithdrawalId
    );
    let withdrawalData = await getDoc(withdrawalDoc);

    if (withdrawalData.exists()) {
      let withdrawal = withdrawalData.data();
      withdrawal.chainId = CHAIN_IDS["Sepolia"];
      withdrawal.withdrawalId = withdrawalId;
      withdrawal.active = false;

      newWithdrawalIds.push(withdrawalId);

      withdrawals.push(withdrawal);

      continue;
    }

    // * GET L2 WITHDRAWALS --------------------------------

    // ? Get pending L2 withdrawals
    let l2WithdrawalDoc = doc(
      db,
      "withdrawals/L2/pending",
      decryptedwithdrawalId
    );
    let l2WithdrawalData = await getDoc(l2WithdrawalDoc);

    if (l2WithdrawalData.exists()) {
      let withdrawal = l2WithdrawalData.data();
      withdrawal.chainId = CHAIN_IDS["Arbitrum Sepolia"];
      withdrawal.withdrawalId = withdrawalId;
      withdrawal.active = false;

      newWithdrawalIds.push(withdrawalId);

      withdrawals.push(withdrawal);
      continue;
    }
  }

  return { withdrawals, newWithdrawalIds };
}

async function fetchActiveWithdrawals(connectedAddress) {
  if (!connectedAddress) {
    return [];
  }

  let withdrawals = [];

  // ? Get active L1 withdrawals
  let l1ActiveWIthdrawalDoc = doc(
    db,
    "withdrawals/L1/active",
    connectedAddress
  );
  let activeWithdrawalData = await getDoc(l1ActiveWIthdrawalDoc);

  if (activeWithdrawalData.exists()) {
    let recipientAmounts = activeWithdrawalData.data();

    for (const [tokenId, amount] of recipientAmounts) {
      let withdrawal = {
        chainId: CHAIN_IDS["Sepolia"],
        active: true,
        amount: amount,
        token_id: tokenId,
        recipient: connectedAddress,
      };

      withdrawals.push(withdrawal);
    }
  }

  // ? Get active L2 withdrawals
  let l2ActiveWithdrawalDoc = doc(
    db,
    "withdrawals/L2/active",
    decryptedwithdrawalId
  );
  let l2ActiveWithdrawalData = await getDoc(l2ActiveWithdrawalDoc);

  if (l2ActiveWithdrawalData.exists()) {
    let recipientAmounts = l2ActiveWithdrawalData.data();

    for (const [tokenId, amount] of recipientAmounts) {
      let withdrawal = {
        chainId: CHAIN_IDS["Arbitrum Sepolia"],
        active: true,
        amount: amount,
        token_id: tokenId,
        recipient: connectedAddress,
      };

      withdrawals.push(withdrawal);
    }
  }

  return withdrawals;
}

// ---- FILLS ---- //
async function fetchUserFills(user_id_) {
  let user_id = trimHash(user_id_, 64).toString();

  const q1 = query(
    collection(db, `fills`),
    where("user_id_a", "==", user_id),
    limit(20)
  );
  const querySnapshot1 = await getDocs(q1);

  const q2 = query(
    collection(db, `fills`),
    where("user_id_b", "==", user_id),
    limit(20)
  );
  const querySnapshot2 = await getDocs(q2);

  const q3 = query(
    collection(db, `perp_fills`),
    where("user_id_a", "==", user_id),
    limit(20)
  );
  const querySnapshot3 = await getDocs(q3);

  const q4 = query(
    collection(db, `perp_fills`),
    where("user_id_b", "==", user_id),
    limit(20)
  );
  const querySnapshot4 = await getDocs(q4);

  // [{base_token, amount, price, side, time, isPerp}]

  let fills = [];
  let spotSnapshotDocs = querySnapshot1.docs.concat(querySnapshot2.docs);
  spotSnapshotDocs.forEach((doc) => {
    let obj = doc.data();

    let fill = {
      amount: obj.amount,
      price: obj.price,
      base_token: obj.base_token,
      side: obj.user_id_a == user_id ? "Buy" : "Sell",
      time: obj.timestamp,
      isPerp: false,
    };

    fills.push(fill);
  });

  let perpSnapshotDocs = querySnapshot3.docs.concat(querySnapshot4.docs);
  perpSnapshotDocs.forEach((doc) => {
    let obj = doc.data();

    let fill = {
      amount: obj.amount,
      price: obj.price,
      base_token: obj.synthetic_token,
      side: obj.user_id_a == user_id ? "Buy" : "Sell",
      time: obj.timestamp,
      isPerp: true,
    };

    fills.push(fill);
  });

  // order the fills by time
  fills = fills.sort((a, b) => {
    return b.time - a.time;
  });

  return fills;
}

/**
 * @param {} n number of fills to fetch
 */
async function fetchLatestFills(n, isPerp, token) {
  let q;
  if (isPerp) {
    q = query(
      collection(db, "perp_fills"),
      where("synthetic_token", "==", Number(token)),
      orderBy("timestamp", "desc"),
      limit(n)
    );
  } else {
    q = query(
      collection(db, `fills`),
      where("base_token", "==", Number(token)),
      orderBy("timestamp", "desc"),
      limit(n)
    );
  }

  const querySnapshot = await getDocs(q);
  let fills = querySnapshot.docs.map((doc) => doc.data());

  return fills;
}

// ================================================================

// ---- POSITIONS ---- //

// ================================================================

module.exports = {
  fetchStoredNotes,
  storeUserData,
  fetchUserData,
  fetchStoredPosition,
  storeDepositIds,
  storeWithdrawalIds,
  fetchOnchainDeposits,
  fetchPendingWithdrawals,
  fetchActiveWithdrawals,
  storePrivKey,
  removePrivKey,
  storeOrderId,
  removeOrderId,
  fetchUserFills,
  fetchLatestFills,
  fetchDeprecatedKeys,
  fetchIndividualPosition,
  checkNoteExistance,
  checkPositionExistance,
};
