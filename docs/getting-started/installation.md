---
sidebar_position: 1
title: Installation
---

# Installation

## Prerequisites

- **Java 21 or higher** with `--enable-preview` flag enabled
- **Gradle** or **Maven** for dependency management

## Gradle

Add the following to your `build.gradle`:

```gradle
dependencies {
    implementation 'com.cajunsystems:cajun:0.4.0'
}
```

### Enable Preview Features

Add to your `build.gradle`:

```gradle
tasks.withType(JavaCompile) {
    options.compilerArgs += ["--enable-preview"]
}

tasks.withType(Test) {
    jvmArgs += ["--enable-preview"]
}

tasks.withType(JavaExec) {
    jvmArgs += ["--enable-preview"]
}
```

## Maven

Add the following to your `pom.xml`:

```xml
<dependency>
    <groupId>com.cajunsystems</groupId>
    <artifactId>cajun</artifactId>
    <version>0.4.0</version>
</dependency>
```

### Enable Preview Features

Add to your `pom.xml`:

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.11.0</version>
            <configuration>
                <release>21</release>
                <compilerArgs>
                    <arg>--enable-preview</arg>
                </compilerArgs>
            </configuration>
        </plugin>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>3.0.0</version>
            <configuration>
                <argLine>--enable-preview</argLine>
            </configuration>
        </plugin>
    </plugins>
</build>
```

## Optional: Persistence Module

For stateful actors with persistence support:

### Gradle

```gradle
dependencies {
    implementation 'com.cajunsystems:cajun-persistence:0.4.0'
}
```

### Maven

```xml
<dependency>
    <groupId>com.cajunsystems</groupId>
    <artifactId>cajun-persistence</artifactId>
    <version>0.4.0</version>
</dependency>
```

## Optional: Cluster Module

For distributed actor systems:

### Gradle

```gradle
dependencies {
    implementation 'com.cajunsystems:cajun-cluster:0.4.0'
}
```

### Maven

```xml
<dependency>
    <groupId>com.cajunsystems</groupId>
    <artifactId>cajun-cluster</artifactId>
    <version>0.4.0</version>
</dependency>
```

## Verify Installation

Create a simple test to verify your setup:

```java
import com.cajunsystems.*;
import com.cajunsystems.handler.Handler;

public class HelloCajun {
    public static void main(String[] args) {
        // Create actor system
        ActorSystem system = new ActorSystem();

        // Create a simple handler using anonymous class
        Pid actor = system.actorOf(new Handler<String>() {
            @Override
            public void receive(String message, ActorContext context) {
                System.out.println("Received: " + message);
            }
        }).spawn();

        // Send message
        actor.tell("Hello, Cajun!");

        // Allow message to process
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Shutdown
        system.shutdown();
    }
}
```

Run with:
```bash
java --enable-preview HelloCajun.java
```

You should see:
```
Received: Hello, Cajun!
```

## Next Steps

- Learn about [Core Concepts](core-concepts)
- Explore the [Effect Monad](/docs/effect-monad/guide) for functional programming
- Check out [Performance Benchmarks](/docs/performance/benchmarks)
