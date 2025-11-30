---
sidebar_position: 2
title: Core Concepts
---

# Core Concepts

## The Actor Model

Cajun implements the **actor model** for predictable concurrency:

1. **Message Passing**: Actors communicate by sending messages (no shared state)
2. **Isolated State**: Each actor owns its state privately
3. **Serial Processing**: Messages are processed one at a time, in order
4. **No User-Level Locks**: You write lock-free code - the actor model handles isolation

![Actor Architecture](/img/actor_arch.png)

## Key Benefits

- **No User-Level Locks**: Write concurrent code without explicit locks, synchronized blocks, or manual coordination
- **Predictable Behavior**: Deterministic message ordering makes systems easier to reason about and test
- **Exceptional I/O Performance**: **0.02% overhead** for I/O-bound workloads
- **Scalability**: Easily scale from single-threaded to multi-threaded to distributed systems
- **Fault Tolerance**: Built-in supervision strategies for handling failures gracefully

## Creating Actors

### Stateless Actors with Handler Interface

The simplest way to create an actor:

```java
public class PrinterHandler implements Handler<String> {
    @Override
    public void receive(String message, ActorContext context) {
        System.out.println("Received: " + message);
    }
}

// Spawn the actor
ActorSystem system = new ActorSystem();
Pid printer = system.actorOf(PrinterHandler.class)
    .spawn();

// Send messages
printer.tell("Hello");
printer.tell("World");
```

### Stateful Actors with StatefulHandler Interface

For actors that maintain state:

```java
public class CounterHandler implements StatefulHandler<Integer, String> {
    @Override
    public Integer receive(String message, Integer state, ActorContext context) {
        int newState = state + 1;
        System.out.println("Message #" + newState + ": " + message);
        return newState;
    }
}

// Spawn stateful actor with initial state
Pid counter = system.statefulActorOf(CounterHandler.class, 0)
    .spawn();
counter.tell("first");   // Message #1: first
counter.tell("second");  // Message #2: second
```

### Functional Actors with Effects

For composable, functional programming style using the Effect monad:

```java
import static com.cajunsystems.functional.ActorSystemEffectExtensions.*;

// Define messages
sealed interface Command {}
record Add(int value) implements Command {}
record Subtract(int value) implements Command {}
record GetValue(Pid replyTo) implements Command {}

// Build behavior using effects
Effect<Integer, Throwable, Void> calculatorBehavior = 
    Effect.<Integer, Throwable, Void, Command>match()
        .when(Add.class, (state, msg, ctx) -> 
            Effect.modify(s -> s + msg.value())
                .andThen(Effect.logState(s -> "Added, new value: " + s)))
        
        .when(Subtract.class, (state, msg, ctx) ->
            Effect.modify(s -> s - msg.value())
                .andThen(Effect.logState(s -> "Subtracted, new value: " + s)))
        
        .when(GetValue.class, (state, msg, ctx) ->
            Effect.tell(msg.replyTo(), state))
        
        .build();

// Create actor from effect
Pid calculator = fromEffect(system, calculatorBehavior, 0)
    .withId("calculator")
    .spawn();
```

## Actor Communication

### tell() - Fire and Forget

Send messages without waiting for a response:

```java
printer.tell("Hello, World!");
```

### ask() - Request-Response

Send a message and wait for a response:

```java
CompletableFuture<Integer> future = counter.ask(
    replyTo -> new GetCount(replyTo),
    Duration.ofSeconds(5)
);

Integer count = future.join(); // Blocks until response
```

### forward() - Preserve Sender

Forward messages while preserving the original sender:

```java
public class RouterHandler implements Handler<Message> {
    private final Pid worker;

    @Override
    public void receive(Message msg, ActorContext context) {
        // Forward preserves original sender for replies
        context.forward(worker, msg);
    }
}
```

## Actor Lifecycle

### Creating an ActorSystem

```java
ActorSystem system = new ActorSystem();
```

### Spawning Actors

```java
// Simple spawn
Pid actor = system.actorOf(MyHandler.class)
    .spawn();

// Spawn with explicit ID
Pid actor = system.actorOf(MyHandler.class)
    .withId("my-actor-id")
    .spawn();

// Spawn with configuration
Pid actor = system.actorOf(MyHandler.class)
    .withId("configured-actor")
    .spawn();
```

### Stopping Actors

```java
// Stop a specific actor
system.stopActor(actor);

// Shutdown entire system
system.shutdown();
```

## Supervision and Fault Tolerance

Actors can supervise child actors with different strategies:

### Supervision Strategies

- **RESUME**: Continue processing next message (ignore error)
- **RESTART**: Restart actor with fresh state
- **STOP**: Permanently stop the actor
- **ESCALATE**: Propagate error to parent supervisor

```java
public class SupervisorHandler implements Handler<Message> {
    @Override
    public SupervisionStrategy supervisorStrategy() {
        return SupervisionStrategy.RESTART;
    }

    @Override
    public void receive(Message msg, ActorContext context) {
        // Create child actors that will be supervised
        Pid child = context.createChild(ChildHandler.class, "child-1");
    }
}
```

## Virtual Threads

Cajun is built on **Java 21+ Virtual Threads**, providing:

- Thousands of concurrent actors with minimal overhead
- Natural blocking I/O code (no callbacks or futures needed)
- Efficient resource usage - virtual threads "park" during I/O

```java
// You can write simple blocking code
public class DatabaseHandler implements Handler<Query> {
    @Override
    public void receive(Query query, ActorContext context) {
        // This blocks but doesn't block the OS thread!
        Result result = database.executeQuery(query.sql());
        context.reply(result);
    }
}
```

## Next Steps

- Learn about [Actor ID Strategies](/docs/core-features/actor-id-strategies)
- Explore [Mailbox Configuration](/docs/core-features/mailbox-guide)
- Dive into [Effect Monad](/docs/effect-monad/guide) for functional programming
- Check [Performance Benchmarks](/docs/performance/benchmarks)
