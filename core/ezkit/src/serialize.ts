import type { TypedArray } from "@zen-core/typist"
import { typed } from "./typed"

export class Serializer {
  private readonly context: Map<object, string> = new Map();

  public serialize(input: unknown, noQuotes = false): string {
    if (input === null) return "null";

    switch (typeof input) {
      case "string":
        return noQuotes ? input : `'${input}'`;
      case "number":
      case "boolean":
        return String(input);
      case "bigint":
        return `${input}n`;
      case "function":
        return this.$function(input);
      default:
        return String(input);
    }
  }

  public $object() {

  }

  public $function(input: Function): string {
    const code = Function.prototype.toString.call(input).trim();
    const name = input.name || "anonymous";

    if (code.endsWith("[native code] }")) return `${name}()[native]`;
    return `${name}(${input.length})${code.replace(/\s*\n\s*/g, "")}`;
  }

  public $array(input: unknown[]): string {
    if (input.length === 0) return "[]";
    return `[${input.map((item) => this.serialize(item)).join(",")}]`;
  }

  public $date(input: Date) {
    return `Date(${input.toISOString()})`;
  }

  public $buffer(input: ArrayBuffer) {
    return `ArrayBuffer[${new Uint8Array(input).join(",")}]`;
  }

  private encode(value: unknown) {
    return ''
  }

  private objectify(object: Record<string, unknown>) { }

  private buildin(type: string, object: unknown) { }

  private entries(type: string, entries: Iterable<[unknown, unknown]>) { }

  private compare(a: unknown, b: unknown): number {
    if (typeof a === typeof b) {
      if (typeof a === "string" && typeof b === "string") {
        return a.localeCompare(b);
      }

      if (typeof a === "number" && typeof b === "number") {
        return a - b;
      }
    }

    return String.prototype.localeCompare.call(
      this.serialize(a, true),
      this.serialize(b, true),
    );
  }
}

for (const type of ["Error", "RegExp", "URL"] as const) {
  Serializer.prototype[`$${type}`] = function (input: unknown): string {
    return `${type}(${input})`;
  };
}

for (const type of [
  "Int8Array", "Uint8Array", "Uint8ClampedArray",
  "Int16Array", "Uint16Array", "Int32Array", "Uint32Array",
  "Float32Array", "Float64Array",
] as const) {
  Serializer.prototype[`$${type}`] = function (input: TypedArray): string {
    return `${type}[${input.join(",")}]`;
  };
}

for (const type of ["BigInt64Array", "BigUint64Array"] as const) {
  Serializer.prototype["$" + type] = function (input: TypedArray) {
    return `${type}[${input.join("n,")}${input.length > 0 ? "n" : ""}]`;
  };
}