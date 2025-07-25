import type { TypedArray } from "@zen-core/typist"
import { typed } from "./typed"

const toString = Object.prototype.toString;

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

  public $object(object: object): string {
    const cached = this.context.get(object);
    if (cached !== undefined) return cached;

    const id = `#${this.context.size}`;
    this.context.set(object, id);

    const serialized = this.objectify(object);
    
    this.context.set(object, serialized);
    return serialized;
  }

  public $function(input: Function): string {
    const code = toString.call(input).trim();
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

  private $set(set: Set<any>) {
    return `Set${this.$array(Array.from(set).sort((a, b) => this.compare(a, b)))}`;
  }

  private $map(map: Map<unknown, unknown>) {
    return this.entries("Map", map.entries());
  }

  private encode(value: unknown) {
    return ''
  }

  private objectify(object: object) {
    const type = typed(object);
    if (type !== "Object") return this.buildin(type, object);

    const ctor = (object as Record<string, unknown>).constructor;
    const name = ctor === Object || !ctor ? "" : ctor.name;

    if (name && (globalThis as any)[name] === ctor) {
      return this.buildin(name, object);
    }
    if (typeof (object as any).toJSON === "function") {
      const json = (object as any).toJSON();
      return name + (json && typeof json === "object" ? this.$object(json) : `(${this.serialize(json)})`);
    }

    const keys = Object.keys(object).sort((a, b) => a.localeCompare(b));
    const body = keys.map(key => `${key}:${this.serialize((object as Record<string, unknown>)[key])}`).join(",");
    return `${name}{${body}}`;
  }

  private buildin(type: string, value: unknown): string {
    const fn = Reflect.get(this, `$${type}`) as ((arg: unknown) => string) | undefined;
    if (typeof fn === "function") return fn.call(this, value);

    if (
      value != null &&
      typeof value === 'object' &&
      typeof (value as any).entries === 'function'
    ) {
      return this.entries(type, (value as any).entries());
    }

    throw new Error(
      [
        `Cannot serialize built-in type "${type}".`,
        `- No method "$${type}" found on serializer.`,
        `- The value does not have a valid .entries() method.`,
        `- Received: ${Object.prototype.toString.call(value)}`
      ].join('\n')
    );

  }

  private entries(type: string, entries: Iterable<[unknown, unknown]>): string {
    const sorted = Array.from(entries).sort((a, b) => this.compare(a[0], b[0]));
    const body = sorted
      .map(([key, value]) => `${this.serialize(key, true)}:${this.serialize(value)}`)
      .join(",");
    return `${type}{${body}}`;
  }

  private compare(a: unknown, b: unknown): number {
    if (typeof a === typeof b) {
      if (typeof a === "string") return a.localeCompare(b as string);
      if (typeof a === "number") return (a as number) - (b as number);
    }

    return this.serialize(a, true).localeCompare(this.serialize(b, true));
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
  Serializer.prototype[`$${type}`] = function (input: TypedArray) {
    return `${type}[${input.join("n,")}${input.length > 0 ? "n" : ""}]`;
  };
}