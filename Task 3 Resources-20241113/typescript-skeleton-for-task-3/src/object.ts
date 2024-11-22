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
      },
      async (obj: BlockObjectType) => {
        const block: Block = Block.fromNetworkObject(obj)
        logger.debug(`Validating block: ${block.blockid}`)
        await block.validate()
        mempool.save()
      }
    )(object)
  }

  /**
   * Attempts to retrieve an object from a peer
   * @param objectid the object to get
   * @param peer the peer you want to get the object from
   * @returns the object, or rejects if not possible
   */
  async retrieve(objectid: ObjectId, peer: Peer): Promise<ObjectType> { // todo: Promise<ObjectType>
    /* TODO */
    return new Promise<ObjectType>((resolve, reject) => {
      let currentMillisecond = 0
      peer.sendGetObject(objectid)
      const interval = setInterval(async () => {
        const exists = await this.exists(objectid)
        if (exists) {
          clearInterval(interval)
          const object = await this.get(objectid)
          resolve(object)
        } else if (currentMillisecond != OBJECT_AVAILABILITY_TIMEOUT) {
          currentMillisecond += 1000
        } else if (currentMillisecond == OBJECT_AVAILABILITY_TIMEOUT) {
          clearInterval(interval)
          peer.sendError(`Couldn't getObject object:${objectid} from ${peer.socket.peerAddr} within ${OBJECT_AVAILABILITY_TIMEOUT / 1000} seconds`, UNFINDABLE_OBJECT)
          reject(`Couldn't getObject from ${peer.socket.peerAddr} within ${OBJECT_AVAILABILITY_TIMEOUT / 1000} seconds`)

        }
      })
    })

  }
}

export const objectManager = new ObjectManager()
