import { Block } from './block'
import { Chain } from './chain'
import { logger } from './logger'
import { db, ObjectId, objectManager } from './object'
import { Transaction } from './transaction'
import { UTXO, UTXOSet } from './utxo'

/**
 * Handles the state of the Mining Pool
 */
class MemPool {
  /* TODO */
  utxoSet: UTXO = new Map<string, Set<number>>()
  async init() {
    await this.load()
    logger.debug('Mempool initialized')
  }

  /**
   * @returns all IDs from the transactions in the mempool
   */
  getTxIds(): ObjectId[] {
    /* TODO */
    const x: ObjectId[] = Array.from(this.utxoSet.keys());
    return x;
  }

  /**
   * Creates a mempool from transaction IDs
   * @param txids 
   */
  async fromTxIds(txids: ObjectId[]) {
    /* TODO */
  }

  /**
   * save this mempool state
   */
  async setUtxoSet(utxo: UTXO) {
    /* TODO */
    this.utxoSet = utxo
    try {
      await this.save()

    } catch (error) {
      logger.error("Couldn't save utxo set to db.")
    }

  }

  /**
   * save this mempool state
   */
  async save() {
    /* TODO */
    logger.debug(`Storing utxoset set`)
    const obj: { [key: string]: any } = {};
    this.utxoSet.forEach((value, key) => {
      obj[key] = Array.from(value);
    });
    return await db.put(`utxoset`, obj)
  }

  /**
   * load mempool state
   */
  async load() {
    /* TODO */
    try {
      const utxset = await db.get(`utxoset`)
      Object.keys(utxset).forEach((key) => this.utxoSet.set(key, new Set(utxset[key])))
    } catch (error) {
      logger.error(`Failed to load utxoset from db.`)
    }
  }

  /**
   * on arrival of a new transaction, update the mempool if possible
   * @param tx 
   * @returns true iff tx has been successfully added to the mempool
   */
  async onTransactionArrival(tx: Transaction): Promise<boolean> {
    /* TODO */
    return false;
  }

  /**
   * reorganises the mempool on blockchain fork
   * @param lca 
   * @param shortFork 
   * @param longFork 
   */
  async reorg(lca: Block, shortFork: Chain, longFork: Chain) {
    /* TODO */
  }
}

export const mempool = new MemPool()
