/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

const SHA256 = require('crypto-js/sha256');
const LevelSandbox = require('./LevelSandbox.js');
const Block = require('./Block.js');

class Blockchain {
  constructor() {
    this.bd = new LevelSandbox();
    this.addBlock(new Block('Genesis Block!'));
  }

  // Get block height, it is auxiliar method that return the height of the blockchain
  async getBlockHeight() {
    try {
      const blockCount = await this.bd.getBlocksCount();
      return blockCount - 1;
    } catch (error) {
      console.error(error);
    }
  }

  // Add new block
  async addBlock(block) {
    try {
      const chainHeight = await this.getBlockHeight();
      block.height = chainHeight + 1;

      block.timeStamp = new Date()
        .getTime()
        .toString()
        .slice(0, -3);

      if (block.height > 0) {
        const prevBlock = await this.getBlock(chainHeight);
        block.previousBlockHash = prevBlock.hash;
      }
      block.hash = SHA256(JSON.stringify(block)).toString();

      return this.bd.addLevelDBData(
        block.height.toString(),
        JSON.stringify(block),
      );
    } catch (error) {
      console.error(error);
    }
  }

  // Get Block By Height
  async getBlock(height) {
    try {
      return JSON.parse(await this.bd.getLevelDBData(height.toString()));
    } catch (error) {
      console.error(error);
    }
  }

  // Validate if Block is being tampered by Block Height
  async validateBlock(height) {
    try {
      const block = await this.getBlock(height);
      const blockHash = block.hash;
      block.hash = '';
      const validBlockHash = SHA256(JSON.stringify(block)).toString();
      if (blockHash === validBlockHash) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Validate Blockchain
  async validateChain() {
    try {
      const errorLog = [];
      for (let i = 0; i < this.validateChain.length - 1; i++) {
        if (!this.validateBlock(i)) {
          errorLog.push(i);
        }
        const block = await this.getBlock(i);
        const nextBlock = await this.getBlock(i + 1);
        if (nextBlock && block.hash !== nextBlock.previousBlockHash) {
          errorLog.push(i);
        }
      }
      return errorLog;
    } catch (error) {
      console.error(error);
    }
  }

  // Utility Method to Tamper a Block for Test Validation
  // This method is for testing purpose
  _modifyBlock(height, block) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.bd
        .addLevelDBData(height.toString(), JSON.stringify(block).toString())
        .then(blockModified => {
          resolve(blockModified);
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }
}

module.exports = Blockchain;
