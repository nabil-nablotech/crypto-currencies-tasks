export type ObjectId = string

import level from 'level-ts'
import { canonicalize } from 'json-canonicalize'
import {
  Object, ObjectType,
  TransactionObjectType, BlockObjectType,
  UNFINDABLE_OBJECT
} from './message'
import { Transaction } from './transaction'
import { Block } from './block'
import { logger } from './logger'
import { hash } from './crypto/hash'
import { Peer } from './peer'
import { Deferred, delay, resolveToReject } from './promise'
import { mempool } from './mempool'
import { network } from './network'
import { CustomError } from './errors'

export const db = new level('./db')
const OBJECT_AVAILABILITY_TIMEOUT = 5000 // ms

/**
 * Interfaces the database
 */
class ObjectManager {
  deferredObjects: { [key: string]: Deferred<ObjectType>[] } = {}

  id(obj: any) {
    return hash(canonicalize(obj))
  }
  async exists(objectid: ObjectId) {
    return await db.exists(`object:${objectid}`)
  }
  async get(objectid: ObjectId) {
    return await db.get(`object:${objectid}`)
  }
  async del(objectid: ObjectId) {
    return await db.del(`object:${objectid}`)
  }
  async put(object: any) {
    const objectid = this.id(object)

    logger.debug(`Storing object with id ${objectid}: %o`, object)
    if (objectid in this.deferredObjects) {
      for (const deferred of this.deferredObjects[objectid]) {
        deferred.resolve(object)
      }
      delete this.deferredObjects[objectid]
    }
    return await db.put(`object:${this.id(object)}`, object)
  }

  async validate(object: ObjectType, peer: Peer) {
    await Object.match(
      async (obj: TransactionObjectType) => {
        const tx: Transaction = Transaction.fromNetworkObject(obj)
        logger.debug(`Validating transaction: ${tx.txid}`)
        await tx.validate()
      },
      async (obj: BlockObjectType) => {
        const block = await Block.fromNetworkObject(obj)
        logger.debug(`Validating block: ${block.blockid}`)
        await block.validate(peer)
      }
    )(object)
  }

  /**
   * Attempts to retrieve an object from a peer
   * @param objectid the object to get
   * @param peer the peer you want to get the object from
   * @returns the object, or rejects if not possible
   * TODO for Task 4: Fetch required objects from all your connected peers
   */
  async retrieve(objectid: ObjectId): Promise<ObjectType> {
    logger.debug(`Retrieving object ${objectid}`)
    let object: ObjectType
    const deferred = new Deferred<ObjectType>()

    if (!(objectid in this.deferredObjects)) {
      this.deferredObjects[objectid] = []
    }
    this.deferredObjects[objectid].push(deferred)

    try {
      object = await this.get(objectid)
      logger.debug(`Object ${objectid} was already in database`)
      return object
    }
    catch (e) { }

    network.peers.forEach(async peer => {
      logger.debug(`Object ${objectid} not in database. Requesting it from peer ${peer.peerAddr}.`)
      await peer.sendGetObject(objectid)
    })

    try {
      object = await Promise.race([
        resolveToReject(
          delay(OBJECT_AVAILABILITY_TIMEOUT),
          `Timeout of ${OBJECT_AVAILABILITY_TIMEOUT}ms in retrieving object ${objectid} exceeded`
        ),
        deferred.promise
      ])
  
      logger.debug(`Object ${objectid} was retrieved from one of the peers.`)
  
      return object
    }
    catch (e) { 
      throw new CustomError(`Couldn't find object ${objectid}.`, UNFINDABLE_OBJECT)
    }

  }

}

export const objectManager = new ObjectManager()
