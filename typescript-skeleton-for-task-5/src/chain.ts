import { Block } from "./block";
import { logger } from "./logger";
import { mempool } from "./mempool";
import { db } from "./object";

/**
 * Handles the blockchain state
 */
class ChainManager {
  longestChainHeight: number = 0
  longestChainTip: Block | null = null

  async init() {
    let tip, height, inited = false

    try {
      [tip, height] = await db.get('longestchain')
      logger.debug(`Retrieved cached longest chain tip ${tip.blockid} at height ${height}.`)
    }
    catch {
      tip = await Block.makeGenesis()
      height = 0
      logger.debug(`No cached longest chain exists. Initializing to genesis ${tip.blockid} at height ${height}.`)
      inited = true
    }
    this.longestChainTip = await Block.fromNetworkObject(tip)
    this.longestChainHeight = height
    if (inited) {
      await this.save()
    }
    logger.debug(`Chain manager initialized.`)
  }
  async save() {
    await db.put('longestchain', [this.longestChainTip, this.longestChainHeight])
  }
  async onValidBlockArrival(block: Block) {
    if (!block.valid) {
      throw new Error(`Received onValidBlockArrival() call for invalid block ${block.blockid}`)
    }
    const height = block.height

    if (this.longestChainTip === null) {
      throw new Error('We do not have a local chain to compare against')
    }
    if (height === undefined) {
      throw new Error(`We received a block ${block.blockid} we thought was valid, but had no calculated height.`)
    }
    if (height > this.longestChainHeight) {
      // TODO: reorg mempool?
      if (block.stateAfter) {
        logger.debug(`block ${block.blockid} arrived to block chain`)
        mempool.state = block.stateAfter
        logger.debug(`Mempool state set to block ${block.blockid} stateafter`)
        try {
          logger.debug(`Forking reorgs for ${block.blockid} against the longest chain ${this.longestChainTip.blockid}`)
          const [lca, shortFork, longFork] = await Chain.getForks(this.longestChainTip, block);
          logger.debug(`Applying shortFork to the new mempool state`)
          logger.debug(`Mempool state before short fork application:${mempool.state}`)
          for (const shortBlock of shortFork.blocks) {
            const transactions = await shortBlock.getTxs();
            await mempool.state.applyMultipleMempool(transactions);
          }
          logger.debug(`Mempool state after short fork application:${mempool.state}`)

        } catch {
          logger.debug(`failed to get fork and apply short forks on the state of ${block.blockid}`)
        }

        try {
          logger.debug(`Applying old mempool transactions to state after block ${block.blockid} and reorg (if happened)`)
          logger.debug(`Old mempool transactions: ${mempool.txids}`)
          logger.debug(`Mempool state before old mempool transaction application:${mempool.state}`)
          const transactions = await mempool.getTxObjects();
          await mempool.state.applyMultipleMempool(transactions);
          logger.debug(`Mempool state after old mempool transaction application:${mempool.state}`)
        } catch {
          logger.debug(`failed to apply transactions of the mempool to the new block state`)
        }

        try {
          mempool.txids = [];
          mempool.usedOutpoints = new Set<string>()
          await mempool.save()
        } catch (error) {
          
        }

      }
      logger.debug(`New longest chain has height ${height} and tip ${block.blockid}`)
      this.longestChainHeight = height
      this.longestChainTip = block
      
      await this.save()
    }
  }
}

/**
 * Represents the current block chain state as a series of blocks
 */
export class Chain {
  blocks: Block[]

  constructor(blocks: Block[]) {
    this.blocks = blocks
  }

  /**
   * Find the lowest common ancestor (LCA) in two chains
   * @param b1 a block belong to the current chain
   * @param b2 a block belonging to a new, longer chain
   * @returns [lca, lca..b1, lca..b2]
   */
  static async getForks(b1: Block, b2: Block): Promise<[Block, Chain, Chain]> {
    // TODO

    async function getAncestry(block: Block): Promise<Block[]> {
      const ancestry: Block[] = [];
      let current: Block | null = block;

      while (current) {
        ancestry.push(current);
        current = await current.loadParent();
      }

      return ancestry;
    }

    // Get ancestries of both blocks
    const b1Ancestry = await getAncestry(b1);
    const b2Ancestry = await getAncestry(b2);

    // Reverse the arrays to start from the genesis block
    b1Ancestry.reverse();
    b2Ancestry.reverse();

    let lca: Block | null = null;
    let shortFork: Chain = new Chain([]);
    let longFork: Chain = new Chain([]);

    // Find the lowest common ancestor
    const minLength = Math.min(b1Ancestry.length, b2Ancestry.length);

    for (let i = 0; i < minLength; i++) {
      if (b1Ancestry[i].blockid === b2Ancestry[i].blockid) {
        lca = b1Ancestry[i];
      } else {
        break;
      }
    }

    if (!lca) {
      throw new Error("No common ancestor found");
    }

    // Get the forks
    shortFork = new Chain(b1Ancestry.slice(b1Ancestry.indexOf(lca) + 1).reverse());
    longFork = new Chain(b2Ancestry.slice(b2Ancestry.indexOf(lca) + 1).reverse());

    return [lca, shortFork, longFork];
  }
}

export const chainManager = new ChainManager()
