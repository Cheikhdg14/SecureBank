package com.securebank;

import com.securebank.crypto.AesEncryptor;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AesEncryptorTest {

    private final AesEncryptor encryptor = new AesEncryptor("SecureBank16ByteKSecureBank16Byt");

    @Test
    void encryptDecrypt_shouldReturnOriginal() {
        String original = "1500000";
        String encrypted = encryptor.encrypt(original);
        assertNotEquals(original, encrypted);
        assertEquals(original, encryptor.decrypt(encrypted));
    }

    @Test
    void encrypt_shouldProduceDifferentCiphertexts_forSamePlaintext() {
        String a = encryptor.encrypt("solde");
        String b = encryptor.encrypt("solde");
        assertNotEquals(a, b);
    }
}
