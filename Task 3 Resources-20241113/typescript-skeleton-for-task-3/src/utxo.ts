import { Block } from './block'
import { logger } from './logger'
import { mempool } from './mempool'
import { OutpointObject, OutpointObjectType } from './message'
import { db, ObjectId } from './object'
import { Outpoint, Transaction } from './transaction'

export type UTXO = Map<string, Set<number>>

/**
 * a class to represent the UTXO (unspent transaction output) set
 */
export class UTXOSet {
  /* TODO */
  utxoSet: UTXO

  constructor() {
    /* TODO */
    this.utxoSet = mempool.utxoSet
  }
  async copy(txid: string, index: number) {
    /* TODO */
    if (this.utxoSet.has(txid)) {
      this.utxoSet.set(txid, this.utxoSet.get(txid)!)
    } else {
      this.utxoSet.set(txid, new Set([index]))
    }

    await mempool.setUtxoSet(this.utxoSet)
  }

  /**
   * Applies the transaction on the current utxo set, throwing an error if this is not possible
   * @param tx 
   * @throws Error
   */
  async apply(tx: Transaction) {
    /* TODO */
  }

  /**
   * Applies multiple transaction to the current utxo set
   * @throws Error
   */
  async applyMultiple(txs: Transaction[]) {
    /* TODO */
  }

  toString() {
    /* TODO */
  }
}
