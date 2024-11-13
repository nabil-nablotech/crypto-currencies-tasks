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
  /* TODO */

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

    return await db.put(`object:${this.id(object)}`, object)
  }

  async validate(object: ObjectType, peer: Peer) {
    await Object.match(
        async (obj: TransactionObjectType) => {
          const tx: Transaction = Transaction.fromNetworkObject(obj)
          logger.debug(`Validating transaction: ${tx.txid}`)
          await tx.validate()
        }
    )(object)
  }

  /**
   * Attempts to retrieve an object from a peer
   * @param objectid the object to get
   * @param peer the peer you want to get the object from
   * @returns the object, or rejects if not possible
   */
  async retrieve(objectid: ObjectId, peer: Peer): Promise<Boolean>  { // todo: Promise<ObjectType>
    /* TODO */
    return true
  }
}

export const objectManager = new ObjectManager()
