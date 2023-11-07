const User = require("../users/Invisibl3User");

const EXCHANGE_CONFIG = require("../../exchange-config.json");

const PRICE_DECIMALS_PER_ASSET = EXCHANGE_CONFIG["PRICE_DECIMALS_PER_ASSET"];
const IDS_TO_SYMBOLS = EXCHANGE_CONFIG["IDS_TO_SYMBOLS"];

const {
  checkNoteExistance,
  checkPositionExistance,
} = require("./firebaseConnection");
const { storePrivKey } = require("./firebaseConnection");

// ! RESTORE KEY DATA ========================================================================

/**
 *
 * @param {bigint|string} originPrivKey
 * @param {number[]} tokens
 * @param {boolean} isPerpetual - if true retrieve position keys else retrieve note keys
 */
async function restoreKeyData(
  user,
  isPerpetual = false,
  tokens = [12345, 54321, 55555]
) {
  // ? Get all the addresses from the datatbase =====

  if (isPerpetual) {
    let positionPrivKeys = {};
    for (let token of tokens) {
      if (!PRICE_DECIMALS_PER_ASSET[token]) continue;

      let counter = 0;
      for (let i = 0; i < 16; i++) {
        let { positionPrivKey, positionAddress } =
          user.getPositionAddress(token);

        checkPositionExistance(positionAddress.getX().toString()).then(
          (keyExists) => {
            if (keyExists) {
              positionPrivKeys[positionAddress.getX().toString()] =
                positionPrivKey;
            }

            counter++;
          }
        );
      }

      while (counter < 16) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    return positionPrivKeys;
  } else {
    let privKeys = {};
    for (let token of tokens) {
      if (!IDS_TO_SYMBOLS[token]) continue;

      let counter = 0;
      for (let i = 0; i < 32; i++) {
        let { KoR, koR, _ } = user.getDestReceivedAddresses(token);

        checkNoteExistance(KoR.getX().toString()).then((keyExists) => {
          if (keyExists) {
            privKeys[KoR.getX().toString()] = koR;
          }

          counter++;
        });
      }

      while (counter < 32) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    return privKeys;
  }
}

/**
 *
 * @param {User} user
 * @param {boolean} restoreNotes  - if true retrieve note keys
 * @param {boolean} restorePositions - if true retrieve position keys
 */
async function restoreUserState(user, restoreNotes, restorePositions) {
  // let user = User.fromPrivKey(originPrivKey.toString());
  // await user.login();

  let privKeys = {};
  let posPrivKeys = {};
  if (restoreNotes) {
    privKeys = await restoreKeyData(user, false);

    user.notePrivKeys = privKeys;
  }
  if (restorePositions) {
    posPrivKeys = await restoreKeyData(user, true);

    user.positionPrivKeys = posPrivKeys;
  }

  for (let pk of Object.values(privKeys)) {
    storePrivKey(user.userId, pk, false, user.privateSeed);
  }
  for (let pk of Object.values(posPrivKeys)) {
    storePrivKey(user.userId, pk, true, user.privateSeed);
  }
}

module.exports = { restoreUserState };
