import { ObjectId, objectManager } from './object'
import {
  TransactionInputObjectType,
  TransactionObjectType,
  TransactionOutputObjectType,
  OutpointObjectType,
  SpendingTransactionObject
} from './message'
import { PublicKey, Signature } from './crypto/signature'
import { canonicalize } from 'json-canonicalize'
import { ver } from './crypto/signature'
import { logger } from './logger'
import { Block } from './block'

/**
 * a class to represent a transaction output
 */
export class Output {
  /* TODO */
  pubkey: PublicKey
  value: number
  static fromNetworkObject(outputMsg: TransactionOutputObjectType): Output {
    /* TODO */
    const output = new Output(outputMsg.pubkey, outputMsg.value);
    return output;
  }

  constructor(pubkey: PublicKey, value: number) {
    /* TODO */
    this.pubkey = pubkey
    this.value = value
  }

  toNetworkObject(): TransactionOutputObjectType {
    return {
      'pubkey': this.pubkey,
      'value': this.value
    }; /* TODO */
  }
}

/**
 * a class to represent a transaction outpoint
 */
export class Outpoint {
  /* TODO */
  txid: ObjectId
  index: number
  constructor(txid: ObjectId, index: number) {
    /* TODO */
    this.txid = txid
    this.index = index
  }

  /**
   * Gets the output referenced by this outpoint
   * @returns the referenced output
   */
  async resolve(): Promise<Output> {
    /* TODO */
    return new Output('', 0);
  }

  toNetworkObject(): OutpointObjectType {
    /* TODO */
    return {
      'txid': this.txid,
      'index': this.index
    };
  }

  toString() {
    /* TODO */
    return canonicalize(this.toNetworkObject())
  }
}

export class Input {
  /* TODO */
  outpoint: Outpoint
  sig: string | null
  static fromNetworkObject(inputMsg: TransactionInputObjectType): Input {
    /* TODO */
    return new Input(new Outpoint(inputMsg.outpoint.txid, inputMsg.outpoint.index), inputMsg.sig);
  }
  constructor(outpoint: Outpoint, sig: string | null) {
    /* TODO */
    this.outpoint = outpoint
    this.sig = sig
  }

  toNetworkObject(): TransactionInputObjectType {
    /* TODO */
    return {
      'outpoint': {
        'txid': this.outpoint.txid,
        'index': this.outpoint.index
      },
      'sig': this.sig,
    }
  }

  /**
   * @returns this input without a signature
   */
  toUnsigned(): Input {
    /* TODO */
    return new Input(this.outpoint, null);
  }
}

/**
 * a class to represent transactions
 */
export class Transaction {
  /* TODO */
  // inputs: TransactionInputObjectType[]
  // outputs: TransactionOutputObjectType[]


  static inputsFromNetworkObject(inputMsgs: TransactionInputObjectType[]) {
    /* TODO */

  }
  static outputsFromNetworkObject(outputMsgs: TransactionOutputObjectType[]) {
    /* TODO */
  }
  static fromNetworkObject(txObj: TransactionObjectType): Transaction {
    /* TODO */
    return new Transaction();
  }
  static async byId(txid: ObjectId): Promise<Transaction> {
    /* TODO */
    return new Transaction();
  }
  constructor(/* TODO */) {
    /* TODO */
  }
  isCoinbase(): Boolean {
    /* TODO */
    return false;
  }
  async validate(idx?: number, block?: Block) {
    /* TODO */
  }
  inputsUnsigned() {
    /* TODO */
  }
  // toNetworkObject(signed: boolean = true): TransactionObjectType {
  //   /* TODO */
  //   return true;
  // }
  toString() {
    /* TODO */
  }
}
