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

  isValidDNSEntry(addr: string): boolean {
    // # TODO
    const regex = /^[a-zA-Z\d\.\-\_]{3,50}$/;
    let isValidDomain = true
    if (!regex.test(addr)) {
      isValidDomain = false;
    }

    if (addr.indexOf('.') === -1 || addr.startsWith('.') || addr.endsWith('.')) {
      isValidDomain = false;
    }

    const hasLetter = /[a-zA-Z]/.test(addr);
    if (!hasLetter) {
      isValidDomain = false;
    }
    return isValidDomain
  }

  isValidIpv4(addr: string): boolean {
    // # TODO
    const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d{2}|\d{1,2})\.(25[0-5]|2[0-4]\d|1\d{2}|\d{1,2})\.(25[0-5]|2[0-4]\d|1\d{2}|\d{1,2})\.(25[0-5]|2[0-4]\d|1\d{2}|\d{1,2})$/
    return ipv4Regex.test(addr)
  }

  isValidHostname(addr: string): boolean {
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
