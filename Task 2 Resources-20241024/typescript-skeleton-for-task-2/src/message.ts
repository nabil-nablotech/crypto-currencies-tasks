import {
  Literal,
  Record, Array, Union,
  String, Number,
  Static, Null, Unknown, Optional
} from 'runtypes'

/**
 * This file defines all Objects and Message Types that can be conveniently be used later
 */

const Hash = String.withConstraint(s => /^[0-9a-f]{64}$/.test(s)) /* TODO */
const Sig = String.withConstraint(s => /^[0-9a-f]{128}$/.test(s)) /* TODO */
const PK = String.withConstraint(s => /^[0-9a-f]{64}$/.test(s)) /* TODO */
const NonNegative = Number.withConstraint(n => n > 0) /* TODO */
const WholeNumber = Number.withConstraint(n => n >= 0)
const Coins = NonNegative

/**
 * this defines an OutpointObject to be a Record (something like a dictionary) 
 *  containing properties txid of type Hash and index of type NonNegative  
 */
export const OutpointObject = Record({
  txid: Hash,
  index: WholeNumber
})

/**
 * this exports a type for OutpointObject
 * you an use these as an example to define the other types
 */
export type OutpointObjectType = Static<typeof OutpointObject>

export const TransactionInputObject = Record({
  outpoint: OutpointObject,
  sig: Union(Sig, Null)
})
export type TransactionInputObjectType = Static<typeof TransactionInputObject>

export const TransactionOutputObject = Record({
  pubkey: PK,
  value: Coins
})
export type TransactionOutputObjectType = Static<typeof TransactionOutputObject>

/* TODO */
export const CoinbaseTransactionObject = Record({
  type: Literal('transaction'),
  height: WholeNumber,
  outputs: Array(TransactionOutputObject)
})
export const SpendingTransactionObject = Record({
  type: Literal('transaction'),
  inputs: Array(TransactionInputObject).withConstraint(item => item.length > 0),
  outputs: Array(TransactionOutputObject)
})
export const TransactionObject = Union(SpendingTransactionObject, CoinbaseTransactionObject)
export type TransactionObjectType = Static<typeof TransactionObject>

export const BlockObject = Record({
  type: Literal('block'),
  txids: Array(Hash),
  nonce: String,
  previd: Union(Hash, Null),
  created: Number,
  T: Hash,
  miner: Optional(String), /* TODO: enforce checks */
  note: Optional(String) /* TODO: enforce checks */
})
export type BlockObjectType = Static<typeof BlockObject>


export const HelloMessage = Record({
  type: Literal('hello'),
  version: String,
  agent: String
})
export type HelloMessageType = Static<typeof HelloMessage>

export const GetPeersMessage = Record({
  type: Literal('getpeers')
})
export type GetPeersMessageType = Static<typeof GetPeersMessage>

export const PeersMessage = Record({
  type: Literal('peers'),
  peers: Array(String)
})
export type PeersMessageType = Static<typeof PeersMessage>

export const GetObjectMessage = Record({
  type: Literal('getobject'),
  objectid: String
})
export type GetObjectMessageType = Static<typeof GetObjectMessage>
export const IHaveObjectMessage = Record({
  type: Literal('ihaveobject'),
  objectid: String
})
export type IHaveObjectMessageType = Static<typeof IHaveObjectMessage>

export const Object = Union(BlockObject, TransactionObject)
export type ObjectType = Static<typeof Object>

export const ObjectMessage = Record({
  type: Literal('object'),
  object: Object
})
export type ObjectMessageType = Static<typeof ObjectMessage>

export const GetChainTipMessage = String
export type GetChainTipMessageType = String

export const ChainTipMessage = String
export type ChainTipMessageType = String

export const GetMempoolMessage = String
export type GetMempoolMessageType = String

export const MempoolMessage = String
export type MempoolMessageType = String

export const ErrorMessage = Record({
  type: Literal('error'),
  msg: String,
  name: Union(Literal('INVALID_FORMAT'), Literal('INVALID_HANDSHAKE'), Literal('INVALID_TX_CONSERVATION'), Literal('INVALID_TX_SIGNATURE'), Literal('INVALID_TX_OUTPOINT'), Literal('INVALID_BLOCK_POW'), Literal('INVALID_BLOCK_TIMESTAMP'), Literal('INVALID_BLOCK_COINBASE'), Literal('INVALID_GENESIS'), Literal('UNKNOWN_OBJECT'), Literal('UNFINDABLE_OBJECT'), Literal('INVALID_ANCESTRY'))
})
export type ErrorMessageType = Static<typeof ErrorMessage>

export const Messages = [
  HelloMessage,
  GetPeersMessage, PeersMessage,
  IHaveObjectMessage, GetObjectMessage, ObjectMessage,
  /*GetChainTipMessage, ChainTipMessage,
  GetMempoolMessage, MempoolMessage,*/
  ErrorMessage
]
export const Message = Union(
  HelloMessage,
  GetPeersMessage, PeersMessage,
  IHaveObjectMessage, GetObjectMessage, ObjectMessage,
  /*GetChainTipMessage, ChainTipMessage,
  GetMempoolMessage, MempoolMessage,*/
  ErrorMessage
)
export type MessageType = Static<typeof Message>
