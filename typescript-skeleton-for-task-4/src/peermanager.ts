import { db } from './object'
import { logger } from './logger'
import isValidHostname from 'is-valid-hostname'

const BOOTSTRAP_PEERS: string[] = [
  '128.130.122.101:18018'
]

class PeerManager {
  knownPeers: Set<string> = new Set()

  async load() {
    try {
      this.knownPeers = new Set(await db.get('peers'))
      logger.debug(`Loaded known peers: ${[...this.knownPeers]}`)
    }
    catch {
      logger.info(`Initializing peers database`)
      this.knownPeers = new Set(BOOTSTRAP_PEERS)
      await this.store()
    }
  }
  async store() {
    await db.put('peers', [...this.knownPeers])
  }

  isValidDNSEntry(addr: string) : boolean {
    let regex = new RegExp("^[a-zA-Z\\d\\.\\-\\_]{3,50}$");
    if (!regex.test(addr))
       return false

    if (addr.search(/[a-zA-Z]/) < 0)
      return false

    if (addr.substring(1, addr.length - 1).search(/\./) < 0)
      return false
    return true
  }

  isValidIpv4(addr: string) : boolean {
    let regex = new RegExp("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$");
    if (!regex.test(addr))
      return false

    const ipParts = addr.split('.')
    return !(+ipParts[0] > 255 || +ipParts[1] > 255 || +ipParts[2] > 255 || +ipParts[3] > 255);
  }


  isValidHostname(addr: string) : boolean {
    return this.isValidIpv4(addr) || this.isValidDNSEntry(addr)
  }

  peerDiscovered(peerAddr: string) {
    this.knownPeers.add(peerAddr)
    this.store() // intentionally delayed await
    logger.info(`Known peers: ${this.knownPeers.size}`)
  }
  peerFailed(peerAddr: string) {
    logger.warn(`Removing known peer, as it is considered faulty`)
    this.knownPeers.delete(peerAddr)
    this.store() // intentionally delayed await
    logger.info(`Known peers: ${this.knownPeers.size}`)
  }
}

export const peerManager = new PeerManager()
