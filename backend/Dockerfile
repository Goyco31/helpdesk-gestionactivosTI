# Usa una imagen ligera de Java 17
FROM eclipse-temurin:17-jdk-alpine
# Copia todo el código de tu carpeta actual al contenedor
COPY . .
# Da permisos al ejecutable de Maven
RUN chmod +x ./mvnw
# Compila tu proyecto 
RUN ./mvnw clean package -DskipTests
# Comando para levantar la aplicación usando el .jar generado
ENTRYPOINT ["sh", "-c", "java -jar target/*.jar"]