import { Parse } from "./Parse"
import { Tokenize } from "./Tokenize"
import { Reader } from "./Reader"

export const parse = (code) =>  new Parse(new Tokenize(new Reader(code)))