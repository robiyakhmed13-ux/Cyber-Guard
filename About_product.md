# CyberGuard — Cybersecurity Platform

---

## What Is This In The Real World?

Imagine a large company — a bank, a hospital, an airline — with 10,000 computers, 500 servers, and thousands of employees. Every second, millions of things happen across that network: files are opened, logins are attempted, data is transferred, emails arrive.

**Somewhere in that chaos, an attacker is trying to break in.**

The company's IT security team cannot watch all of this manually. They need a **central platform** that:
- Collects all security data from every system into one place
- Alerts them when something suspicious happens
- Lets them investigate, track, and respond to attacks
- Records everything for legal and compliance purposes

This type of software is called a **SIEM** (Security Information and Event Management) platform. Real commercial products that do this include **Splunk**, **Microsoft Sentinel**, **IBM QRadar**, and **CrowdStrike**. Companies pay $500,000–$5,000,000 per year for them.

**CyberGuard is a student-built version of exactly that kind of platform.**

---

## Does It Actually Detect Attacks Automatically?

In a **real production deployment**, yes. Here is how it would work:

```
Company's servers, computers, firewalls, routers
         │
         │  (send logs and events automatically 24/7)
         ▼
   CyberGuard Backend  ←── analyses everything, creates alerts automatically
         │
         ▼
   Security Analyst's Dashboard  ←── analyst sees alerts, investigates, responds
```

A real analyst would arrive at work, open this dashboard, and already see:
- "3 new critical alerts overnight — possible ransomware on FINANCE-PC-04"
- "Unusual login from IP 185.234.12.0 — Russia — outside business hours"
- "Database query volume 400% above normal — possible data exfiltration"

They did not create those alerts. The system created them **automatically** by analysing logs from thousands of machines.

---

## Why Is Our Version Manual?

Because connecting to real company servers requires:
- Physical network access to the company
- Installing monitoring agents on hundreds of machines
- Compliance approvals and security clearances
- Enterprise infrastructure worth millions of dollars

That is not possible in a student project. So instead of **automatically detecting** real attacks from real machines, **we manually simulate** what a real system would do. The database, the APIs, the role permissions, the audit trail — all of that is real and working. Only the data source is simulated.

Think of it like a **flight simulator**. A real pilot learns on a simulator before flying real planes. The controls are real, the procedures are real, the logic is real — but no actual plane is flying.

---

## Why Does Each Feature Exist — Real-World Explanation

### Incident Response — *"Something bad happened. Let's track it."*

In a real company, when an attack is detected, a **security incident** is opened. This is like a support ticket, but for cyber attacks. It records:
- What type of attack it is (ransomware, phishing, brute force...)
- Which server or computer was affected
- Where it came from (source IP address)
- How serious it is (critical, high, medium, low)
- Who is investigating it and what they found

The incident stays **open** until the threat is contained. Then it moves to **investigating**, and finally **closed** once the system is cleaned and safe.

**Why this matters:** Without a formal incident record, different analysts might not know someone else is already handling the same attack. Evidence gets lost. Legal reporting becomes impossible.

**In our app:** You manually create incidents to simulate what a real IDS/antivirus system would generate automatically.

---

### Threat Detection — *"What attacks are happening right now?"*

A security team monitors an incoming feed of threats in real time. When an analyst sees a new ransomware alert, they need to immediately know: How many systems are affected? Is it still spreading? Is it critical or low priority?

The Threat Detection page is that **live feed** — a constantly updating list of detected threats, sorted and filtered by severity.

**In a real company:** This feed would be populated automatically every few seconds by network sensors and endpoint agents. Analysts watch it like air traffic controllers watching radar.

**In our app:** You add threats manually to simulate what those sensors would report.

---

### Threat Intelligence — *"We know this IP address belongs to a Russian hacking group. Block it everywhere."*

When security teams discover a malicious entity — a hacking group's server, a domain they use to steal passwords, a file hash from a known virus — they record it as an **Indicator of Compromise (IOC)**.

Examples of real IOCs:
- IP address `185.234.12.45` — known command-and-control server for Emotet malware
- Domain `totally-legit-bank.ru` — phishing site stealing banking credentials
- File hash `a3f5c2...` — the unique fingerprint of a ransomware executable

Once recorded, security tools across the entire company can **automatically block or flag** anything matching that IOC. If the suspicious IP tries to connect to any company server, it is blocked immediately.

**Why you create IOCs in our app:** You are building the threat intelligence database. In a real environment, this database would be shared with firewalls, email filters, and antivirus tools so they know what to block automatically. Companies also share IOCs with each other through industry groups (called ISACs) so that if one company is attacked, all companies in the industry are immediately protected.

---

### SIEM — *"Show me everything that happened, in order."*

SIEM stands for Security Information and Event Management. Every single action on every system generates a **log entry**:
- "User admin logged in from IP 10.0.0.5 at 09:14:32"
- "File encrypted on FINANCE-PC-04 at 02:17:08" ← ransomware
- "Database queried 50,000 rows at 03:45:00" ← possible data theft
- "Login failed 200 times in 60 seconds from 185.12.0.1" ← brute force attack

The SIEM collects **all of these logs from all systems** and lets analysts search through them.

**The most important use:** When an attack happens, analysts need to reconstruct exactly what occurred. "The attacker got in on Monday at 2am, moved to the finance server at 2:17am, and stole the data at 3:45am." Without logs, this is impossible to prove — to management, to lawyers, to regulators.

**In our app:** The SIEM page shows system events generated by the CyberGuard backend itself, plus the audit trail of every action performed inside the platform.

---

### Network Monitoring — *"Is everything working? Are we under attack right now?"*

A company's security team needs to know the **health of the platform** at all times:
- Is the monitoring system itself online?
- How fast is it responding?
- How many events per second is it processing?
- Is the database keeping up?

If the monitoring platform goes down, the company is blind to attacks. This page shows that everything is running correctly.

**In our app:** This page shows the real performance of the Phase III backend — actual uptime, actual request counts, actual response times, actual cache performance.

---

### Vulnerability Assessment — *"What weaknesses do we have before attackers find them?"*

Vulnerability assessment is **proactive** — you look for weaknesses in your own systems before attackers exploit them. A security team regularly scans their systems and asks:
- "Are any of our web apps vulnerable to SQL injection?"
- "Do we have servers with default passwords still set?"
- "Is there an unpatched critical CVE on our database server?"

Each finding is recorded with a CVSS severity score (an industry-standard 0–10 rating). The team then prioritises fixes — critical vulnerabilities must be patched within 24 hours, high within a week.

**In our app:** You log vulnerabilities found in your systems. The page tracks which ones are open (not yet fixed) and which are remediated (patched/closed). The severity ratings follow the real CVSS standard.

---

### Firewall — *"Block all traffic from this IP. Allow only HTTPS on port 443."*

A firewall is a security gate on the network. It reads every network packet and checks it against a **ruleset**:
- "Allow inbound traffic on port 443 (HTTPS)" ✓
- "Block all inbound traffic on port 23 (Telnet — old, insecure protocol)" ✗
- "Block all traffic from IP address 185.12.0.1 (known attacker)" ✗

Security teams maintain and review these rules. Rules that are too permissive let attackers in. Rules that are too restrictive block legitimate business traffic.

**In our app:** You manage a real ruleset — add rules, toggle them on/off, delete them. The "Run Audit Job" button simulates what a security team does regularly: run an automated check to find rules that are overly permissive, redundant, or in conflict with each other.

---

### Endpoint Security — *"Which computers in our company are infected right now?"*

An "endpoint" is any device on the network: laptops, desktops, servers, phones. **EDR** (Endpoint Detection and Response) software runs as a small agent on every device and monitors it continuously.

When malware is detected on a laptop, the EDR agent:
1. Reports the infection to the central platform (this creates an incident automatically)
2. Can isolate the laptop from the network so the malware cannot spread
3. Records everything the malware did for forensic investigation

**In our app:** The page automatically builds an inventory of all "endpoints" (target assets) that appear in your incident data. If you created an incident saying ransomware hit `finance-laptop-03`, that machine appears in the inventory as "compromised". Fix the incident, it changes to "clean".

---

### Cloud Security — *"Our AWS S3 bucket is publicly readable. Anyone on the internet can download our customer data."*

Most companies today run part of their infrastructure in the cloud (AWS, Azure, Google Cloud). Cloud resources are easy to accidentally misconfigure:
- An S3 storage bucket set to "public" instead of "private" — customer data exposed
- A Kubernetes cluster with no authentication — anyone can run code on it
- A database open to the internet on port 5432 — attackers can try to connect directly

**CSPM** (Cloud Security Posture Management) continuously scans cloud configurations and alerts the team when something is dangerously misconfigured.

**In our app:** You log cloud misconfigurations and track whether they have been resolved. The Posture Score shows you what percentage of your cloud issues are fixed. The "Run CSPM Audit" button queues a background scan job — in a real system, this would actually scan your AWS/Azure account using their APIs.

---

### Compliance — *"The regulator is auditing us. Prove that we've been monitoring for security incidents all year."*

Companies in certain industries are **legally required** to demonstrate security practices:
- Banks must follow **PCI DSS** or they cannot process credit cards
- Hospitals must follow **HIPAA** or face massive fines
- European companies must follow **GDPR** for data protection
- Publicly traded companies often need **SOC 2** certification

When a regulator audits a company, they ask for evidence:
- "Show us your incident log for the past 12 months"
- "Show us your access control policy"
- "Show us your audit trail — who accessed what data and when"

Without a proper platform, companies cannot provide this evidence and face fines of millions of dollars.

**In our app:**
- The **Compliance Score** shows how well your incidents are being managed
- The **Risk Register** shows the open threats that put you out of compliance
- The **Audit Trail** (admin only) is the permanent, tamper-evident log of every action — exactly what a regulator would request
- The **Framework Status** tab checks whether your security data meets the basic requirements of GDPR, HIPAA, PCI DSS, SOC 2, ISO 27001, and NIST

---

## The Relationship Between All Pages

Everything connects to the same database. Data you create on one page appears on other pages:

```
You create an incident on Incident Response
         │
         ├──► Threat Detection      shows it in the live threat feed
         ├──► Endpoint Security     adds the target asset to endpoint inventory
         ├──► Firewall              shows it as a network event (if DDoS/brute force)
         ├──► Vulnerability         shows it (if SQL injection/XSS/misconfiguration)
         ├──► Cloud Security        shows it (if misconfiguration/data breach)
         ├──► Compliance            adds it to the risk register if critical/high
         ├──► SIEM                  logs the creation as a system event
         └──► Workspace             updates the incident count on the Overview tab
```