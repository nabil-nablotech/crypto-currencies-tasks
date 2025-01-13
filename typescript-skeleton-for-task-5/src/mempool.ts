import { Block } from './block'
import { Chain, chainManager } from './chain'
import { CustomError } from './errors'
import { logger } from './logger'
import { ObjectType } from './message'
import { network } from './network'
import { db, ObjectId, objectManager } from './object'
import { Transaction } from './transaction'
import { UTXOSet } from './utxo'

/**
 * Handles the state of the Mining Pool
 */
class MemPool {
  /* TODO */
  txids: ObjectId[];
  state: UTXOSet;
  localSpendings: { [key: string]: string };

  constructor(
  ) {
    this.txids = []
    this.state = new UTXOSet(new Set<string>())
    this.localSpendings = {}
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
   * save this mempool state
   */
  async save() {
    /* TODO */
  }

  /**
   * load mempool state
   */
  async load() {
    /* TODO */
    if (chainManager.longestChainTip?.stateAfter) {
      this.state = chainManager.longestChainTip?.stateAfter
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
    const transactionSpending = {};

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
      seen.add(outpointStr)
      logger.debug(`Transaction is valid with respect to UTXO set`)
      // Transaction is valid wrt state; apply it
      for (const input of tx.inputs) {
        const outpointStr: string = input.outpoint.toString()
        for (let i = 0; i < tx.outputs.length; ++i) {
          this.outpoints.add((new Outpoint(tx.txid, i)).toString())
        }
      }
      logger.debug(`Adding ${tx.outputs.length} outputs to UTXO set`)
      
      logger.debug(`Outpoints set after tx application: ${this}`)
    }

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
    logger.debug(`Fetching unkown transactions from ${txids}.`)
    for (const txid of txids) {
      try {
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
