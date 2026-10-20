# Usa una imagen oficial que ya tiene Maven y Java 17 integrados
FROM maven:3.8.5-openjdk-17-slim

# Copia todo el código de tu proyecto al contenedor
COPY . .

# Compila tu proyecto usando el comando nativo de Maven (sin usar ./mvnw)
RUN mvn clean package -DskipTests

# Levanta la aplicación usando el archivo .jar generado
ENTRYPOINT ["sh", "-c", "java -jar target/*.jar"]