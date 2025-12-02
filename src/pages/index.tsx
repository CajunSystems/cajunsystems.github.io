import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <img 
          src="/img/logo_transparent.png" 
          alt="Cajun Logo" 
          className={styles.heroLogo}
        />
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Get Started - 5min ⏱️
          </Link>
        </div>
      </div>
    </header>
  );
}

function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          <div className={clsx('col col--4')}>
            <div className="text--center padding-horiz--md">
              <Heading as="h3">🚀 Near-Zero Overhead</Heading>
              <p>
                0.02% overhead for I/O workloads. Built on Java 21+ virtual threads
                for exceptional performance in microservices and web applications.
              </p>
            </div>
          </div>
          <div className={clsx('col col--4')}>
            <div className="text--center padding-horiz--md">
              <Heading as="h3">🔒 Lock-Free Programming</Heading>
              <p>
                Write concurrent code without locks, race conditions, or deadlocks.
                Actors process messages sequentially with isolated state.
              </p>
            </div>
          </div>
          <div className={clsx('col col--4')}>
            <div className="text--center padding-horiz--md">
              <Heading as="h3">⚡ Production Ready</Heading>
              <p>
                Built-in persistence, clustering, backpressure, and supervision.
                Comprehensive benchmarks and 100+ passing tests.
              </p>
            </div>
          </div>
        </div>
        <div className="row" style={{marginTop: '2rem'}}>
          <div className={clsx('col col--4')}>
            <div className="text--center padding-horiz--md">
              <Heading as="h3">🎯 Functional Programming</Heading>
              <p>
                Effect monad for composable behaviors with stack-safety.
                Natural blocking I/O on virtual threads.
              </p>
            </div>
          </div>
          <div className={clsx('col col--4')}>
            <div className="text--center padding-horiz--md">
              <Heading as="h3">🌐 Distributed Systems</Heading>
              <p>
                Multi-node clustering with automatic failover. Pluggable
                metadata stores and message delivery guarantees.
              </p>
            </div>
          </div>
          <div className={clsx('col col--4')}>
            <div className="text--center padding-horiz--md">
              <Heading as="h3">📊 Flexible Configuration</Heading>
              <p>
                Configurable mailboxes, thread pools, and backpressure strategies.
                Simple defaults that work for 99% of use cases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickExample() {
  return (
    <section className={styles.quickExample}>
      <div className="container">
        <div className="row">
          <div className="col">
            <Heading as="h2" className="text--center">
              Quick Example
            </Heading>
            <div className="margin-top--lg">
              <CodeBlock language="java">
{`// Simple stateless actor
public class GreeterHandler implements Handler<String> {
    @Override
    public void receive(String message, ActorContext context) {
        System.out.println("Hello, " + message + "!");
    }
}

// Create actor system and spawn actor
ActorSystem system = new ActorSystem();
Pid greeter = system.actorOf(GreeterHandler.class)
    .spawn();

// Send message
greeter.tell("World");

// Clean shutdown
system.shutdown();`}
              </CodeBlock>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Cajun - Lightweight actor framework for Java with virtual threads">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <QuickExample />
      </main>
    </Layout>
  );
}
