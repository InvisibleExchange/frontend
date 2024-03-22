const { computeHashOnElements } = require("../helpers/pedersen");
const { getKeyPair, sign } = require("starknet").ec;

/* global BigInt */

module.exports = class Withdrawal {
  constructor(
    chain_id,
    token,
    amount,
    recipient,
    max_gas_fee,
    notes_in,
    refund_note,
    signature
  ) {
    this.chain_id = chain_id;
    this.token = token;
    this.amount = amount;
    this.recipient = recipient;
    this.notes_in = notes_in;
    this.max_gas_fee = max_gas_fee;
    this.refund_note = refund_note;
    this.signature = signature;
  }

  toGrpcObject() {
    return {
      chain_id: this.chain_id,
      token: this.token.toString(),
      amount: this.amount.toString(),
      recipient: this.recipient.toString(),
      max_gas_fee: this.max_gas_fee.toString(),
      notes_in: this.notes_in.map((n) => n.toGrpcObject()),
      refund_note: this.refund_note.toGrpcObject(),
      signature: {
        r: this.signature[0].toString(),
        s: this.signature[1].toString(),
      },
    };
  }

  static signWithdrawal(notes, pks, refund_note, starkKey, chainId, gasFee) {
    let hashes = notes.map((n) => n.hashNote());
    let refundNoteHash = refund_note.hashNote();

    hashes.push(refundNoteHash);
    hashes.push(starkKey);
    hashes.push(chainId);
    hashes.push(gasFee);

    let withdrawal_hash = computeHashOnElements(hashes);

    let pkSum = 0n;
    for (let i = 0; i < pks.length; i++) {
      pkSum += BigInt(pks[i]);
    }

    let keyPair = getKeyPair(pkSum);

    let sig = sign(keyPair, withdrawal_hash.toString(16));

    return sig;
  }
};
