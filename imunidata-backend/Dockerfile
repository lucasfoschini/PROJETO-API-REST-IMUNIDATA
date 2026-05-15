# Estágio 1: Build da aplicação usando Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Estágio 2: Imagem final apenas com o JRE (mais leve)
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/imunidata-backend-0.0.1-SNAPSHOT.jar app.jar

# Expõe a porta que o Render espera (10000 por padrão)
EXPOSE 10000

# Variável de ambiente para o Spring Boot usar a porta correta
ENV SERVER_PORT=10000

# Comando para rodar a aplicação
ENTRYPOINT ["java", "-jar", "app.jar"]
