package helpdesk.backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "acta")
public class Acta {

    public static final String ENTREGA = "Entrega";
    public static final String DEVOLUCION = "Devolucion";
    public static final String PRESTAMO = "Prestamo";

    public static final String PENDIENTE_FIRMA = "pendiente_firma";
    public static final String FIRMADA = "firmada";
    public static final String ANULADA = "anulada";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    // Colaborador que recibe o devuelve el equipo
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    // Movimiento que origino el acta
    @ManyToOne(optional = false)
    @JoinColumn(name = "movimiento_id", nullable = false, updatable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Movimiento movimiento;

    @Column(name = "tipo_acta", nullable = false, length = 20)
    private String tipoActa;

    @Column(name = "fecha_generacion", nullable = false, updatable = false)
    private LocalDateTime fechaGeneracion = LocalDateTime.now();

    @Column(name = "url_pdf", length = 255, unique = true)
    private String urlPdf;

    // pendiente_firma, firmada, anulada
    @Column(nullable = false, length = 20)
    private String estado = "pendiente_firma";

    // Huella SHA-256 del PDF original (prueba de que no fue alterado)
    @Column(name = "hash_pdf", length = 64)
    private String hashPdf;

    // ---- Firma electronica simple del colaborador (HU-18) ----
    @Column(name = "firma_nombre", length = 200)
    private String firmaNombre;

    @Column(name = "firma_fecha")
    private LocalDateTime firmaFecha;

    @Column(name = "firma_ip", length = 45)
    private String firmaIp;

    // PDF firmado: archivo nuevo, el original nunca se modifica
    @Column(name = "url_pdf_firmado", length = 255, unique = true)
    private String urlPdfFirmado;

    @Column(name = "hash_pdf_firmado", length = 64)
    private String hashPdfFirmado;
}