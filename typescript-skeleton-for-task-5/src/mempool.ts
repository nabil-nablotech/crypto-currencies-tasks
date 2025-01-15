import { Block } from './block'
import { Chain, chainManager } from './chain'
import { CustomError } from './errors'
import { logger } from './logger'
import { ObjectType } from './message'
import { network } from './network'
import { db, ObjectId, objectManager } from './object'
import { Outpoint, Transaction } from './transaction'
import { UTXOSet } from './utxo'

/**
 * Handles the state of the Mining Pool
 */
class MemPool {
  /* TODO */
  txids: ObjectId[];
  state: UTXOSet;
  usedOutpoints: Set<string>;

  constructor(
  ) {
    this.txids = []
    this.state = new UTXOSet(new Set<string>())
    this.usedOutpoints = new Set<string>()
  }



  async init() {
    await this.load()
    logger.debug('Mempool initialized')
  }

  /**
   * @returns all IDs from the transactions in the mempool
   */
  getTxIds(): ObjectId[] {
    /* TODO */
    return this.txids;
  }

  /**
   * Creates a mempool from transaction IDs
   * @param txids 
   */
  async fromTxIds(txids: ObjectId[]) {
    /* TODO */
  }

  /**
  * @returns all IDs from the transactions in the mempool
  */
  async getTxObjects(): Promise<Transaction[]> {
    /* TODO */
    const transactions: Transaction[] = [];
    try {
      logger.debug(`Constructing transaction objects`);
      for (const txId of this.txids) {
        const txObject = await objectManager.get(txId);
        transactions.push(Transaction.fromNetworkObject(txObject));
      }
    } catch (err) {
      logger.debug(`Constructing transaction objects failed.`);
      logger.debug(`Possibly attempted to load transaction listed in mempool but not found in db.`);
    }

    return transactions;
  }

  /**
   * save this mempool state
   */
  async save() {
    /* TODO */
    logger.debug(`Persisting mempool to db {txIds:${this.txids}, state:${this.state}, used:${Array.from(this.usedOutpoints).join(", ")}}`)
    return await db.put(`mempool`, {
      txIds: this.txids, state: {
        outpoints: Array.from(this.state.outpoints)
      },
      used: Array.from(this.usedOutpoints)
    });
  }

  /**
   * load mempool state
   */
  async load() {
    /* TODO */
    try {
      logger.debug(`Loading mempool from db if exists.`);
      const data = await db.get(`mempool`);
      this.txids = data.txIds;
      this.state = new UTXOSet(data.state.outpoints);
      this.usedOutpoints = new Set(data.used);
      logger.debug(`Loaded mempool to db {txIds:${this.txids}, state:${this.state}, used:${Array.from(this.usedOutpoints).join(", ")}}`)

    } catch (error) {
      logger.debug(`No mempool in db.`)
      logger.debug(`Mempool state state to longest chain state.`)
      if (chainManager.longestChainTip?.stateAfter) {
        this.state = chainManager.longestChainTip?.stateAfter
      }
    }




  }

  /**
   * on arrival of a new transaction, update the mempool if possible
   * @param tx 
   * @returns true iff tx has been successfully added to the mempool
   */
  async onTransactionArrival(tx: Transaction): Promise<boolean> {
    /* TODO */

    logger.debug(`Transaction ${tx.txid} arrived.`)
    logger.debug(`Checking if ${tx.txid} can be added to the mempool.`)

    const seen: Set<string> = new Set<string>()

    if (tx.isCoinbase()) {
      logger.debug(`Transaction ${tx.txid} is a coinbase`)
      return false;
    }

    logger.debug(`Checking ${tx.inputs.length} inputs of transaction ${tx.txid} against the UTXO set.`)
    for (const input of tx.inputs) {
      logger.debug(`Checking input ${input.outpoint} of transaction ${tx.txid} against the UTXO set.`)
      const outpointStr: string = input.outpoint.toString()

      logger.debug(`Checking to see if outpoint ${outpointStr} is unspent in UTXO outpoints ${this.state.outpoints}.`)
      if (!this.state.outpoints.has(outpointStr)) {
        logger.debug(`Transaction ${tx.txid} consumes ${outpointStr} which is not in the UTXO set.`)
        return false;
      }
      logger.debug(`Outpoint ${outpointStr} is unspent.`)
      logger.debug(`Checking if outpoint ${outpointStr} is being respent in the same tx.`)
      if (seen.has(outpointStr)) {
        logger.debug(`Transaction ${tx.txid} has two different inputs spending the same outpoint ${outpointStr}`)
        return false;
      }
      logger.debug(`Outpoint ${outpointStr} has not been spent in the same tx.`)
      logger.debug(`Input is valid`)
      if (this.usedOutpoints.has(outpointStr)) {
        logger.debug(`Transaction ${tx.txid} attempts to reuse an outpoint ${outpointStr} that is already used by a transaction already in the mempool.`)
        return false;
      }

      seen.add(outpointStr)
    }

    seen.forEach((outPointStr) => this.usedOutpoints.add(outPointStr))

    for (let i = 0; i < tx.outputs.length; ++i) {
      this.state.outpoints.add((new Outpoint(tx.txid, i)).toString())
    }

    this.txids.push(tx.txid)

    await this.save()
    return true;
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

  async fetchUnkownTxs(txids: ObjectId[]) {
    for (const txid of txids) {
      try {
        logger.debug(`Fetching unkown transactions from ${txids}.`)
        await objectManager.exists(txid);
        logger.debug(`Tx: ${txids} already exists.`)
      } catch (error) {
        logger.debug(`Retriving from peers Tx: ${txids}.`)
        network.broadcast({ 'type': 'getobject', 'objectid': txid });
      }
    }

  }
}

export const mempool = new MemPool()
