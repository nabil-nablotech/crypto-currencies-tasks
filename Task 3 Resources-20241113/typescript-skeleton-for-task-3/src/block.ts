import {
  BlockObject, BlockObjectType,
  TransactionObject, ObjectType,
  INVALID_FORMAT,
  INVALID_BLOCK_POW,
  UNFINDABLE_OBJECT
} from './message'
import { hash } from './crypto/hash'
import { canonicalize } from 'json-canonicalize'
import { Peer } from './peer'
import { objectManager, ObjectId, db } from './object'
import { UTXOSet } from './utxo'
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
  const utxoSet: Set<string> = new Set()
  async init() {
    const genesisBlockId = objectManager.id(GENESIS)
    if (!await db.exists(genesisBlockId)) {
      logger.info(`Genesis block not found. Initializing genesis block.`)
      objectManager.put(GENESIS)
    }
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
  public static async makeGenesis(): Promise<Block> {
    /* TODO */
    return this.fromNetworkObject(GENESIS);;
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
    return new Transaction("d46d09138f0251edc32e28f1a744cb0b7286850e4c9c777d7e3c6e459b289347", [], [], null); // TODO: change
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
    this.transactions.forEach((transaction, index) => {
      transaction.validate(index, this)
    })
  }

  /**
   * Gets the parent block, returning null on failure
   * @returns Block
   */
  async loadParent(): Promise<Block | null> {
    /* TODO */
    if (this.prevId !== null) {

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
    if (!this.hasPoW()) {
      throw new CustomError(`Invalid block ${this.blockid}. The block does not meet the required mining target.`, INVALID_BLOCK_POW)
    }

    try {
      this.transactions = await this.getTxs()
      await
    } catch (e) {
      throw e
    }
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
