
const  blake = require('blakejs')
/**
 * returns the hash of given string
 * @param str 
 */
export function hash(str: string):string {
  /* TODO */
  return blake.blake2sHex(str)
  
}
