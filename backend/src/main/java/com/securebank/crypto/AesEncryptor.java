package com.securebank.crypto;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Chiffrement AES-256-GCM symétrique.
 * Format de sortie : Base64(IV[12 bytes] + CipherText + Tag[16 bytes])
 */
@Component
public class AesEncryptor {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;

    private final SecretKey secretKey;

    public AesEncryptor(@Value("${app.crypto.aes-key}") String rawKey) {
        byte[] keyBytes = rawKey.getBytes();
        // Pad/truncate to 32 bytes (256-bit)
        byte[] key = new byte[32];
        System.arraycopy(keyBytes, 0, key, 0, Math.min(keyBytes.length, 32));
        this.secretKey = new SecretKeySpec(key, "AES");
    }

    public String encrypt(String plaintext) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BITS, iv));

            byte[] cipherText = cipher.doFinal(plaintext.getBytes());
            byte[] result = new byte[IV_LENGTH + cipherText.length];
            System.arraycopy(iv, 0, result, 0, IV_LENGTH);
            System.arraycopy(cipherText, 0, result, IV_LENGTH, cipherText.length);

            return Base64.getEncoder().encodeToString(result);
        } catch (Exception e) {
            throw new RuntimeException("Erreur chiffrement AES", e);
        }
    }

    public String decrypt(String encryptedBase64) {
        try {
            byte[] decoded = Base64.getDecoder().decode(encryptedBase64);
            byte[] iv = new byte[IV_LENGTH];
            System.arraycopy(decoded, 0, iv, 0, IV_LENGTH);

            byte[] cipherText = new byte[decoded.length - IV_LENGTH];
            System.arraycopy(decoded, IV_LENGTH, cipherText, 0, cipherText.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BITS, iv));

            return new String(cipher.doFinal(cipherText));
        } catch (Exception e) {
            throw new RuntimeException("Erreur déchiffrement AES", e);
        }
    }
}
