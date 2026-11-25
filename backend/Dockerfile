# Etapa 1: Compilacion
FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /app

COPY pom.xml .

RUN mvn dependency:go-offline -B

COPY src ./src

RUN mvn clean package -DskipTests -B

# Etapa 2: Ejecucion
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN apk add --no-cache curl libstdc++ \
    && mkdir -p /app/database /app/logs

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]