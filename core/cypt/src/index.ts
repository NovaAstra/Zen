import sodium from 'libsodium-wrappers';

export class Crypt {
  private key: Uint8Array;

  private constructor(key: Uint8Array) {
    if (key.length !== sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES) {
      throw new Error('Invalid key length');
    }
    this.key = key;
  }

  public static async create(base64Key?: string): Promise<Crypt> {
    await sodium.ready;
    let key: Uint8Array;

    if (base64Key) {
      key = sodium.from_base64(base64Key, sodium.base64_variants.URLSAFE_NO_PADDING);
      if (key.length !== sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES) {
        throw new Error('Invalid key length');
      }
    } else {
      key = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES);
    }

    return new Crypt(key);
  }

  public get base64Key(): string {
    return sodium.to_base64(this.key, sodium.base64_variants.URLSAFE_NO_PADDING);
  }

  private encode(data: Uint8Array): string {
    return sodium.to_base64(data, sodium.base64_variants.URLSAFE_NO_PADDING);
  }

  private decode(base64: string): Uint8Array {
    return sodium.from_base64(base64, sodium.base64_variants.URLSAFE_NO_PADDING);
  }

  public encrypt(obj: object): string {
    const message = sodium.from_string(JSON.stringify(obj));
    const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);

    const cipher = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      message,
      null,
      null,
      nonce,
      this.key
    );

    const full = new Uint8Array(nonce.length + cipher.length);
    full.set(nonce);
    full.set(cipher, nonce.length);

    return this.encode(full);
  }

  public decrypt(encoded: string) {
    const payload = this.decode(encoded);
    const nonceLen = sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;

    const nonce = payload.slice(0, nonceLen);
    const cipher = payload.slice(nonceLen);

    const decrypted = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      cipher,
      null,
      nonce,
      this.key
    );

    return JSON.parse(sodium.to_string(decrypted));
  }
}
