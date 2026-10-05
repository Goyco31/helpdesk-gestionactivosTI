package helpdesk.backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void enviarCorreo2FA(String destinatario, String codigo) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setTo(destinatario);
        mensaje.setSubject("Tu código de seguridad - Help Desk UTP");
        mensaje.setText("Hola,\n\nPara completar tu inicio de sesión, ingresa el siguiente código de 6 dígitos:\n\n" 
                + codigo + "\n\nSi no solicitaste este código, ignora este mensaje.");
        
        mailSender.send(mensaje);
    }
}