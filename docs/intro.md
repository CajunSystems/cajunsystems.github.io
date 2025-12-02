---
sidebar_position: 1
title: Getting Started
---

# Getting Started

**C**oncurrency **A**nd **J**ava **UN**locked

<div style={{textAlign:'center'}}>
    <p>Predictable concurrency for Java applications using the actor model</p>
    <p><em>Leveraging virtual threads and modern features from JDK21+</em></p>
</div>

## What is Cajun?

Cajun is a lightweight actor system for Java that makes concurrent programming **simple and safe**. Instead of managing threads, locks, and shared state yourself, you write simple actors that communicate through messages.

## Why Actors?

**Traditional concurrent programming is hard:**
- 🔒 Managing locks and synchronization
- 🐛 Avoiding race conditions and deadlocks
- 🔍 Debugging concurrent issues
- 📊 Coordinating shared state

**Actors make it simple:**
- ✅ Each actor processes one message at a time
- ✅ No shared state = no race conditions
- ✅ Built-in error handling and recovery
- ✅ Easy to test and reason about

## When Should You Use Cajun?

### ✅ Perfect for (Near-Zero Overhead):

**I/O-Heavy Applications**: Microservices, web apps, REST APIs
- **Performance**: 0.02% overhead - actors perform identically to raw threads!
- Database calls, HTTP requests, file operations

**Event-Driven Systems**: Kafka/RabbitMQ consumers, event processing
- **Performance**: 0.02% overhead for I/O-bound message processing
- Excellent for stream processing and event sourcing

**Stateful Services**: User sessions, game entities, shopping carts
- **Performance**: 8% overhead but you get thread-safe state management
- Complex stateful logic that needs isolation

**Message-Driven Architectures**: Workflows, sagas, orchestration
- **Performance**: < 1% overhead for realistic mixed workloads
- Systems requiring fault tolerance and supervision

### ⚠️ Consider alternatives for:

**Embarrassingly Parallel CPU Work**: Matrix multiplication, data transformations
- Raw threads are 10x faster for pure parallel computation
- Use parallel streams or thread pools instead

**Simple Scatter-Gather**: Making 100 independent API calls in parallel
- Raw threads are 38% faster
- Use `CompletableFuture.allOf()` instead

## Key Features

### Virtual Thread Support
Built on Java 21+ virtual threads, enabling thousands of concurrent actors with minimal overhead. Blocking I/O operations don't block OS threads.

### Flexible Actor Definitions
- **Handler Interface**: For stateless actors
- **StatefulHandler Interface**: For stateful actors with persistence
- **Effect Monad**: Functional programming style with composable behaviors

### Actor ID Management
Configure actor identifiers using:
- Explicit IDs for singletons
- Templates with placeholders (`{seq}`, `{uuid}`, `{timestamp}`)
- Predefined strategies (UUID, CLASS_BASED_UUID, etc.)
- Hierarchical patterns with parent prefixing

### Communication Patterns
- **tell()**: Fire-and-forget messaging
- **ask()**: Request-response pattern
- **forward()**: Sender context preservation

### Resilience & Fault Tolerance
Built-in supervision strategies:
- RESUME: Continue with next message
- RESTART: Restart with clean state
- STOP: Permanent termination
- ESCALATE: Propagate to parent

### State Persistence
Pluggable backends:
- File-based for development
- LMDB for production (high performance)
- Snapshot-based recovery with message replay

### Backpressure Management
Configurable strategies for high-load scenarios:
- BLOCK: Pause senders
- DROP_NEW: Discard incoming messages
- DROP_OLDEST: Prioritize newer messages
- CUSTOM: User-defined handlers

### Distributed Clustering
Multi-node actor systems with:
- Automatic failover
- Rendezvous hashing for actor placement
- Pluggable metadata stores (etcd)

## Quick Example

```java
// Simple stateless actor
public class GreeterHandler implements Handler<String> {
    @Override
    public void receive(String message, ActorContext context) {
        System.out.println("Hello, " + message + "!");
    }
}

// Create actor system and spawn actor
ActorSystem system = new ActorSystem();
Pid greeter = system.actorOf(GreeterHandler.class).spawn();

// Send message
greeter.tell("World");

// Clean shutdown
system.shutdown();
```

## Next Steps

Ready to get started? Check out:
- [Installation Guide](getting-started/installation) - Set up Cajun in your project
- [Core Concepts](getting-started/core-concepts) - Learn the fundamentals
- [Performance Benchmarks](performance/benchmarks) - See real-world performance data

## Community & Support

- **GitHub**: [github.com/CajunSystems/cajun](https://github.com/CajunSystems/cajun)
- **Issues**: [Report bugs and request features](https://github.com/CajunSystems/cajun/issues)
- **Maven Central**: [com.cajunsystems:cajun](https://central.sonatype.com/artifact/com.cajunsystems/cajun)
