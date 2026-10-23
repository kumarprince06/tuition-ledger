# Interview questions: `backend/pom.xml`

Questions an interviewer can ask about this project's [pom.xml](../../backend/pom.xml), each with a short answer and a small example. The examples use this project's real dependencies where possible, so a candidate can point at the file while answering.

**How to use it.** An interviewer can read the question and use the **Listen for** line to judge the answer. A candidate can read the answer first, then the example, and practise explaining it out loud in their own words.

---

## Part 1 — Basics

### 1. What is a POM? What are groupId, artifactId and version?

**Answer.** POM stands for Project Object Model. It is Maven's build file: what the project is, what it depends on, and how to build it. Together, `groupId:artifactId:version` (the "coordinates") identify the project uniquely.

**Example.**
```xml
<groupId>com.tuitionledger</groupId>   <!-- who owns it: reversed domain -->
<artifactId>backend</artifactId>       <!-- which project -->
<version>0.0.1-SNAPSHOT</version>      <!-- which version -->
```
The build produces `target/backend-0.0.1-SNAPSHOT.jar`. Another project could depend on it as `com.tuitionledger:backend:0.0.1-SNAPSHOT`.

**Simple analogy.** It works like a postal address: country (groupId), house (artifactId), flat number (version).

**Listen for:** coordinates are unique, and groupId is usually a reversed domain.

### 2. What does `SNAPSHOT` mean?

**Answer.** A snapshot is a version that is still changing. Maven may download a newer build of the same snapshot version. A release version (`1.0.0`) is fixed forever.

**Example.** Today's `0.0.1-SNAPSHOT` jar and tomorrow's may contain different code. Once the pilot ships, the version becomes `1.0.0` and that jar never changes again.

### 3. Why do most dependencies in this file have no `<version>`?

**Answer.** The parent `spring-boot-starter-parent` already manages the versions. Spring tests that version set together, so the libraries are known to work with each other.

**Example.**
```xml
<dependency>
  <groupId>org.postgresql</groupId>
  <artifactId>postgresql</artifactId>   <!-- no version: Boot 4.1.2 decides -->
</dependency>
```
Upgrading `<parent>` from 4.1.2 to 4.1.3 updates the Postgres driver, Hibernate, Jackson and the rest at once.

**Listen for:** "the parent or BOM manages versions". Hard-coding versions next to Boot is a common mistake.

### 4. What is a "starter"?

**Answer.** A starter is a dependency with no code of its own. It pulls in everything one feature needs, and Spring Boot auto-configures it.

**Example.** `spring-boot-starter-data-redis` brings the Lettuce Redis client, Spring Data Redis and auto-configuration. With just one line in yaml (`spring.data.redis.host`), a `StringRedisTemplate` is ready to inject. This project will use that template to store OTP codes.

**Simple analogy.** A starter is a meal combo. You order "burger meal" instead of a bun, a patty, fries and a drink separately.

### 5. What are `mvnw` and `.mvn/wrapper/` for?

**Answer.** The Maven wrapper downloads and runs a fixed Maven version, so every developer and the CI server use the same one and nobody needs to install Maven.

**Example.** `.mvn/wrapper/maven-wrapper.properties` pins Maven 3.10.0. A new developer clones the repo and runs `./mvnw test`, and Maven 3.10.0 downloads automatically.

**Listen for:** reproducible builds, and committing the wrapper files to git.

---

## Part 2 — Scopes and versions

### 6. Explain dependency scopes. Which ones does this file use?

**Answer.**

| Scope | Available at compile time | In tests | Inside the final jar | Example in this pom |
|---|---|---|---|---|
| `compile` (default) | yes | yes | yes | `spring-boot-starter-data-jpa` |
| `runtime` | no | yes | yes | `postgresql`, `micrometer-registry-prometheus` |
| `test` | test code only | yes | no | `testcontainers-postgresql` |
| `provided` | yes | yes | no (the server supplies it) | not used; e.g. servlet API on an external Tomcat |

**Example.** Code in `src/main/java` can't `import org.testcontainers...`, because that library is test scope. The compiler stops you, which keeps test libraries out of production.

### 7. Why is the PostgreSQL driver `runtime` scope?

**Answer.** Application code only uses JPA and JDBC interfaces, never Postgres classes directly. Runtime scope makes it impossible to import a Postgres-specific class by accident.

**Example.**
```java
// Fine: uses the JPA interface
entityManager.createQuery("select s from Student s", Student.class);

// Won't compile with runtime scope — and that's the point
org.postgresql.PGConnection pg = ...;
```

### 8. `<dependencies>` vs `<dependencyManagement>`?

**Answer.** `<dependencies>` adds libraries to the project. `<dependencyManagement>` only fixes the version a library will have **if** something declares it.

**Example.** This pom imports the Modulith BOM in `<dependencyManagement>`. That alone adds nothing. The four `spring-modulith-*` entries in `<dependencies>` are what add the libraries, and each one takes version 2.1.1 from the BOM.

**Simple analogy.** `dependencyManagement` is a price list. `dependencies` is your shopping cart. The price list doesn't put anything in the cart.

### 9. What does `<type>pom</type><scope>import</scope>` do?

**Answer.** It copies another POM's `<dependencyManagement>` into this one. That is how you use a BOM (bill of materials).

**Example.**
```xml
<dependency>
  <groupId>org.springframework.modulith</groupId>
  <artifactId>spring-modulith-bom</artifactId>
  <version>${spring-modulith.version}</version>   <!-- 2.1.1, set once in <properties> -->
  <type>pom</type>
  <scope>import</scope>
</dependency>
```

### 10. Why use both a parent and a BOM?

**Answer.** A project can have only one parent. Spring Boot's parent takes that slot, and it brings plugin configuration as well as versions. Other version sets, like Modulith, come in as BOM imports.

**Example.** Suppose a company requires its own parent `com.company:corporate-parent`. Then Boot's versions come in as a BOM instead:
```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-dependencies</artifactId>
  <version>4.1.2</version>
  <type>pom</type><scope>import</scope>
</dependency>
```
You keep Boot's versions, but you lose its plugin defaults and have to configure `spring-boot-maven-plugin` yourself.

### 11. Two libraries need different versions of the same dependency. Which one wins?

**Answer.** **Nearest wins**: the version declared closest to your project in the dependency tree is used. If two are at the same depth, the one declared first wins. To fix a conflict, pin the version in `<dependencyManagement>` or exclude the unwanted copy.

**Example.**
```
backend
├── library-A ── jackson 2.17   (depth 2)
└── library-B ── X ── jackson 2.15   (depth 3)
```
Maven picks 2.17, because it is nearer. Run `./mvnw dependency:tree -Dincludes=com.fasterxml.jackson.core` to see it.

**Listen for:** "nearest wins", and `dependency:tree` as the diagnostic tool.

### 12. How do you remove a transitive dependency?

**Answer.** Add an `<exclusions>` block inside the dependency that pulls it in.

**Example.** To run on Jetty instead of Tomcat:
```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-webmvc</artifactId>
  <exclusions>
    <exclusion>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-tomcat</artifactId>
    </exclusion>
  </exclusions>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>
```

---

## Part 3 — Build lifecycle and plugins

### 13. What happens when you run `./mvnw test`?

**Answer.** Maven runs every lifecycle phase up to and including `test`, in order.

**Example.**
```
validate → compile → test-compile → test      ← ./mvnw test stops here
         → package → verify → install → deploy
```
`./mvnw package` also runs the tests first. That's why a failing test blocks building the jar.

### 14. What does `spring-boot-maven-plugin` do?

**Answer.** It turns the normal jar into an executable "fat jar" with every dependency inside. It also adds the `spring-boot:run` and `spring-boot:build-image` goals.

**Example.**
```bash
./mvnw package
java -jar target/backend-0.0.1-SNAPSHOT.jar   # starts the whole API, no Tomcat install needed
```

### 15. Where are the compiler and test plugins configured? They aren't in this file.

**Answer.** In the parent POM. `<java.version>21</java.version>` feeds the compiler's `release` setting, and Surefire is pre-configured to run JUnit 5 tests.

**Example.** Run `./mvnw help:effective-pom` to see the full POM after inheritance, including `maven-compiler-plugin` and `maven-surefire-plugin`.

### 16. Surefire vs Failsafe?

**Answer.** Surefire runs unit tests in the `test` phase. Failsafe runs integration tests in the `integration-test` and `verify` phases, and it still runs cleanup steps (stopping containers) when a test fails.

**Example.**

| Plugin | Default file names | Phase | In this project |
|---|---|---|---|
| Surefire | `*Test`, `*Tests`, `Test*`, `*TestCase` | `test` | `ModularityTests`, `BackendApplicationTests` |
| Failsafe | `*IT`, `IT*`, `*ITCase` | `integration-test`, `verify` | later: `OutboxRelayCrashIT` from the test plan |

**Listen for:** "fast tests on every build, slow container tests separately". Bonus if the candidate notices that `TestBackendApplication` matches Surefire's `Test*` pattern.

---

## Part 4 — Project-specific choices

### 17. Why Testcontainers instead of an in-memory H2 database?

**Answer.** This project depends on Postgres features that H2 doesn't have: row-level security, exclusion constraints, `FOR UPDATE SKIP LOCKED`, materialised views. A test passing on H2 proves nothing about production.

**Example.** The outbox relay query:
```sql
SELECT * FROM outbox_messages WHERE status = 'queued'
ORDER BY not_before LIMIT 100 FOR UPDATE SKIP LOCKED;
```
H2 doesn't support `SKIP LOCKED`. Real Postgres in a container does, so the crash-and-resume test is meaningful.

### 18. Why the OAuth2 Resource Server starter when there's no Google or Keycloak login?

**Answer.** The app issues its own JWTs after the OTP login. The resource server starter only **validates** the bearer token on each request: signature, expiry, claims. That avoids writing a security filter by hand.

**Example.** A request with `Authorization: Bearer eyJ...` arrives. The starter verifies the signature with the app's key, rejects expired tokens with 401, and makes the claims available, for example `centre_id` for tenant scoping.

### 19. Why `flyway-database-postgresql` in addition to `spring-boot-starter-flyway`?

**Answer.** Since Flyway 10, support for each database ships as a separate module. Without it, Flyway fails at startup with "Unsupported Database: PostgreSQL".

### 20. What is Spring Modulith adding here, and why not microservices?

**Answer.** Modulith gives module boundaries that tests verify, plus a durable event registry. That provides most of the benefits of microservices (clear ownership, loose coupling) without network calls, distributed transactions or extra servers. That suits one small team on one VPS ([ADR-0001](../adr/0001-modular-monolith.md)).

**Example.**
- `spring-modulith-starter-test` → `ModularityTests` fails if `fees` imports `students.domain.Student` directly.
- `spring-modulith-starter-jpa` → when `ledger` publishes `PaymentRecorded`, the event is saved in the same transaction. If the app crashes before `messaging` sends the receipt, the listener runs again on restart ([ADR-0011](../adr/0011-modulith-events.md)).

### 21. Why does Spring Boot 4 have so many `*-test` starters?

**Answer.** Boot 4 split test support per feature, so each feature brings only its own test helpers.

**Example.** `spring-boot-starter-webmvc-test` gives `MockMvc` for controller tests, and `spring-boot-starter-data-jpa-test` gives `@DataJpaTest` for repository tests. If you remove Redis, you remove its test starter too.

---

## Part 5 — Scenarios

Each scenario has a model answer and the exact change.

### S1. "Add ShedLock so the fee-run job doesn't run twice when we add a second server. Do you need a version?"

**Answer.** Yes. ShedLock isn't managed by Spring Boot, so without a version the build fails with "dependency version missing". Put the version in one property, or import ShedLock's BOM.

**Example.**
```xml
<properties>
  <shedlock.version>6.x.x</shedlock.version>   <!-- pick the current release -->
</properties>

<dependency>
  <groupId>net.javacrumbs.shedlock</groupId>
  <artifactId>shedlock-spring</artifactId>
  <version>${shedlock.version}</version>
</dependency>
<dependency>
  <groupId>net.javacrumbs.shedlock</groupId>
  <artifactId>shedlock-provider-jdbc-template</artifactId>
  <version>${shedlock.version}</version>
</dependency>
```
The property means both artifacts can never drift to different versions.

**Listen for:** "check whether Boot manages it first"; one version property shared across related artifacts.

### S2. "The build works on my laptop but fails in CI with `release version 21 not supported`."

**Answer.** CI is using an older JDK. The wrapper pins Maven, not Java. Fix CI to use JDK 21, and make the build fail early with a clear message using the enforcer plugin.

**Example.**
```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-enforcer-plugin</artifactId>
  <executions>
    <execution>
      <id>enforce-java</id>
      <goals><goal>enforce</goal></goals>
      <configuration>
        <rules><requireJavaVersion><version>[21,)</version></requireJavaVersion></rules>
      </configuration>
    </execution>
  </executions>
</plugin>
```
In GitHub Actions: `actions/setup-java` with `java-version: '21'`.

This happened in this project: the laptop's `.bashrc` pinned JDK 17, and the build failed until it pointed at 21.

### S3. "After adding a library, the app crashes with `NoSuchMethodError`."

**Answer.** Two versions of the same library are on the classpath, and the wrong one won. Find which dependency brings the old version, then pin or exclude it.

**Example.**
```bash
./mvnw dependency:tree -Dverbose -Dincludes=com.fasterxml.jackson.core
```
The output shows `new-library → jackson-databind 2.12 (omitted for conflict with 2.18)`, or the reverse. Fix it by managing the version or excluding it:
```xml
<dependency>
  <groupId>com.example</groupId>
  <artifactId>new-library</artifactId>
  <version>1.0</version>
  <exclusions>
    <exclusion>
      <groupId>com.fasterxml.jackson.core</groupId>
      <artifactId>jackson-databind</artifactId>
    </exclusion>
  </exclusions>
</dependency>
```

**Listen for:** `NoSuchMethodError` and `ClassNotFoundException` usually mean a classpath or version conflict, not a code bug.

### S4. "The jar is 90 MB and Docker image builds are slow."

**Answer.**
1. Remove what isn't used: `./mvnw dependency:analyze` lists libraries that are declared but unused.
2. Use **layered jars**. Spring Boot splits the jar into layers (dependencies, then your code), so Docker caches the big dependency layer and rebuilds only your code.
3. Use `./mvnw spring-boot:build-image`, which builds an optimised image without a hand-written Dockerfile.

**Example.** You change one controller. Without layers, Docker re-copies all 90 MB. With layers, it re-copies only the few hundred KB of `application` classes.

### S5. "How do you build quickly without tests? Is that OK?"

**Answer.**
- `-DskipTests` compiles the tests but doesn't run them.
- `-Dmaven.test.skip=true` doesn't even compile them.

That's acceptable locally, for example to build a jar while debugging something unrelated. It's never acceptable in CI: the `protect-main` ruleset exists so only tested code reaches `main`.

**Example.**
```bash
./mvnw package -DskipTests                       # local only
./mvnw -Dtest=ModularityTests test               # better: run just the fast test
```

### S6. "Tests pass locally but fail in CI with `Could not find a valid Docker environment`."

**Answer.** Testcontainers needs Docker. The CI runner either has no Docker or the test isn't allowed to reach it. On GitHub Actions, `ubuntu-latest` has Docker, so check that the job runs there and not inside a container without Docker access.

**Example.** A working CI step:
```yaml
runs-on: ubuntu-latest
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-java@v4
    with: { distribution: temurin, java-version: '21', cache: maven }
  - run: ./mvnw -B verify
    working-directory: backend
```

### S7. "A security scanner reports a vulnerable library. Nobody added it directly."

**Answer.** It comes in transitively. Find the path with `dependency:tree`. Then either upgrade Spring Boot (usually the cleanest fix, because Boot patch releases pick up fixes), or override that one library's version in `<dependencyManagement>` until Boot catches up.

**Example.** Boot manages `tomcat.version`, so a quick override is one property:
```xml
<properties>
  <tomcat.version>11.0.x</tomcat.version>   <!-- patched version; remove after next Boot upgrade -->
</properties>
```

**Listen for:** "override a managed version with its property, and leave a note to remove it later".

### S8. "We want the backend and a shared library in one repo. How do you structure the POMs?"

**Answer.** Use a multi-module build: a parent POM with `<packaging>pom</packaging>` that lists the modules, each with its own POM. Running `./mvnw test` from the root builds them in dependency order.

**Example.**
```
backend/
├── pom.xml            ← <packaging>pom</packaging>, <modules><module>app</module><module>common</module></modules>
├── common/pom.xml     ← shared code
└── app/pom.xml        ← depends on common
```

This project deliberately keeps **one** Maven module and uses Spring Modulith for boundaries. Maven modules would add build complexity for something Modulith already checks in a 2-second test.

---

## Quick self-check

Can you answer each of these in one sentence?

1. Why does `postgresql` have runtime scope?
2. What does importing a BOM add to the build?
3. Which wins: a version at depth 2 or one at depth 3?
4. What's the difference between `-DskipTests` and `-Dmaven.test.skip=true`?
5. Why does this project use Testcontainers instead of H2?
6. What does `spring-modulith-starter-jpa` protect against?

<details>
<summary>Answers</summary>

1. The code only uses JDBC/JPA interfaces; the driver is needed only when the app runs.
2. Nothing by itself — it only fixes versions for dependencies you declare.
3. Depth 2 (nearest wins).
4. The first compiles tests without running them; the second doesn't compile them.
5. It needs real Postgres features (RLS, SKIP LOCKED, exclusion constraints) that H2 lacks.
6. Losing an event if the app crashes between the database commit and the listener running.

</details>
