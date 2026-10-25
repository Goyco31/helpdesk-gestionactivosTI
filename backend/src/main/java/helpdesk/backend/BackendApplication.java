package helpdesk.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

import java.util.TimeZone;

@SpringBootApplication
@EnableAsync
public class BackendApplication {

	public static void main(String[] args) {
		// Todas las fechas del sistema (tickets, movimientos, actas) se registran en hora de Peru,
		// aunque el servidor en la nube use UTC. Asi los KPI de SLA/MTTR no se descuadran.
		TimeZone.setDefault(TimeZone.getTimeZone("America/Lima"));
		SpringApplication.run(BackendApplication.class, args);
	}

}
