package com.securebank.crypto;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.HexFormat;

@Component
public class HmacUtil {

    private static final String ALGORITHM = "HmacSHA256";
    private final byte[] keyBytes;

    public HmacUtil(@Value("${app.jwt.secret}") String secret) {
        this.keyBytes = secret.getBytes();
    }

    public String compute(String... parts) {
        try {
            String data = String.join("|", parts);
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(new SecretKeySpec(keyBytes, ALGORITHM));
            byte[] hash = mac.doFinal(data.getBytes());
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Erreur HMAC", e);
        }
    }

    public boolean verify(String expected, String... parts) {
        return expected.equals(compute(parts));
    }
}
