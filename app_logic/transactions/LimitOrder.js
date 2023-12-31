const { getKeyPair, sign } = require("starknet").ec;
const { computeHashOnElements } = require("../helpers/pedersen");

/* global BigInt */

class LimitOrder {
  constructor(
    expiration_timestamp,
    token_spent,
    token_received,
    amount_spent,
    amount_received,
    fee_limit,
    spot_note_info,
    order_tab
  ) {
    this.expiration_timestamp = expiration_timestamp;
    this.token_spent = token_spent;
    this.token_received = token_received;
    this.amount_spent = amount_spent;
    this.amount_received = amount_received;
    this.fee_limit = fee_limit;
    //
    this.spot_note_info = spot_note_info;
    this.order_tab = order_tab;
    // --------------------------
    this.order_hash = this.hashOrder();
    this.signature = null;
  }

  hashOrder() {
    // & H({expiration_timestamp, token_spent, token_received, amount_spent, amount_received, fee_limit, note_info_hash, order_tab_pub_key})

    let hashInputs = [
      this.expiration_timestamp,
      this.token_spent,
      this.token_received,
      this.amount_spent,
      this.amount_received,
      this.fee_limit,
    ];

    if (this.spot_note_info) {
      hashInputs.push(this.spot_note_info.hash());
    } else {
      hashInputs.push(this.order_tab.tab_header.pub_key);
    }

    return computeHashOnElements(hashInputs);
  }

  signOrder(priv_keys) {
    let order_hash = this.hashOrder();

    let pk_sum = 0n;
    for (let i = 0; i < priv_keys.length; i++) {
      pk_sum += BigInt(priv_keys[i]);
    }

    const keyPair = getKeyPair(pk_sum);

    let sig = sign(keyPair, "0x" + order_hash.toString(16));

    this.signature = sig;

    return sig;
  }

  toGrpcObject() {
    return {
      expiration_timestamp: this.expiration_timestamp.toString(),
      token_spent: this.token_spent.toString(),
      token_received: this.token_received.toString(),
      amount_spent: this.amount_spent.toString(),
      amount_received: this.amount_received.toString(),
      fee_limit: this.fee_limit.toString(),
      spot_note_info: this.spot_note_info
        ? this.spot_note_info.toGrpcObject()
        : null,
      order_tab: this.order_tab ? this.order_tab.toGrpcObject() : null,
      signature: {
        r: this.signature[0].toString(),
        s: this.signature[1].toString(),
      },
    };
  }

  //   verify_order_signatures(sig) {
  //     let order_hash = this.hashOrder();

  //     let pub_key_sum = getKeyPair(0).getPublic();
  //     for (let i = 0; i < this.notesIn.length; i++) {
  //       pub_key_sum = pub_key_sum.add(this.notesIn[i].address);
  //     }

  //     let verifyKeyPair = getKeyPairFromPublicKey(pub_key_sum.encode());

  //     if (!verify(verifyKeyPair, order_hash.toString(16), sig)) {
  //       throw new Error("Signature verification failed");
  //     }
  //     console.log("Signature verification successful");
  //   }
}

class SpotNotesInfo {
  constructor(
    dest_received_address,
    dest_received_blinding,
    notes_in,
    refund_note
  ) {
    this.dest_received_address = dest_received_address;
    this.dest_received_blinding = dest_received_blinding;
    this.notes_in = notes_in;
    this.refund_note = refund_note;
  }

  hash() {
    let noteHashes = this.notes_in.map((note) => note.hash);
    let refundHash = this.refund_note ? this.refund_note.hash : 0n;

    let hashInputs = noteHashes
      .concat(refundHash)
      .concat([
        BigInt(this.dest_received_address.getX()),
        this.dest_received_blinding,
      ]);

    return computeHashOnElements(hashInputs);
  }

  toGrpcObject() {
    return {
      dest_received_address: {
        x: this.dest_received_address.getX().toString(),
        y: this.dest_received_address.getY().toString(),
      },
      dest_received_blinding: this.dest_received_blinding.toString(),
      notes_in: this.notes_in.map((note) => note.toGrpcObject()),
      refund_note: this.refund_note ? this.refund_note.toGrpcObject() : null,
    };
  }
}

// ORDER TABS ===================================================

module.exports = {
  LimitOrder,
  SpotNotesInfo,
};
