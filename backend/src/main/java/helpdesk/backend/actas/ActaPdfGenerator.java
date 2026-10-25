package helpdesk.backend.actas;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import helpdesk.backend.entities.Acta;
import helpdesk.backend.entities.ActaDetalle;
import helpdesk.backend.entities.Movimiento;
import helpdesk.backend.entities.Usuario;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Arma el PDF de un acta (hoja de entrega, devolucion o prestamo) con OpenPDF.
 * Se genera en memoria y no depende de plantillas Excel, asi que dos actas
 * nunca se pisan entre si.
 */
@Component
public class ActaPdfGenerator {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FECHA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private static final Color AZUL = new Color(0x1F, 0x3A, 0x5F);
    private static final Color GRIS_FONDO = new Color(0xEE, 0xF1, 0xF5);
    private static final Color GRIS_BORDE = new Color(0xC5, 0xCC, 0xD6);
    private static final Color GRIS_TEXTO = new Color(0x5F, 0x6B, 0x7A);

    private static final Font TITULO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, AZUL);
    private static final Font MARCA = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, AZUL);
    private static final Font SECCION = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
    private static final Font ETIQUETA = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, GRIS_TEXTO);
    private static final Font VALOR = FontFactory.getFont(FontFactory.HELVETICA, 9.5f, Color.BLACK);
    private static final Font TEXTO = FontFactory.getFont(FontFactory.HELVETICA, 9.5f, Color.BLACK);
    private static final Font PEQUENA = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, GRIS_TEXTO);
    private static final Font FIRMA = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.BLACK);

    public static String codigo(Acta acta) {
        return String.format("ACT-%06d", acta.getId());
    }

    public byte[] generar(Acta acta, List<ActaDetalle> detalles) {
        Movimiento mov = acta.getMovimiento();
        Usuario colaborador = acta.getUsuario();
        String codigo = codigo(acta);

        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 42, 42, 40, 50);
        try {
            PdfWriter writer = PdfWriter.getInstance(doc, salida);
            writer.setPageEvent(new PiePagina(codigo));
            doc.addTitle(titulo(acta) + " " + codigo);
            doc.addAuthor("Sistema de Help Desk y Gestión de Activos de TI");
            doc.open();

            doc.add(encabezado(acta, colaborador, codigo));

            Paragraph titulo = new Paragraph(titulo(acta), TITULO);
            titulo.setAlignment(Element.ALIGN_CENTER);
            titulo.setSpacingBefore(14);
            titulo.setSpacingAfter(12);
            doc.add(titulo);

            // 1. Colaborador
            doc.add(seccion("1. DATOS DEL COLABORADOR"));
            PdfPTable datos = tabla(new float[]{1.2f, 2.3f, 1f, 1.5f});
            par(datos, "Nombres y apellidos", colaborador.getNombreCompleto(), "DNI", colaborador.getDni());
            par(datos, "Cargo", colaborador.getCargo(), "Área", nombre(colaborador.getArea()));
            par(datos, "Sede", nombre(colaborador.getSede()), "Sociedad", nombre(colaborador.getSociedad()));
            datos.addCell(etiqueta("Correo"));
            PdfPCell correo = valor(colaborador.getCorreo());
            correo.setColspan(3);
            datos.addCell(correo);
            doc.add(datos);

            // 2. Equipo
            doc.add(seccion("2. DETALLE DEL EQUIPO"));
            PdfPTable equipo = tabla(new float[]{1.4f, 1.1f, 1f, 1.5f, 1.5f});
            for (String h : new String[]{"Código patrimonial", "Categoría", "Marca", "Modelo", "N.° de serie"}) {
                equipo.addCell(etiqueta(h));
            }
            for (ActaDetalle d : detalles) {
                equipo.addCell(valor(d.getActivo().getCodigoPatrimonial()));
                equipo.addCell(valor(d.getActivo().getCategoria().getNombre()));
                equipo.addCell(valor(d.getMarca()));
                equipo.addCell(valor(d.getModelo()));
                equipo.addCell(valor(d.getNumeroSerie()));
            }
            doc.add(equipo);

            PdfPTable extra = tabla(new float[]{1.4f, 4.6f});
            if (Acta.PRESTAMO.equals(acta.getTipoActa()) && mov.getFechaDevolucionPrevista() != null) {
                extra.addCell(etiqueta("Devolución prevista"));
                extra.addCell(valor(mov.getFechaDevolucionPrevista().format(FECHA)));
            }
            if (Acta.DEVOLUCION.equals(acta.getTipoActa())) {
                extra.addCell(etiqueta("Estado al recibirlo"));
                extra.addCell(valor(Movimiento.REASIGNACION.equals(mov.getTipo())
                        ? "Reasignado a " + mov.getUsuarioDestino().getNombreCompleto()
                        : mov.getEstadoNuevo().getNombre()));
            }
            extra.addCell(etiqueta("Observaciones"));
            extra.addCell(valor(mov.getObservacion() == null ? "Ninguna" : mov.getObservacion()));
            doc.add(extra);

            // 3. Conformidad
            doc.add(seccion("3. CONFORMIDAD"));
            Paragraph texto = new Paragraph(textoConformidad(acta, mov), TEXTO);
            texto.setAlignment(Element.ALIGN_JUSTIFIED);
            texto.setLeading(13);
            texto.setSpacingBefore(6);
            texto.setSpacingAfter(30);
            doc.add(texto);

            doc.add(firmas(colaborador, mov.getRegistradoPor()));

            Paragraph nota = new Paragraph(
                    "Estado de firma: pendiente. El acta se firma electrónicamente desde el portal; "
                            + "la firma queda registrada con fecha y hora en el sistema.", PEQUENA);
            nota.setAlignment(Element.ALIGN_CENTER);
            nota.setSpacingBefore(10);
            doc.add(nota);

        } catch (DocumentException e) {
            throw new IllegalStateException("No se pudo generar el PDF del acta " + codigo, e);
        } finally {
            if (doc.isOpen()) {
                doc.close();
            }
        }
        return salida.toByteArray();
    }

    // ------------------------------------------------------------------

    public static String titulo(Acta acta) {
        return switch (acta.getTipoActa()) {
            case Acta.DEVOLUCION -> "HOJA DE DEVOLUCIÓN DE EQUIPO";
            case Acta.PRESTAMO -> "HOJA DE PRÉSTAMO DE EQUIPO";
            default -> "HOJA DE ENTREGA DE EQUIPO";
        };
    }

    private String textoConformidad(Acta acta, Movimiento mov) {
        return switch (acta.getTipoActa()) {
            case Acta.DEVOLUCION -> "Se deja constancia de que el colaborador devuelve el equipo descrito, el cual es "
                    + "recibido y revisado por Soporte TI y queda registrado en el estado indicado. Con la firma de "
                    + "ambas partes, el equipo deja de estar bajo la responsabilidad del colaborador.";
            case Acta.PRESTAMO -> "El colaborador recibe el equipo descrito en calidad de préstamo temporal y se "
                    + "compromete a utilizarlo exclusivamente para fines laborales, a cuidarlo y a devolverlo en buen "
                    + "estado a más tardar en la fecha prevista. Cualquier falla, pérdida o robo debe reportarse de "
                    + "inmediato a Soporte TI mediante un ticket.";
            default -> "El colaborador declara recibir el equipo descrito en buen estado de funcionamiento y se "
                    + "compromete a utilizarlo exclusivamente para fines laborales, a cuidarlo y a devolverlo cuando "
                    + "la empresa lo solicite o al término de su vínculo laboral. Cualquier falla, pérdida o robo debe "
                    + "reportarse de inmediato a Soporte TI mediante un ticket.";
        };
    }

    private PdfPTable encabezado(Acta acta, Usuario colaborador, String codigo) {
        PdfPTable t = new PdfPTable(new float[]{3f, 2f});
        t.setWidthPercentage(100);

        PdfPCell izq = new PdfPCell();
        izq.setBorder(Rectangle.BOTTOM);
        izq.setBorderColor(AZUL);
        izq.setBorderWidth(1.5f);
        izq.setPaddingBottom(8);
        izq.addElement(new Paragraph(colaborador.getSociedad() != null
                ? colaborador.getSociedad().getNombre().toUpperCase() : "TERPEL PERÚ", MARCA));
        izq.addElement(new Paragraph("Área de Tecnologías de la Información · Mesa de Ayuda", PEQUENA));
        t.addCell(izq);

        PdfPCell der = new PdfPCell();
        der.setBorder(Rectangle.BOTTOM);
        der.setBorderColor(AZUL);
        der.setBorderWidth(1.5f);
        der.setPaddingBottom(8);
        der.setHorizontalAlignment(Element.ALIGN_RIGHT);
        der.addElement(derecha("N.° " + codigo, FIRMA));
        der.addElement(derecha("Fecha: " + acta.getFechaGeneracion().format(FECHA_HORA), VALOR));
        der.addElement(derecha("Ticket: #" + acta.getTicket().getId(), VALOR));
        t.addCell(der);
        return t;
    }

    private PdfPTable firmas(Usuario colaborador, Usuario tecnico) {
        PdfPTable t = new PdfPTable(new float[]{1f, 0.25f, 1f});
        t.setWidthPercentage(90);
        t.addCell(bloqueFirma("EL COLABORADOR", colaborador.getNombreCompleto(), "DNI: " + texto(colaborador.getDni())));
        PdfPCell espacio = new PdfPCell(new Phrase(""));
        espacio.setBorder(Rectangle.NO_BORDER);
        t.addCell(espacio);
        t.addCell(bloqueFirma("SOPORTE TI", tecnico.getNombreCompleto(), texto(tecnico.getCargo())));
        return t;
    }

    private PdfPCell bloqueFirma(String rol, String nombre, String detalle) {
        PdfPCell c = new PdfPCell();
        c.setBorder(Rectangle.TOP);
        c.setBorderColor(Color.BLACK);
        c.setPaddingTop(6);
        c.setHorizontalAlignment(Element.ALIGN_CENTER);
        Paragraph p1 = new Paragraph(rol, FIRMA);
        p1.setAlignment(Element.ALIGN_CENTER);
        Paragraph p2 = new Paragraph(nombre, VALOR);
        p2.setAlignment(Element.ALIGN_CENTER);
        Paragraph p3 = new Paragraph(detalle, PEQUENA);
        p3.setAlignment(Element.ALIGN_CENTER);
        c.addElement(p1);
        c.addElement(p2);
        c.addElement(p3);
        return c;
    }

    private static Paragraph derecha(String s, Font f) {
        Paragraph p = new Paragraph(s, f);
        p.setAlignment(Element.ALIGN_RIGHT);
        return p;
    }

    private static PdfPTable seccion(String titulo) {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        t.setSpacingBefore(10);
        PdfPCell c = new PdfPCell(new Phrase(titulo, SECCION));
        c.setBackgroundColor(AZUL);
        c.setBorder(Rectangle.NO_BORDER);
        c.setPadding(5);
        t.addCell(c);
        return t;
    }

    private static PdfPTable tabla(float[] anchos) {
        PdfPTable t = new PdfPTable(anchos);
        t.setWidthPercentage(100);
        return t;
    }

    private static void par(PdfPTable t, String e1, String v1, String e2, String v2) {
        t.addCell(etiqueta(e1));
        t.addCell(valor(v1));
        t.addCell(etiqueta(e2));
        t.addCell(valor(v2));
    }

    private static PdfPCell etiqueta(String s) {
        PdfPCell c = new PdfPCell(new Phrase(s, ETIQUETA));
        c.setBackgroundColor(GRIS_FONDO);
        c.setBorderColor(GRIS_BORDE);
        c.setPadding(5);
        return c;
    }

    private static PdfPCell valor(String s) {
        PdfPCell c = new PdfPCell(new Phrase(texto(s), VALOR));
        c.setBorderColor(GRIS_BORDE);
        c.setPadding(5);
        return c;
    }

    private static String texto(String s) {
        return s == null || s.isBlank() ? "—" : s;
    }

    private static String nombre(Object catalogo) {
        if (catalogo == null) return null;
        if (catalogo instanceof helpdesk.backend.entities.Area a) return a.getNombre();
        if (catalogo instanceof helpdesk.backend.entities.Sede s) return s.getNombre();
        if (catalogo instanceof helpdesk.backend.entities.Sociedad so) return so.getNombre();
        return catalogo.toString();
    }

    /** Pie de pagina con el codigo del acta y el numero de pagina. */
    private static class PiePagina extends PdfPageEventHelper {
        private final String codigo;

        PiePagina(String codigo) {
            this.codigo = codigo;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            Phrase pie = new Phrase("Documento generado automáticamente por el Sistema de Help Desk y Gestión de "
                    + "Activos de TI · " + codigo + " · Página " + writer.getPageNumber(), PEQUENA);
            float x = (document.left() + document.right()) / 2;
            ColumnText.showTextAligned(writer.getDirectContent(), Element.ALIGN_CENTER, pie, x, document.bottom() - 22, 0);
        }
    }
}
