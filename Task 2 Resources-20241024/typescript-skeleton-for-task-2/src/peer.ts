import { logger } from './logger'
import { MessageSocket } from './network'
import { Messages,
         Message,
         HelloMessage,
         PeersMessage, GetPeersMessage,
         IHaveObjectMessage, GetObjectMessage, ObjectMessage,
         GetChainTipMessage, ChainTipMessage,
         ErrorMessage,
         MessageType,
         HelloMessageType,
         PeersMessageType, GetPeersMessageType,
         IHaveObjectMessageType, GetObjectMessageType, ObjectMessageType,
         GetChainTipMessageType, ChainTipMessageType,
         ErrorMessageType,
         GetMempoolMessageType,
         MempoolMessageType
        } from './message'
import { peerManager } from './peermanager'
import { canonicalize } from 'json-canonicalize'
import { db, objectManager } from './object'
import { network } from './network'
import { ObjectId } from './object'
import { chainManager } from './chain'
import { mempool } from './mempool'

const VERSION = '0.10.1'
const NAME = 'Typescript skeleton for task 2' /* TODO */

const INVALID_FORMAT = 'INVALID_FORMAT'
const INVALID_HANDSHAKE = 'INVALID_HANDSHAKE'

// Number of peers that each peer is allowed to report to us
const MAX_PEERS_PER_PEER = 30

function shuffleArray(array: Array<String>) : Array<String> {
  let len = array.length,
      currentIndex;
  for (currentIndex = len - 1; currentIndex > 0; currentIndex--) {
    let randIndex = Math.floor(Math.random() * (currentIndex + 1) );
    var temp = array[currentIndex];
    array[currentIndex] = array[randIndex];
    array[randIndex] = temp;
  }
  return array
}

export class Peer {
  active: boolean = false
  socket: MessageSocket
  handshakeCompleted: boolean = false
  peerAddr: string

  async sendHello() {
    this.sendMessage({
      type: 'hello',
      version: VERSION,
      agent: NAME
    })
  }
  async sendGetPeers() {
    this.sendMessage({
      type: 'getpeers'
    })
  }
  async sendPeers() {
    this.sendMessage({
      type: 'peers',
      peers: shuffleArray([...peerManager.knownPeers]).slice(0, MAX_PEERS_PER_PEER)
    })
  }
  async sendIHaveObject(obj: any) {
    /* TODO */
  }
  async sendObject(obj: any) {
    /* TODO */
  }
  async sendGetObject(objid: ObjectId) {
    /* TODO */
  }
  async sendGetChainTip() {
    /* TODO */
  }
  async sendChainTip(blockid: ObjectId) {
    /* TODO */
  }
  async sendGetMempool() {
    /* TODO */
  }
  async sendMempool(txids: ObjectId[]) {
    /* TODO */
  }
  async sendError(msg: string, name: string) {
    this.sendMessage({
      type: 'error',
      msg: msg,
      name: name
    })
  }
  sendMessage(obj: object) {
    const message: string = canonicalize(obj)

    this.debug(`Sending message: ${message}`)
    this.socket.sendMessage(message)
  }
  async fatalError(msg: string, name: string) {
    await this.sendError(msg, name)
    this.warn(`Peer error: ${name}: ${msg}`)
    this.fail()
  }
  async fail() {
    this.active = false
    this.socket.end()
    peerManager.peerFailed(this.peerAddr)
  }
  async onConnect() {
    this.active = true

    setTimeout(() => {
      if (!this.handshakeCompleted) {
        logger.info(
            `Peer ${this.peerAddr} failed to handshake within time limit.`
        )
        this.fatalError('No handshake within time limit.', INVALID_HANDSHAKE)
      }
    }, 20000)

    await this.sendHello()
    await this.sendGetPeers()
  }
  async onMessage(message: string) {
    this.debug(`Message arrival: ${message}`)

    let msg: object = {}

    try {
      msg = JSON.parse(message)
      this.debug(`Parsed message into: ${JSON.stringify(msg)}`)
    }
    catch {
      return await this.fatalError(`Failed to parse incoming message as JSON: ${message}`, INVALID_FORMAT)
    }
    // for now, ignore messages that have a valid type but that we don't yet know how to parse
    // TODO: remove
    if('type' in msg)
    {
      if(typeof msg.type === 'string')
      {
        if(['ihaveobject', 'getobject', 'object', 'getchaintip', 'chaintip', 'getmempool', 'mempool'].includes(msg.type))
          return
      }
    }

    if (!Message.guard(msg)) {
      const validation = Message.validate(msg)
      return await this.fatalError(
          `The received message does not match one of the known message formats: ${message}
         Validation error: ${JSON.stringify(validation)}`, INVALID_FORMAT
      )
    }
    if (!this.handshakeCompleted) {
      if (HelloMessage.guard(msg)) {
        return this.onMessageHello(msg)
      }
      return await this.fatalError(`Received message ${message} prior to "hello"`, INVALID_HANDSHAKE)
    }
    Message.match(
        async () => {
          return await this.fatalError(`Received a second "hello" message, even though handshake is completed`, INVALID_HANDSHAKE)
        },
        this.onMessageGetPeers.bind(this),
        this.onMessagePeers.bind(this),
        /*this.onMessageIHaveObject.bind(this),
        this.onMessageGetObject.bind(this),
        this.onMessageObject.bind(this),
        this.onMessageGetChainTip.bind(this),
        this.onMessageChainTip.bind(this),
        this.onMessageGetMempool.bind(this),
        this.onMessageMempool.bind(this),*/
        this.onMessageError.bind(this)
    )(msg)
  }

  async onMessageHello(msg: HelloMessageType) {
    let regex = new RegExp("^0\\.10\\.\\d$");
    if (!regex.test(msg.version)) {
      return await this.fatalError(`You sent an incorrect version (${msg.version}), which is not compatible with this node's version ${VERSION}.`, INVALID_FORMAT)
    }
    this.info(`Handshake completed. Remote peer running ${msg.agent} at protocol version ${msg.version}`)
    this.handshakeCompleted = true
  }
  async onMessagePeers(msg: PeersMessageType) {
    if(msg.peers.length > 30)
      return await this.fatalError(`Send too many peers`, INVALID_FORMAT)

    for (const peer of msg.peers) {
      this.info(`Remote party reports knowledge of peer ${peer}`)

      // check if this peer is syntactically valid
      const peerParts = peer.split(':')
      if (peerParts.length !== 2) {
        return await this.fatalError(`Remote party reported knowledge of invalid peer ${peer}, which is not in the host:port format`, INVALID_FORMAT)
      }
      const [host, portStr] = peerParts
      const port = +portStr

      if (!(port >= 1 && port <= 65535)) {
        return await this.fatalError(`Remote party reported knowledge of peer ${peer} with invalid port number ${port}`, INVALID_FORMAT)
      }
      if (!peerManager.isValidHostname(host)) {
        return await this.fatalError(`Remote party reported knowledge of invalid peer ${peer}`, INVALID_FORMAT)
      }
    }

    for (const peer of msg.peers) {
      this.info(`Remote party reports knowledge of peer ${peer}`)

      peerManager.peerDiscovered(peer)
    }
  }
  async onMessageGetPeers(msg: GetPeersMessageType) {
    this.info(`Remote party is requesting peers. Sharing.`)
    await this.sendPeers()
  }
  async onMessageIHaveObject(msg: IHaveObjectMessageType) {
    /* TODO */
  }
  async onMessageGetObject(msg: GetObjectMessageType) {
    /* TODO */
  }
  async onMessageObject(msg: ObjectMessageType) {
    /* TODO */
  }
  async onMessageGetChainTip(msg: GetChainTipMessageType) {
    /* TODO */
  }
  async onMessageChainTip(msg: ChainTipMessageType) {
    /* TODO */
  }
  async onMessageGetMempool(msg: GetMempoolMessageType) {
    /* TODO */
  }
  async onMessageMempool(msg: MempoolMessageType) {
    /* TODO */
  }
  async onMessageError(msg: ErrorMessageType) {
    this.warn(`Peer reported error: ${msg.name}: ${msg.msg}`)
  }
  log(level: string, message: string, ...args: any[]) {
    logger.log(
        level,
        `[peer ${this.socket.peerAddr}:${this.socket.netSocket.remotePort}] ${message}`,
        ...args
    )
  }
  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args)
  }
  info(message: string, ...args: any[]) {
    this.log('info', message, ...args)
  }
  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args)
  }
  constructor(socket: MessageSocket, peerAddr: string) {
    this.socket = socket
    this.peerAddr = peerAddr

    socket.netSocket.on('connect', this.onConnect.bind(this))
    socket.netSocket.on('error', err => {
      this.warn(`Socket error: ${err}`)
      this.fail()
    })
    socket.on('message', this.onMessage.bind(this))
  }
}
