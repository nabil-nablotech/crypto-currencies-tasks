import {network} from "./network";

export type ObjectId = string

import level from 'level-ts'
import { canonicalize } from 'json-canonicalize'
import { Object, ObjectType,
         TransactionObjectType, BlockObjectType } from './message'
import { Transaction } from './transaction'
import { Block } from './block'
import { logger } from './logger'
import { hash } from './crypto/hash'
import { Peer } from './peer'
import { Deferred, delay, resolveToReject } from './promise'
import { mempool } from './mempool'

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
   */
  async retrieve(objectid: ObjectId): Promise<ObjectType>  {
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
    catch (e) {}

    logger.debug(`Object ${objectid} not in database. Requesting it from your peers.`)
    await network.broadcast({'type': 'getobject', 'objectid': objectid})

    object = await Promise.race([
      resolveToReject(
          delay(OBJECT_AVAILABILITY_TIMEOUT),
          `Timeout of ${OBJECT_AVAILABILITY_TIMEOUT}ms in retrieving object ${objectid} exceeded`
      ),
      deferred.promise
    ])

    logger.debug(`Object ${objectid} was retrieved.`)

    return object
  }
}

export const objectManager = new ObjectManager()
