package com.securebank.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void send(String to, String subject, String body) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromEmail);
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(body);
        mailSender.send(msg);
    }

    public void sendIpAlert(String to, String fullName, String ip) {
        send(to,
            "SecureBank – Connexion depuis une nouvelle adresse IP",
            "Bonjour " + fullName + ",\n\n" +
            "Une connexion à votre compte SecureBank a été détectée depuis une nouvelle adresse IP : " + ip + "\n" +
            "Si vous êtes bien à l'origine de cette connexion, vous pouvez ignorer cet email.\n" +
            "Dans le cas contraire, changez immédiatement votre mot de passe et contactez l'administrateur.\n\n" +
            "L'équipe SecureBank");
    }

    public void sendPasswordResetEmail(String to, String fullName, String token) {
        send(to,
            "SecureBank – Réinitialisation de votre mot de passe",
            "Bonjour " + fullName + ",\n\n" +
            "Vous avez demandé la réinitialisation de votre mot de passe SecureBank.\n" +
            "Utilisez le code suivant pour réinitialiser votre mot de passe (valable 30 minutes) :\n\n" +
            token + "\n\n" +
            "Si vous n'avez pas fait cette demande, ignorez cet email.\n\n" +
            "L'équipe SecureBank");
    }

    public void sendTransferConfirmation(String to, String fullName,
                                          String reference, String amount,
                                          String destination) {
        send(to,
            "SecureBank – Confirmation de virement",
            "Bonjour " + fullName + ",\n\n" +
            "Votre virement a été effectué avec succès.\n\n" +
            "Référence : " + reference + "\n" +
            "Montant   : " + amount + " FCFA\n" +
            "Vers      : " + destination + "\n\n" +
            "Si vous n'êtes pas à l'origine de cette opération, contactez immédiatement l'administrateur.\n\n" +
            "L'équipe SecureBank");
    }

    public void sendPasswordExpiryWarning(String to, String fullName, int daysLeft) {
        send(to,
            "SecureBank – Votre mot de passe expire bientôt",
            "Bonjour " + fullName + ",\n\n" +
            "Votre mot de passe SecureBank expire dans " + daysLeft + " jour(s).\n" +
            "Connectez-vous et rendez-vous dans votre profil pour le changer.\n\n" +
            "L'équipe SecureBank");
    }
}