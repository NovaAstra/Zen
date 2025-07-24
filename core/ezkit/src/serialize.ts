import type { TypedArray } from "@zen-core/typist"

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

  private objectify(object: Record<string, unknown>) {
    const tag = Object.prototype.toString.call(object);

    // 不是 [object Object]，当作内建类型处理
    if (tag !== "[object Object]") {
      const type = tag.length < 10 ? `unknown:${tag}` : tag.slice(8, -1);
      return this.buildin(type, object);
    }

    const ctor = object.constructor;
    const name = ctor === Object || ctor === undefined ? "" : ctor.name;

    // 如果是全局构造函数实例（如 Map、Set 等）
    if (name && (globalThis as any)[name] === ctor) {
      return this.buildin(name, object);
    }

    // 支持 toJSON 且是自定义对象
    if (typeof (object as any).toJSON === "function") {
      const json = (object as any).toJSON();
      return name + (
        json !== null && typeof json === "object"
          ? this.$object()
          : `(${this.serialize(json)})`
      );
    }

    // 常规对象序列化
    const keys = Object.keys(object).sort((a, b) => a.localeCompare(b));
    const body = keys
      .map(key => `${key}:${this.serialize(object[key])}`)
      .join(",");

    return `${name}{${body}}`;
  }

  private buildin(type: string, value: unknown): string {
    const name = `$${type}` as keyof this;

    const handler = this[name];
    if (typeof handler === "function") {
      return (handler as (arg: unknown) => string).call(this, value);
    }

    if (
      typeof value === "object" &&
      value !== null &&
      typeof (value as any).entries === "function"
    ) {
      return this.entries(type, (value as any).entries());
    }

    throw new Error(`Cannot serialize type: ${type}`);
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