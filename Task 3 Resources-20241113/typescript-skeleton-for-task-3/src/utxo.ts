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
  async copy() {
    /* TODO */

  }

  /**
   * Applies the transaction on the current utxo set, throwing an error if this is not possible
   * @param tx 
   * @throws Error
   */
  async apply(tx: Transaction) {
    /* TODO */
    logger.debug(`Applying ${tx.txid} to the current utxo set`)
    tx.outputs.forEach((transaction, index) => {
      if (this.utxoSet.has(tx.txid)) {
        this.utxoSet.set(tx.txid, this.utxoSet.get(tx.txid)!.add(index))
      } else {
        this.utxoSet.set(tx.txid, new Set([index]))
      }
    })

    tx.inputs.forEach((input) => {
      this.utxoSet.get(input.outpoint.txid)?.delete(input.outpoint.index)
      if (this.utxoSet.get(input.outpoint.txid)?.size === 0) {
        this.utxoSet.delete(input.outpoint.txid)
      }
    })
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

export const utxo = new UTXOSet()
