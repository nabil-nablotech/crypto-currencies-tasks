export type ObjectId = string

import level from 'level-ts'
import { canonicalize } from 'json-canonicalize'
import {
  Object, ObjectType,
  TransactionObjectType, BlockObjectType,
  TransactionObject,
  SpendingTransactionObject
} from './message'
import { Transaction } from './transaction'
import { Block } from './block'
import { logger } from './logger'
import { hash } from './crypto/hash'
import { INVALID_ANCESTRY, INVALID_FORMAT, INVALID_TX_CONSERVATION, INVALID_TX_OUTPOINT, INVALID_TX_SIGNATURE, Peer } from './peer'
import { Deferred, delay, resolveToReject } from './promise'
import { mempool } from './mempool'
import { ver } from './crypto/signature'
import { Static } from 'runtypes'

export const db = new level('./db')
const OBJECT_AVAILABILITY_TIMEOUT = 5000 // ms

/**
 * Interfaces the database
 */
class ObjectManager {
  /* TODO */

  id(obj: any) {
    /* TODO */
    const objectString: string = canonicalize(obj)
    return hash(objectString)
  }

  /**
   * Checks if you know about this object
   * @param objectid 
   */
  async exists(objectid: ObjectId): Promise<boolean> {
    /* TODO */
    try {
      await db.get(objectid)
      return true
    } catch (error) {
      return false
    }
  }

  async get(objectid: ObjectId) {
    /* TODO */
    return await db.get(objectid)
  }

  async del(objectid: ObjectId) {
    /* TODO */
  }

  async put(object: any) {
    /* TODO */
    const objectid = this.id(object)
    await db.put(objectid, { ...object })
  }

  async validate(object: ObjectType, peer: Peer): Promise<boolean> {
    /* TODO */
    let inputSum = 0
    let outputSum = 0
    if (SpendingTransactionObject.guard(object)) {
      const message: Static<typeof SpendingTransactionObject> = JSON.parse(JSON.stringify(object))
      message.inputs.forEach(input => input.sig = null)
      const messageString = canonicalize(message)
      for (const input of object.inputs) {
        try {
          const referencedObject = await this.retrieve(input.outpoint.txid, peer)
          if (referencedObject.type == "block") {
            peer.warn(`Invalid object type for the referenced object: ${input.outpoint.txid}.`)
            peer.fatalError(`A block was referenced at a position where a transaction was expected.`, INVALID_FORMAT)
            return false
          }

          try {
            inputSum += referencedObject.outputs[input.outpoint.index].value
            if (input.sig !== null) {
              const isValidSignature = ver(input.sig, messageString, referencedObject.outputs[input.outpoint.index].pubkey);
              if (!isValidSignature) {
                peer.warn(`Invalid signature of the input with outpoint txid: ${input.outpoint.txid}.`)
                peer.fatalError(`Signature is not valid.`, INVALID_TX_SIGNATURE)
                return false
              }
            }

          } catch {
            peer.warn(`Referenced object: ${input.outpoint.txid} has no output with index ${input.outpoint.index}.`)
            peer.fatalError(`A transaction references an outpoint (${input.outpoint.txid}, ${input.outpoint.index}) but there is no such outpoint in the transaction with id ${input.outpoint.txid}.`, INVALID_TX_OUTPOINT)
            return false
          }

        } catch {
          peer.warn(`Referenced object: ${input.outpoint.txid} not found.`)
          peer.fatalError(`A block was referenced at a position where a transaction was expected.`, INVALID_ANCESTRY)
          return false
        }
      }

      for (const output of object.outputs) {
        outputSum += output.value
      }

      if (inputSum < outputSum) {
        peer.warn(`The transaction creates outputs holding more coins than the sum of the inputs.`)
        peer.fatalError(`The transaction creates outputs holding more coins than the sum of the inputs.`, INVALID_TX_CONSERVATION)
        return false
      }
    }

    return true

  }

  /**
   * Attempts to retrieve an object from a peer
   * @param objectid the object to get
   * @param peer the peer you want to get the object from
   * @returns the object, or rejects if not possible
   */
  async retrieve(objectid: ObjectId, peer: Peer): Promise<ObjectType> {
    let counter = 0;
    let object: ObjectType;

    try {
      // Initial attempt to get the object
      object = await this.get(objectid);
      return object;
    } catch {
      // Send a message to the peer if the initial attempt fails
      peer.sendMessage({
        type: 'getobject',
        objectid: objectid
      });

      // Return a promise that resolves when the object is retrieved or rejects after 20 tries
      return new Promise((resolve, reject) => {
        const intervalId = setInterval(async () => {
          counter += 1;
          try {
            object = await this.get(objectid);
          } catch {
            peer.warn(`Couldn't fetch object in the ${counter} attempt`)
          }

          if (object) {
            clearInterval(intervalId);
            resolve(object);
          }

          if (counter === 20) {
            clearInterval(intervalId);
            reject(new Error("Failed to retrieve object after 20 attempts"));
          }
        }, 2000);
      });
    }
  }
}

export const objectManager = new ObjectManager()
