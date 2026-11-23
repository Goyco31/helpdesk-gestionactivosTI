package helpdesk.backend;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Levanta el contexto completo de Spring, que valida el esquema contra PostgreSQL
 * (ddl-auto=validate). Solo se ejecuta cuando hay una base disponible (variable DB_URL),
 * como en el workflow de CI, que levanta un PostgreSQL temporal con las migraciones.
 */
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "DB_URL", matches = ".+")
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
