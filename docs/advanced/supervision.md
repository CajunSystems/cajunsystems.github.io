---
sidebar_position: 4
title: Supervision
---

# Supervision

Cajun provides a robust supervision system for handling actor failures gracefully, inspired by Erlang OTP. When an actor encounters an error during message processing, the supervision system determines how to respond based on the configured strategy.

## Supervision Strategies

The `SupervisionStrategy` enum defines four strategies for handling actor failures:

| Strategy | Behavior | Use Case |
|----------|----------|----------|
| **RESUME** | Continue processing next message, ignore the error | Transient errors, logging only |
| **RESTART** | Restart the actor, reset state, preserve mailbox | Recoverable errors requiring state reset |
| **STOP** | Terminate the actor permanently | Unrecoverable errors |
| **ESCALATE** | Propagate error to parent actor | Hierarchical error handling |

## Configuring Supervision

Set the supervision strategy when spawning an actor:

```java
Pid actor = system.actorOf(MyHandler.class)
    .withSupervisionStrategy(SupervisionStrategy.RESTART)
    .withId("my-actor")
    .spawn();
```

## RESUME Strategy

The actor continues processing the next message, ignoring the error. Best for transient errors where you want to log and continue.

```java
public class ResilientHandler implements Handler<String> {
    @Override
    public void receive(String message, ActorContext context) {
        if (message.equals("error")) {
            throw new RuntimeException("Transient error");
        }
        context.getLogger().info("Processed: {}", message);
    }
}

// Configure with RESUME
Pid actor = system.actorOf(ResilientHandler.class)
    .withSupervisionStrategy(SupervisionStrategy.RESUME)
    .spawn();

actor.tell("hello");  // ✓ Processed
actor.tell("error");  // ✗ Error logged, actor continues
actor.tell("world");  // ✓ Processed
```

## RESTART Strategy

The actor is restarted with fresh state. The mailbox is preserved, so no messages are lost.

```java
public class StatefulHandler implements Handler<Command> {
    private int counter = 0;

    @Override
    public void preStart(ActorContext context) {
        context.getLogger().info("Actor starting, counter reset to 0");
    }

    @Override
    public void receive(Command message, ActorContext context) {
        if (message instanceof Increment) {
            counter++;
        } else if (message instanceof FailCommand) {
            throw new RuntimeException("Recoverable error");
        }
        context.getLogger().info("Counter: {}", counter);
    }
}

// Configure with RESTART
Pid actor = system.actorOf(StatefulHandler.class)
    .withSupervisionStrategy(SupervisionStrategy.RESTART)
    .spawn();

actor.tell(new Increment());  // counter = 1
actor.tell(new FailCommand()); // Actor restarts, counter resets to 0
actor.tell(new Increment());  // counter = 1 (fresh state)
```

### Message Reprocessing

Control whether the failed message should be reprocessed after restart by overriding `onError()`:

```java
public class ReprocessHandler implements Handler<Message> {
    @Override
    public void receive(Message message, ActorContext context) {
        // Process message
        if (shouldFail(message)) {
            throw new RuntimeException("Temporary failure");
        }
    }

    @Override
    public boolean onError(Message message, Throwable exception, ActorContext context) {
        context.getLogger().warn("Error processing {}: {}", message, exception.getMessage());
        
        // Return true to reprocess the message after restart
        return message.isRetryable();
    }
}
```

**Default behavior**: `onError()` returns `false` (no reprocessing)

## STOP Strategy

The actor is terminated permanently. Use for unrecoverable errors.

```java
Pid actor = system.actorOf(CriticalHandler.class)
    .withSupervisionStrategy(SupervisionStrategy.STOP)
    .spawn();

actor.tell("process");  // ✓ Processed
actor.tell("fatal");    // ✗ Actor stops permanently
actor.tell("more");     // ✗ Not processed (actor is stopped)
```

## ESCALATE Strategy

The error is propagated to the parent actor. The child actor stops, and the parent decides how to handle it.

```java
// Parent actor
public class ParentHandler implements Handler<ParentMessage> {
    @Override
    public void receive(ParentMessage message, ActorContext context) {
        if (message instanceof CreateChild) {
            Pid child = context.createChild(ChildHandler.class, "child-1")
                .withSupervisionStrategy(SupervisionStrategy.ESCALATE)
                .spawn();
        }
    }
}

// Child actor with ESCALATE
public class ChildHandler implements Handler<ChildMessage> {
    @Override
    public void receive(ChildMessage message, ActorContext context) {
        if (message.isProblematic()) {
            // This error will be escalated to the parent
            throw new RuntimeException("Child cannot handle this");
        }
    }
}

// Parent handles child errors based on its own supervision strategy
Pid parent = system.actorOf(ParentHandler.class)
    .withSupervisionStrategy(SupervisionStrategy.RESTART)  // Parent restarts child
    .spawn();
```

## Lifecycle Hooks

Override these methods to add custom behavior during supervision events:

### preStart()

Called before the actor starts processing messages (including after restarts):

```java
@Override
public void preStart(ActorContext context) {
    context.getLogger().info("Actor {} starting", context.getSelf().id());
    // Initialize resources, connections, etc.
}
```

### postStop()

Called when the actor stops (including before restarts):

```java
@Override
public void postStop(ActorContext context) {
    context.getLogger().info("Actor {} stopping", context.getSelf().id());
    // Clean up resources, close connections, etc.
}
```

### onError()

Called when an error occurs during message processing:

```java
@Override
public boolean onError(Message message, Throwable exception, ActorContext context) {
    context.getLogger().error("Error processing {}: {}", message, exception.getMessage());
    
    // Return true to reprocess the message after restart (RESTART strategy only)
    // Return false to skip reprocessing
    return shouldRetry(exception);
}
```

## Hierarchical Supervision

Parent actors supervise their children. When a child escalates an error, the parent's supervision strategy determines the response:

```java
// Parent with RESTART strategy
Pid parent = system.actorOf(SupervisorHandler.class)
    .withSupervisionStrategy(SupervisionStrategy.RESTART)
    .spawn();

// Create child with ESCALATE
public class SupervisorHandler implements Handler<SupervisorMessage> {
    @Override
    public void receive(SupervisorMessage message, ActorContext context) {
        if (message instanceof SpawnChild) {
            Pid child = context.createChild(WorkerHandler.class, "worker")
                .withSupervisionStrategy(SupervisionStrategy.ESCALATE)
                .spawn();
        }
    }
}

// When child fails:
// 1. Child stops
// 2. Error escalates to parent
// 3. Parent's RESTART strategy restarts the child
// 4. Child resumes processing
```

## Best Practices

### Choose the Right Strategy

- **RESUME**: Use for errors that don't affect actor state (e.g., validation errors, logging failures)
- **RESTART**: Use for errors that corrupt actor state but are recoverable (e.g., connection failures, parsing errors)
- **STOP**: Use for unrecoverable errors (e.g., configuration errors, critical resource failures)
- **ESCALATE**: Use when the parent should decide how to handle the error

### Implement Lifecycle Hooks

```java
public class RobustHandler implements Handler<Message> {
    private Connection connection;

    @Override
    public void preStart(ActorContext context) {
        // Initialize resources
        connection = createConnection();
        context.getLogger().info("Connection established");
    }

    @Override
    public void postStop(ActorContext context) {
        // Clean up resources
        if (connection != null) {
            connection.close();
        }
        context.getLogger().info("Connection closed");
    }

    @Override
    public void receive(Message message, ActorContext context) {
        // Use connection
        connection.send(message);
    }

    @Override
    public boolean onError(Message message, Throwable exception, ActorContext context) {
        if (exception instanceof TransientException) {
            return true;  // Retry after restart
        }
        return false;  // Don't retry
    }
}
```

### Log Errors Appropriately

```java
@Override
public boolean onError(Message message, Throwable exception, ActorContext context) {
    if (exception instanceof ExpectedException) {
        context.getLogger().warn("Expected error: {}", exception.getMessage());
    } else {
        context.getLogger().error("Unexpected error processing {}", message, exception);
    }
    return false;
}
```

### Avoid Infinite Restart Loops

If an actor repeatedly fails on the same message, consider:

1. **Don't reprocess**: Return `false` from `onError()`
2. **Use STOP strategy**: For persistent failures
3. **Add retry limits**: Track retry count in actor state

```java
public class SafeHandler implements Handler<Message> {
    private final Map<Message, Integer> retryCount = new HashMap<>();
    private static final int MAX_RETRIES = 3;

    @Override
    public boolean onError(Message message, Throwable exception, ActorContext context) {
        int count = retryCount.getOrDefault(message, 0) + 1;
        
        if (count >= MAX_RETRIES) {
            context.getLogger().error("Max retries exceeded for {}", message);
            retryCount.remove(message);
            return false;  // Give up
        }
        
        retryCount.put(message, count);
        return true;  // Retry
    }
}
```

## Integration with Ask Pattern

Supervision strategies affect how errors are propagated in the ask pattern:

```java
Pid actor = system.actorOf(MyHandler.class)
    .withSupervisionStrategy(SupervisionStrategy.RESTART)
    .spawn();

try {
    Reply<String> reply = actor.ask(
        replyTo -> new ProcessRequest("data", replyTo),
        Duration.ofSeconds(5)
    );
    String result = reply.get();
} catch (Exception e) {
    // If actor fails during processing:
    // - RESUME: No exception, continues
    // - RESTART: Actor restarts, may timeout or succeed on retry
    // - STOP: Future fails with exception
    // - ESCALATE: Propagates to parent, may fail or recover
}
```

## Summary

- **Four strategies**: RESUME, RESTART, STOP, ESCALATE
- **Configure per actor**: Use `.withSupervisionStrategy()`
- **Lifecycle hooks**: `preStart()`, `postStop()`, `onError()`
- **Message preservation**: Mailbox preserved during RESTART
- **Hierarchical**: Parent supervises children with ESCALATE
- **Best practices**: Choose appropriate strategy, implement hooks, avoid infinite loops
