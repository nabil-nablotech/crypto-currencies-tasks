import { Block } from "./block";
import { logger } from "./logger";
import { mempool } from "./mempool";
import { BlockObjectType } from "./message";
import { db } from "./object";

/**
 * Handles the blockchain state
 */
class ChainManager {
  /* TODO */
  chain: Block[]

  constructor() {
    this.chain = []
  }

  async init() {
    /* TODO */
  }
  async save() {
    /* TODO */
    const blockObjects:BlockObjectType[] = []
    this.chain.forEach((block)=>{
      blockObjects.push(block.toNetworkObject())
    })
    return await db.put(`chain`, blockObjects)
  }
  async onValidBlockArrival(block: Block) {
    /* TODO */
    this.chain.push(block)
  }
}

/**
 * Represents the current block chain state as a series of blocks
 */
export class Chain {
  /* TODO */
  

  constructor(/* TODO */) {
    /* TODO */
  }

  async save() {

  }
  /**
   * Find the lowest common ancestor (LCA) in two chains
   * @param b1 a block belong to the current chain
   * @param b2 a block belonging to a new, longer chain
   * @returns [lca, lca..b1, lca..b2]
   */
  // static async getForks(b1: Block, b2: Block): Promise<[Block, Chain, Chain]> {
    // TODO
    // const lca = new Block();
    // const shortFork = new Block();
    // const longFork = new Block();

    // return [lca, shortFork, longFork]
  // }
}

export const chainManager = new ChainManager()
