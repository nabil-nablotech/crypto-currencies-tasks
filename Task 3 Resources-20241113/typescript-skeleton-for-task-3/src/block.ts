import {
  BlockObject, BlockObjectType,
  TransactionObject, ObjectType,
  INVALID_FORMAT,
  INVALID_BLOCK_POW,
  UNFINDABLE_OBJECT,
  CoinbaseTransactionObject,
  INVALID_BLOCK_COINBASE,
  INVALID_GENESIS,
  INVALID_BLOCK_TIMESTAMP,
  INVALID_ANCESTRY
} from './message'
import { hash } from './crypto/hash'
import { canonicalize } from 'json-canonicalize'
import { Peer } from './peer'
import { objectManager, ObjectId, db } from './object'
import { utxo, UTXOSet } from './utxo'
import { logger } from './logger'
import { Transaction } from './transaction'
import { chainManager } from './chain'
import { Deferred } from './promise'
import { CustomError } from './errors'
import { network } from './network'

const TARGET = '00000000abc00000000000000000000000000000000000000000000000000000' /* TODO */
const GENESIS: BlockObjectType = {
  "T": "00000000abc00000000000000000000000000000000000000000000000000000",
  "created": 1671062400,
  "miner": "Marabu",
  "nonce": "000000000000000000000000000000000000000000000000000000021bea03ed",
  "note": "The New York Times 2022-12-13: Scientists Achieve Nuclear Fusion Breakthrough With Blast of 192 Lasers",
  "previd": null,
  "txids": [],
  "type": "block"
}
const BU = 10 ** 12
const BLOCK_REWARD = 50 * BU

export class BlockManager {
  /* TODO */
  async init() {
    const genesisBlockId = objectManager.id(GENESIS)
    // if (!await db.exists(genesisBlockId)) {
    //   logger.info(`Genesis block not found. Initializing genesis block.`)
    //   objectManager.put(GENESIS)
    // }
  }
}

export const blockManager = new BlockManager()

/**
 * Class used to represent a block
 */
export class Block {
  /* TODO */
  blockid: ObjectId
  txIds: string[]
  nonce: string
  prevId: string | null
  created: number
  T: string
  miner: string | undefined
  note: string | undefined
  transactions: Transaction[]

  /**
   * Builds a Block object from GENESIS
   * @returns the genesis block
   */
  public static makeGenesis(): Block {
    /* TODO */
    return Block.fromNetworkObject(GENESIS);;
  }

  /**
   * Builds a block object from given BlockObject collection
   * @param object 
   * @returns a Block object representing this block
   */
  public static fromNetworkObject(object: BlockObjectType): Block {
    /* TODO */
    return new Block(
      objectManager.id(object),
      object.txids,
      object.nonce,
      object.previd,
      object.created,
      object.T,
      object.miner,
      object.note
    );
  }

  constructor(
    /* TODO */
    blockId: string,
    txIds: string[],
    nonce: string,
    prevId: string | null,
    created: number,
    T: string,
    miner: string | undefined,
    note: string | undefined
  ) {
    /* TODO */
    this.blockid = blockId
    this.txIds = txIds
    this.nonce = nonce
    this.prevId = prevId
    this.created = created
    this.T = T
    this.miner = miner
    this.note = note
    this.transactions = []
  }

  /**
   * Attempts to fetch the coinbase transaction from this block, throws an Error if not present
   * @returns the coinbase transaction, if present
   * @throws Error
   */
  async getCoinbase(): Promise<Transaction> {
    /* TODO */
    if (this.transactions.length > 0) {
      if (CoinbaseTransactionObject.guard(this.transactions[0].toNetworkObject(false))) {
        return this.transactions[0]
      } else {
        throw new Error("No coinbase in the first index.")
      }
    } else {
      throw new Error("No transactions.")
    }
  }

  hasPoW(): boolean {
    /* TODO */
    const intBlockId = BigInt(`0x${this.blockid}`);
    const intTarget = BigInt(`0x${this.T}`);
    return intBlockId < intTarget;
  }

  isGenesis(): boolean {
    /* TODO */
    return (this.prevId === null);
  }

  /**
   * Attempts to get all transaction objects from their IDs referenced in this block, throws an Error if not all could be loaded
   * @returns collecetion of transaction
   * @throws Error
   */
  async getTxs(/* TODO */): Promise<Transaction[]> {
    /* TODO */
    const knownTxId: Set<string> = new Set();
    const missingTxId: Set<string> = new Set();
    const txs: Transaction[] = [];
    for (const txId of this.txIds) {
      const known = await objectManager.exists(txId)
      if (known) {
        knownTxId.add(txId)
      } else {
        missingTxId.add(txId)
      }
    }

    // fetch missing
    try {
      await Promise.all(Array.from(missingTxId).map(async (id) => {
        const peerPromises = network.peers.map((peer) => objectManager.retrieve(id, peer).catch(() => null))
        try {
          const result = await Promise.race(peerPromises)

          if (result === null) {
            // Check if all promises are rejected
            const allSettled = await Promise.all(peerPromises);

            // If all promises failed (all returned null), reject
            if (allSettled.every(result => result === null)) {
              throw new CustomError(`Couldn't fine Object ${id}.`, UNFINDABLE_OBJECT, true)
            }
          } else if (result !== null) {

            if (TransactionObject.guard(result)) {
              txs.push(Transaction.fromNetworkObject(result))
              return result
            } else {
              throw new CustomError(`Invalid Object ${id} . A block was referenced at a position where a transaction was expected.`, INVALID_FORMAT)
            }

          }
        } catch (e: any) {
          throw e
        }
      }))
    } catch (e: any) {
      throw e
    }
    // fetch known
    for (const txId of Array.from(knownTxId)) {
      try {
        const object = await objectManager.get(txId)
        if (TransactionObject.guard(object)) {
          txs.push(Transaction.fromNetworkObject(object))
        } else {
          throw new CustomError(`Invalid Object ${txId} . A block was referenced at a position where a transaction was expected.`, INVALID_FORMAT)
        }
      }
      catch (e) {
        throw e
      }
    }

    return txs;
  }

  /**
   * Validates a transaction, throws an Error if transaction failed to verify
   * @throws Error
   */
  async validateTx(/* TODO */) {
    /* TODO */
    let totalFees = 0
    this.transactions.forEach((transaction, index) => {
      transaction.validate(index, this)
    })


    if (this.transactions.length > 0) {
      try {
        const coinBase = await this.getCoinbase()
        this.transactions.forEach(async (transaction) => {
          if (coinBase.txid !== transaction.txid) {
            if (transaction.fees !== undefined)
              totalFees += transaction.fees
          }
        })
        if (coinBase.outputs[0].value > (BLOCK_REWARD + totalFees)) {
          throw new CustomError(`Invalid block ${this.blockid}. The coinbase transaction creates more coins than allowed.`, INVALID_BLOCK_COINBASE)
        }
        utxo.apply(coinBase)
      } catch (e: any) { // typescript does not allow strongly type try catch blocks....
        if (e instanceof CustomError) {
          throw e
        }
        else
          logger.debug("No coinbase transaction in this block.")
      }

    }

  }

  /**
   * Gets the parent block, returning null on failure
   * @returns Block
   */
  async loadParent(): Promise<Block | null> {
    /* TODO */
    if (this.prevId !== null) {
      try {
        logger.debug("Loading parent.")
        const result = await objectManager.get(this.prevId)
        return Block.fromNetworkObject(result)
      } catch (error) {
        logger.error("Failed to load parent")
      }

    }
    return null;
  }

  /**
   * Validates the ancestry of this block until a block that has already been verified is hit
   * @returns parent Block if valid, otherwise null
   */
  async validateAncestry(/* TODO */): Promise<Block | null> {
    /* TODO */
    return null;
  }

  /**
   * Validate this block, throwing an error if validation failed
   * @throws Error
   */
  async validate(/* TODO */) {
    /* TODO */
    if (this.T !== TARGET) {
      throw new CustomError(`Invalid block ${this.blockid}. T is different from the expected TARGET value.`, INVALID_FORMAT)
    }

    if (this.isGenesis()) {
      if (Block.makeGenesis().blockid !== this.blockid) {
        throw new CustomError(`Invalid block ${this.blockid}. Gensis block does not match with object specified in the standard.`, INVALID_GENESIS)
      }
    }

    if (!this.hasPoW()) {
      throw new CustomError(`Invalid block ${this.blockid}. The block does not meet the required mining target.`, INVALID_BLOCK_POW)
    }


    const parent = await this.loadParent()
    if (parent !== null && !this.isGenesis()) {
      if ((parent.created >= this.created) || (this.created >= Math.floor(Date.now() / 1000))) {
        throw new CustomError(`Invalid block ${this.blockid}. The block timestamp is invalid.`, INVALID_BLOCK_TIMESTAMP)
      }
    } else if (parent === null && !this.isGenesis()) {
      throw new CustomError(`Invalid block ${this.blockid}. The block has no parent.`, INVALID_ANCESTRY)

    }

    this.transactions = await this.getTxs()
    await this.validateTx()
  }

  /**
   * save this block (alongside meta information) in the database
   */
  async save() {
    /* TODO */
  }

  /**
   * load this block data and meta information
   */
  async load() {
    /* TODO */
  }
}
